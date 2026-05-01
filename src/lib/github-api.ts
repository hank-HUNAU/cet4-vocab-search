/**
 * GitHub Contents API utility for managing data files in the repository.
 *
 * All data (datasets + index) are stored as JSON files in the repo under
 * `public/data/`.  This module provides CRUD helpers that commit changes
 * via the GitHub REST API, which in turn triggers the GitHub Actions
 * workflow to rebuild & deploy the static site.
 *
 * Authentication: a GitHub Personal Access Token (classic or fine-grained)
 * with `repo` scope is required and stored in localStorage.
 */

// ─── Configuration ──────────────────────────────────────────────

const REPO_OWNER = "hank-HUNAU";
const REPO_NAME = "cet4-vocab-search";
const BRANCH = "main";
const DATA_DIR = "public/data"; // base path in repo
const DATASETS_DIR = `${DATA_DIR}/datasets`; // individual dataset files
const INDEX_PATH = `${DATA_DIR}/index.json`; // dataset index
const GITHUB_API = "https://api.github.com";

// ─── Types ──────────────────────────────────────────────────────

export interface DatasetMeta {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  examYear: number | null;
  examMonth: number | null;
  totalSets: number | null;
  description: string | null;
  tags: string | null;
  createdAt: string;
}

export interface DatasetRecord extends DatasetMeta {
  /** The raw CET4Data JSON (stored as the `data` field) */
  data: unknown;
}

// ─── Token helpers ──────────────────────────────────────────────

const TOKEN_KEY = "cet4_github_pat";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

// ─── Low-level GitHub API ──────────────────────────────────────

interface GitHubFileResponse {
  content: string; // base64
  sha: string;
  path: string;
}

async function githubFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("未设置 GitHub Personal Access Token，请先在管理面板中配置");

  const url = path.startsWith("http") ? path : `${GITHUB_API}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = `GitHub API 错误 (${res.status})`;
    try {
      const parsed = JSON.parse(body);
      msg = parsed.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  // 204 No Content for deletes
  if (res.status === 204) return {} as T;
  return res.json();
}

/** Read a file from the repo (returns base64 content + sha) */
async function getFile(path: string): Promise<GitHubFileResponse> {
  return githubFetch<GitHubFileResponse>(
    `/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`
  );
}

/** Create or update a file in the repo */
async function putFile(
  path: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    branch: BRANCH,
    content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
  };
  if (sha) body.sha = sha;

  await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Delete a file from the repo */
async function deleteFile(
  path: string,
  message: string,
  sha: string
): Promise<void> {
  await githubFetch(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, branch: BRANCH, sha }),
  });
}

// ─── High-level dataset operations ──────────────────────────────

/** Read the dataset index from the repo */
export async function fetchIndex(): Promise<DatasetMeta[]> {
  try {
    const file = await getFile(INDEX_PATH);
    const text = decodeURIComponent(
      escape(atob(file.content.replace(/\n/g, "")))
    );
    return JSON.parse(text) as DatasetMeta[];
  } catch {
    return [];
  }
}

/** Read a single dataset (with full data) from the repo */
export async function fetchDataset(id: string): Promise<DatasetRecord | null> {
  try {
    const fileName = `${id}.json`;
    const file = await getFile(`${DATASETS_DIR}/${fileName}`);
    const text = decodeURIComponent(
      escape(atob(file.content.replace(/\n/g, "")))
    );
    return JSON.parse(text) as DatasetRecord;
  } catch {
    return null;
  }
}

/** Upload a new dataset (add file + update index) */
export async function uploadDataset(
  dataset: DatasetRecord
): Promise<void> {
  // 1. Write the dataset file
  const datasetPath = `${DATASETS_DIR}/${dataset.fileName}`;
  await putFile(
    datasetPath,
    JSON.stringify(dataset.data, null, 2),
    `feat: add dataset ${dataset.name}`
  );

  // 2. Update the index
  try {
    const indexFile = await getFile(INDEX_PATH);
    const indexText = decodeURIComponent(
      escape(atob(indexFile.content.replace(/\n/g, "")))
    );
    const index: DatasetMeta[] = JSON.parse(indexText);

    // Add new entry (avoid duplicates)
    if (!index.find((d) => d.id === dataset.id)) {
      index.push({
        id: dataset.id,
        name: dataset.name,
        fileName: dataset.fileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        examYear: dataset.examYear,
        examMonth: dataset.examMonth,
        totalSets: dataset.totalSets,
        description: dataset.description,
        tags: dataset.tags,
        createdAt: dataset.createdAt,
      });
    }

    await putFile(
      INDEX_PATH,
      JSON.stringify(index, null, 2),
      `chore: update index - add ${dataset.name}`,
      indexFile.sha
    );
  } catch {
    // Index doesn't exist yet — create it
    const index: DatasetMeta[] = [
      {
        id: dataset.id,
        name: dataset.name,
        fileName: dataset.fileName,
        fileType: dataset.fileType,
        fileSize: dataset.fileSize,
        examYear: dataset.examYear,
        examMonth: dataset.examMonth,
        totalSets: dataset.totalSets,
        description: dataset.description,
        tags: dataset.tags,
        createdAt: dataset.createdAt,
      },
    ];
    await putFile(
      INDEX_PATH,
      JSON.stringify(index, null, 2),
      `chore: create index with ${dataset.name}`
    );
  }
}

/** Delete a dataset (remove file + update index) */
export async function deleteDataset(id: string): Promise<void> {
  // 1. Delete the dataset file
  const datasetPath = `${DATASETS_DIR}/${id}.json`;
  const datasetFile = await getFile(datasetPath);
  await deleteFile(
    datasetPath,
    `chore: remove dataset ${id}`,
    datasetFile.sha
  );

  // 2. Update the index
  try {
    const indexFile = await getFile(INDEX_PATH);
    const indexText = decodeURIComponent(
      escape(atob(indexFile.content.replace(/\n/g, "")))
    );
    const index: DatasetMeta[] = JSON.parse(indexText);
    const filtered = index.filter((d) => d.id !== id);

    await putFile(
      INDEX_PATH,
      JSON.stringify(filtered, null, 2),
      `chore: update index - remove ${id}`,
      indexFile.sha
    );
  } catch {
    // Index might not exist, that's OK
  }
}

/** Validate a GitHub PAT by fetching repo info */
export async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Generate a unique dataset ID from file name and metadata */
export function generateDatasetId(
  fileName: string,
  examYear?: number | null,
  examMonth?: number | null
): string {
  if (examYear && examMonth) {
    return `cet4-${examYear}-${String(examMonth).padStart(2, "0")}`;
  }
  // Derive from file name
  return fileName.replace(/\.json$/i, "").replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]/g, "-");
}
