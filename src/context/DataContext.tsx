"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { type CET4Data } from "@/data/cet4-data";
import { enrichCET4Data, normalizeToCET4Data } from "@/lib/cet4-utils";
import {
  type DatasetMeta,
  type DatasetRecord,
  fetchIndex as githubFetchIndex,
  fetchDataset as githubFetchDataset,
  uploadDataset as githubUploadDataset,
  deleteDataset as githubDeleteDataset,
  generateDatasetId,
  getToken,
  setToken as githubSetToken,
  removeToken as githubRemoveToken,
  validateToken,
} from "@/lib/github-api";

// ─── Detect basePath for static export ──────────────────────────

const BASE_PATH =
  typeof window !== "undefined" && window.location.pathname.startsWith("/cet4-vocab-search")
    ? "/cet4-vocab-search"
    : "";

// ─── Re-export DatasetMeta as DatasetItem for backward compat ───

export type DatasetItem = DatasetMeta;

// ─── Default empty CET4Data ─────────────────────────────────────

const EMPTY_CET4_DATA: CET4Data = {
  metadata: {
    exam_year: 0,
    exam_month: 0,
    total_sets: 0,
    annotation_version: "2.0",
  },
  question_types: [
    {
      id: "banked_cloze",
      label: "词汇匹配（选词填空）",
      description: "从15个词中选出10个填入文章空白处，考查词汇语法综合运用能力",
    },
    {
      id: "reading_comprehension",
      label: "阅读理解",
      description: "阅读文章并回答问题，考查阅读理解能力",
    },
    {
      id: "listening",
      label: "听力理解",
      description: "听取录音并回答问题，考查听力理解能力",
    },
    {
      id: "translation",
      label: "段落翻译",
      description: "将中文段落翻译为英文，考查翻译能力",
    },
    {
      id: "writing",
      label: "写作",
      description: "根据提示写一篇短文，考查写作能力",
    },
  ],
  sets: [],
};

// ─── Context shape ──────────────────────────────────────────────

