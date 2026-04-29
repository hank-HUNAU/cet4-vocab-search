"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { cet4Data, type CET4Data } from "@/data/cet4-data";
import { enrichCET4Data, normalizeToCET4Data } from "@/lib/cet4-utils";

// ─── Dataset type (matches the API response) ────────────────────────

export interface DatasetItem {
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

// ─── Context shape ──────────────────────────────────────────────────

interface DataContextShape {
  /** The current CET4Data being displayed (enriched with difficulty/frequency) */
  data: CET4Data;
  /** Whether we are using the built-in static data */
  isDefaultData: boolean;
  /** Currently active dataset ID, or null for built-in data */
  currentDatasetId: string | null;
  /** List of uploaded datasets (without full data payload) */
  datasets: DatasetItem[];
  /** Loading state for data operations */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Load a dataset from the API by ID */
  loadDataset: (id: string) => Promise<void>;
  /** Reset to the built-in static data */
  resetToDefault: () => void;
  /** Upload a file and auto-load it */
  uploadAndLoad: (
    file: File,
    name?: string,
    description?: string,
    tags?: string
  ) => Promise<void>;
  /** Delete a dataset */
  deleteDataset: (id: string) => Promise<void>;
  /** Refresh the dataset list */
  refreshDatasets: () => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

// ─── Provider ───────────────────────────────────────────────────────

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CET4Data>(() => enrichCET4Data(cet4Data));
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDefaultData = currentDatasetId === null;

  // ── Refresh dataset list ────────────────────────────────────────

  const refreshDatasets = useCallback(async () => {
    try {
      const res = await fetch("/api/datasets");
      const json = await res.json();
      if (json.success) {
        setDatasets(json.data);
      }
    } catch {
      console.error("Failed to fetch datasets");
    }
  }, []);

  // Load datasets on mount (with error guard)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    refreshDatasets().catch(() => {
      // Silently fail - datasets list is non-critical
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load dataset by ID ──────────────────────────────────────────

  const loadDataset = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/datasets?id=${id}&withData=true`);
        if (!res.ok) {
          throw new Error(`HTTP错误 ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "加载失败");
        }
        const dataField = json.data?.data;
        if (!dataField) {
          throw new Error("数据集内容为空");
        }
        const rawParsed = JSON.parse(dataField);
        // Normalize: ensure metadata, question_types, sets all exist
        const normalized = normalizeToCET4Data(rawParsed);
        const enriched = enrichCET4Data(normalized);
        setData(enriched);
        setCurrentDatasetId(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载数据集失败";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ── Reset to default ────────────────────────────────────────────

  const resetToDefault = useCallback(() => {
    setData(enrichCET4Data(cet4Data));
    setCurrentDatasetId(null);
    setError(null);
  }, []);

  // ── Upload and auto-load ────────────────────────────────────────

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
        const formData = new FormData();
        formData.append("file", file);
        if (name) formData.append("name", name);
        if (description) formData.append("description", description);
        if (tags) formData.append("tags", tags);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          throw new Error(`HTTP错误 ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "上传失败");
        }

        // Refresh dataset list
        await refreshDatasets();

        // Auto-load the uploaded dataset
        const newId: string = json.data.id;
        await loadDataset(newId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "上传失败";
        setError(msg);
        throw err; // re-throw so caller can handle
      } finally {
        setIsLoading(false);
      }
    },
    [refreshDatasets, loadDataset]
  );

  // ── Delete dataset ──────────────────────────────────────────────

  const deleteDataset = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/datasets?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error(`HTTP错误 ${res.status}`);
        }
        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || "删除失败");
        }

        // If we deleted the current dataset, reset to default
        if (currentDatasetId === id) {
          resetToDefault();
        }

        await refreshDatasets();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "删除失败";
        setError(msg);
      }
    },
    [currentDatasetId, resetToDefault, refreshDatasets]
  );

  return (
    <DataContext.Provider
      value={{
        data,
        isDefaultData,
        currentDatasetId,
        datasets,
        isLoading,
        error,
        loadDataset,
        resetToDefault,
        uploadAndLoad,
        deleteDataset,
        refreshDatasets,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────

export function useDataContext(): DataContextShape {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return ctx;
}