interface DataContextShape {
  /** The merged CET4Data from all selected datasets (enriched) */
  data: CET4Data;
  /** Map of all loaded dataset data by ID */
  datasetDataMap: Map<string, CET4Data>;
  /** Set of currently selected dataset IDs */
  selectedDatasetIds: Set<string>;
  /** All available dataset IDs */
  allDatasetIds: string[];
  /** Whether all datasets are selected */
  isAllSelected: boolean;
  /** List of dataset metadata */
  datasets: DatasetItem[];
  /** Loading state for data operations */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether GitHub PAT is configured */
  hasGitHubToken: boolean;
  /** Toggle a dataset's selection */
  toggleDataset: (id: string) => void;
  /** Select all datasets */
  selectAll: () => void;
  /** Deselect all datasets */
  deselectAll: () => void;
  /** Upload a file and auto-select it (via GitHub API) */
  uploadAndLoad: (
    file: File,
    name?: string,
    description?: string,
    tags?: string
  ) => Promise<void>;
  /** Delete a dataset (via GitHub API) */
  deleteDataset: (id: string) => Promise<void>;
  /** Refresh the dataset list from static index */
  refreshDatasets: () => Promise<void>;
  /** Set GitHub PAT */
  setGitHubToken: (token: string) => Promise<boolean>;
  /** Remove GitHub PAT */
  clearGitHubToken: () => void;
  /** Reload all datasets' data */
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

// ─── Merge selected datasets into a single CET4Data ─────────────

function mergeSelectedData(
  datasetDataMap: Map<string, CET4Data>,
  selectedIds: Set<string>
): CET4Data {
  if (selectedIds.size === 0) {
    return EMPTY_CET4_DATA;
  }

  const allSets: CET4Data["sets"] = [];
  const allQuestionTypes: CET4Data["question_types"] = [];
  let globalSetIdCounter = 0;

  for (const id of selectedIds) {
    const dsData = datasetDataMap.get(id);
    if (!dsData) continue;

    for (const set of dsData.sets ?? []) {
      globalSetIdCounter++;
      allSets.push({
        ...set,
        set_id: globalSetIdCounter,
      });
    }

    for (const qt of dsData.question_types ?? []) {
      if (!allQuestionTypes.find((existing) => existing.id === qt.id)) {
        allQuestionTypes.push(qt);
      }
    }
  }

  const question_types =
    allQuestionTypes.length > 0
      ? allQuestionTypes
      : EMPTY_CET4_DATA.question_types;

  return {
    metadata: {
      exam_year: 0,
      exam_month: 0,
      total_sets: allSets.length,
      annotation_version: "2.0",
    },
    question_types,
    sets: allSets,
  };
}

// ─── Provider ───────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [datasetDataMap, setDatasetDataMap] = useState<Map<string, CET4Data>>(
    () => new Map()
  );
  const [selectedDatasetIds, setSelectedDatasetIds] = useState<Set<string>>(
    () => new Set()
  );
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGitHubToken, setHasGitHubToken] = useState(false);

  const datasetsRef = useRef(datasets);
  datasetsRef.current = datasets;

  // Check for token on mount
  useEffect(() => {
    setHasGitHubToken(!!getToken());
  }, []);

  const allDatasetIds = useMemo(
    () => datasets.map((ds) => ds.id),
    [datasets]
  );

  const isAllSelected = useMemo(
    () =>
      allDatasetIds.length > 0 &&
      allDatasetIds.every((id) => selectedDatasetIds.has(id)),
    [allDatasetIds, selectedDatasetIds]
  );

  const data = useMemo(() => {
    const merged = mergeSelectedData(datasetDataMap, selectedDatasetIds);
    return enrichCET4Data(merged);
  }, [datasetDataMap, selectedDatasetIds]);

  // ── Load a dataset's data from static JSON file ──────────────

  const loadDatasetData = useCallback(
    async (id: string): Promise<CET4Data | null> => {
      try {
        const res = await fetch(`${BASE_PATH}/data/datasets/${id}.json`);
        if (!res.ok) {
          console.error(`Failed to load dataset ${id}: HTTP ${res.status}`);
          return null;
        }
        const record: DatasetRecord = await res.json();
        if (!record.data) {
          console.error(`Dataset ${id} has no data field`);
          return null;
        }
        const normalized = normalizeToCET4Data(record.data);
        return normalized;
      } catch (err) {
        console.error(`Error loading dataset ${id}:`, err);
        return null;
      }
    },
    []
  );

  // ── Refresh dataset list from static index ───────────────────

  const refreshDatasets = useCallback(async () => {
    try {
      // Load index.json from static files
      const res = await fetch(`${BASE_PATH}/data/index.json`);
      if (!res.ok) {
        console.warn("Failed to load index.json, trying fallback");
        // Fallback: load sample.json as a single dataset
        const sampleRes = await fetch(`${BASE_PATH}/data/sample.json`);
        if (sampleRes.ok) {
          const sampleData = await sampleRes.json();
          const normalized = normalizeToCET4Data(sampleData);
          const fallbackId = "__sample__";
          setDatasetDataMap(new Map([[fallbackId, normalized]]));
          setSelectedDatasetIds(new Set([fallbackId]));
          setDatasets([
            {
              id: fallbackId,
              name: normalized.metadata?.exam_year
                ? `CET4 ${normalized.metadata.exam_year}年${normalized.metadata.exam_month}月`
                : "CET4 示例数据",
              fileName: "sample.json",
              fileType: "json",
              fileSize: 0,
              examYear: normalized.metadata?.exam_year || null,
              examMonth: normalized.metadata?.exam_month || null,
              totalSets: normalized.sets.length,
              description: "示例数据",
              tags: "示例",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        return;
      }

      const index: DatasetMeta[] = await res.json();
      setDatasets(index);

      // Load data for datasets not yet in the map
      const currentMap = new Map<string, CET4Data>();
      setDatasetDataMap((prev) => {
        for (const [k, v] of prev) {
          currentMap.set(k, v);
        }
        return prev;
      });

      let changed = false;
      for (const ds of index) {
        if (!currentMap.has(ds.id)) {
          const data = await loadDatasetData(ds.id);
          if (data) {
            currentMap.set(ds.id, data);
            changed = true;
          }
        }
      }
      if (changed) {
        setDatasetDataMap(new Map(currentMap));
      }

      // Auto-select all if nothing selected
      if (selectedDatasetIds.size === 0 && index.length > 0) {
        setSelectedDatasetIds(new Set(index.map((d) => d.id)));
      }
    } catch (err) {
      console.error("Failed to refresh datasets:", err);
      setError("加载数据集失败");
    }
  }, [loadDatasetData, selectedDatasetIds.size]);

  // Load datasets on mount
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    refreshDatasets().catch(() => {});
  }, [refreshDatasets]);

  // ── Toggle dataset selection ──────────────────────────────────

  const toggleDataset = useCallback((id: string) => {
    setSelectedDatasetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // ── Select all ────────────────────────────────────────────────

  const selectAll = useCallback(() => {
    setSelectedDatasetIds((prev) => {
      const next = new Set(prev);
      for (const ds of datasetsRef.current) {
        next.add(ds.id);
      }
      return next;
    });
  }, []);

  // ── Deselect all ──────────────────────────────────────────────

  const deselectAll = useCallback(() => {
    setSelectedDatasetIds(new Set());
  }, []);

  // ── Upload and auto-select (via GitHub API) ───────────────────

  const uploadAndLoad = useCallback(
    async (
      file: File,
      name?: string,
      description?: string,
      tags?: string
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const normalized = normalizeToCET4Data(parsed);

        const datasetId = generateDatasetId(
          file.name,
          normalized.metadata?.exam_year,
          normalized.metadata?.exam_month
        );

        const datasetName =
          name ||
          (normalized.metadata?.exam_year && normalized.metadata?.exam_month
            ? `CET4 ${normalized.metadata.exam_year}年${normalized.metadata.exam_month}月`
            : file.name.replace(/\.json$/i, ""));

        const record: DatasetRecord = {
          id: datasetId,
          name: datasetName,
          fileName: `${datasetId}.json`,
          fileType: "json",
          fileSize: file.size,
          examYear: normalized.metadata?.exam_year || null,
          examMonth: normalized.metadata?.exam_month || null,
          totalSets: normalized.sets?.length || 0,
          description: description || null,
          tags: tags || null,
          createdAt: new Date().toISOString(),
          data: parsed, // store original parsed data
        };

        // Upload via GitHub API
        await githubUploadDataset(record);

        // Add to local state immediately (optimistic update)
        setDatasetDataMap((prev) => {
          const next = new Map(prev);
          next.set(datasetId, normalized);
          return next;
        });
        setSelectedDatasetIds((prev) => {
          const next = new Set(prev);
          next.add(datasetId);
          return next;
        });

        // Refresh index from GitHub (to get latest)
        try {
          const index = await githubFetchIndex();
          setDatasets(index);
        } catch {
          // Fallback: add to local list
          setDatasets((prev) => {
            if (prev.find((d) => d.id === datasetId)) return prev;
            return [
              ...prev,
              {
                id: record.id,
                name: record.name,
                fileName: record.fileName,
                fileType: record.fileType,
                fileSize: record.fileSize,
                examYear: record.examYear,
                examMonth: record.examMonth,
                totalSets: record.totalSets,
                description: record.description,
                tags: record.tags,
                createdAt: record.createdAt,
              },
            ];
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "上传失败";
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Delete dataset (via GitHub API) ───────────────────────────

  const deleteDataset = useCallback(async (id: string) => {
    try {
      await githubDeleteDataset(id);

      // Remove from local state
      setDatasetDataMap((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      setSelectedDatasetIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // Refresh index from GitHub
      try {
        const index = await githubFetchIndex();
        setDatasets(index);
      } catch {
        setDatasets((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "删除失败";
      setError(msg);
      throw err;
    }
  }, []);

  // ── Set GitHub Token ──────────────────────────────────────────

  const setGitHubToken = useCallback(async (token: string): Promise<boolean> => {
    const valid = await validateToken(token);
    if (valid) {
      githubSetToken(token);
      setHasGitHubToken(true);
    }
    return valid;
  }, []);

  const clearGitHubToken = useCallback(() => {
    githubRemoveToken();
    setHasGitHubToken(false);
  }, []);

  // ── Refresh all data ──────────────────────────────────────────

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newMap = new Map<string, CET4Data>();
      for (const ds of datasets) {
        const data = await loadDatasetData(ds.id);
        if (data) {
          newMap.set(ds.id, data);
        }
      }
      setDatasetDataMap(newMap);
    } catch (err) {
      console.error("Failed to refresh all data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [datasets, loadDatasetData]);

  return (
    <DataContext.Provider
      value={{
        data,
        datasetDataMap,
        selectedDatasetIds,
        allDatasetIds,
        isAllSelected,
        datasets,
        isLoading,
        error,
        hasGitHubToken,
        toggleDataset,
        selectAll,
        deselectAll,
        uploadAndLoad,
        deleteDataset,
        refreshDatasets,
        setGitHubToken,
        clearGitHubToken,
        refreshAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────

export function useDataContext(): DataContextShape {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return ctx;
}
