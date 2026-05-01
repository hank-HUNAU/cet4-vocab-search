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

// ─── Detect static deployment (GitHub Pages) ──────────────────────
// When running on GitHub Pages, API routes are unavailable.
// We detect this by checking if the basePath prefix is present.

const IS_STATIC_EXPORT = typeof window !== "undefined" && process.env.NODE_ENV === "production" && !window.location.hostname.includes("space-z.ai") && !window.location.hostname.includes("localhost");

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

// ─── Default empty CET4Data ─────────────────────────────────────────

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

// ─── Context shape ──────────────────────────────────────────────────

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
  /** Whether running in static export mode (GitHub Pages) */
  isStaticMode: boolean;
  /** List of uploaded datasets (without full data payload) */
  datasets: DatasetItem[];
  /** Loading state for data operations */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Toggle a dataset's selection */
  toggleDataset: (id: string) => void;
  /** Select all datasets */
  selectAll: () => void;
  /** Deselect all datasets */
  deselectAll: () => void;
  /** Load a dataset's data from the API by ID (adds to map & auto-selects) */
  loadDataset: (id: string) => Promise<void>;
  /** Upload a file and auto-select it */
  uploadAndLoad: (
    file: File,
    name?: string,
    description?: string,
    tags?: string
  ) => Promise<void>;
  /** Delete a dataset */
  deleteDataset: (id: string) => Promise<void>;
  /** Refresh the dataset list and load all data */
  refreshDatasets: () => Promise<void>;
  /** Reload all datasets' data */
  refreshAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

// ─── Merge selected datasets into a single CET4Data ────────────────

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
      // Prefix set_id with dataset info to make unique across datasets
      allSets.push({
        ...set,
        set_id: globalSetIdCounter,
      });
    }

    // Deduplicate question_types
    for (const qt of dsData.question_types ?? []) {
      if (!allQuestionTypes.find((existing) => existing.id === qt.id)) {
        allQuestionTypes.push(qt);
      }
    }
  }

  // If no question types found, use defaults
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

// ─── Provider ───────────────────────────────────────────────────────

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

  // Ref to access current datasets in callbacks without dependency
  const datasetsRef = useRef(datasets);
  datasetsRef.current = datasets;

  // Computed: all dataset IDs
  const allDatasetIds = useMemo(
    () => datasets.map((ds) => ds.id),
    [datasets]
  );

  // Computed: whether all are selected
  const isAllSelected = useMemo(
    () => allDatasetIds.length > 0 && allDatasetIds.every((id) => selectedDatasetIds.has(id)),
    [allDatasetIds, selectedDatasetIds]
  );

  // Computed: merged data from all selected datasets
  const data = useMemo(() => {
    const merged = mergeSelectedData(datasetDataMap, selectedDatasetIds);
    return enrichCET4Data(merged);
  }, [datasetDataMap, selectedDatasetIds]);

  // ── Internal: load data for a single dataset (no state change for selection) ──

  const loadDatasetData = useCallback(async (id: string): Promise<CET4Data | null> => {
    try {
      const res = await fetch(`/api/datasets?id=${id}&withData=true`);
      if (!res.ok) {
        console.error(`Failed to load dataset ${id}: HTTP ${res.status}`);
        return null;
      }
      const json = await res.json();
      if (!json.success) {
        console.error(`Failed to load dataset ${id}: ${json.error}`);
        return null;
      }
      const dataField = json.data?.data;
      if (!dataField) {
        console.error(`Dataset ${id} has no data`);
        return null;
      }
      const rawParsed = JSON.parse(dataField);
      const normalized = normalizeToCET4Data(rawParsed);
      return normalized;
    } catch (err) {
      console.error(`Error loading dataset ${id}:`, err);
      return null;
    }
  }, []);

  // ── Load static fallback data (for GitHub Pages) ─────────────────

  const loadStaticFallbackData = useCallback(async (): Promise<boolean> => {
    try {
      // Determine basePath for static export
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
      const res = await fetch(`${basePath}/data/sample.json`);
      if (!res.ok) return false;
      const rawParsed = await res.json();
      const normalized = normalizeToCET4Data(rawParsed);
      if (!normalized || !normalized.sets || normalized.sets.length === 0) return false;

      const staticId = "__static_sample__";
      setDatasetDataMap(new Map([[staticId, normalized]]));
      setSelectedDatasetIds(new Set([staticId]));
      setDatasets([
        {
          id: staticId,
          name: normalized.metadata?.exam_year ? `CET4 ${normalized.metadata.exam_year}年${normalized.metadata.exam_month}月` : "CET4 示例数据",
          fileName: "sample.json",
          fileType: "json",
          fileSize: 0,
          examYear: normalized.metadata?.exam_year || null,
          examMonth: normalized.metadata?.exam_month || null,
          totalSets: normalized.sets.length,
          description: "静态示例数据（GitHub Pages 模式）",
          tags: "示例",
          createdAt: new Date().toISOString(),
        },
      ]);
      return true;
    } catch (err) {
      console.error("Failed to load static fallback data:", err);
      return false;
    }
  }, []);

  // ── Refresh dataset list ────────────────────────────────────────

  const refreshDatasets = useCallback(async () => {
    // Static export mode: load from static JSON file
    if (IS_STATIC_EXPORT) {
      await loadStaticFallbackData();
      return;
    }

    try {
      const res = await fetch("/api/datasets");
      const json = await res.json();
      if (json.success) {
        const datasetList: DatasetItem[] = json.data;
        setDatasets(datasetList);

        // Load data for all datasets that we don't already have
        // Use functional update to avoid stale closure
        const currentMap = new Map<string, CET4Data>();
        // Get current map snapshot
        setDatasetDataMap((prev) => {
          for (const [k, v] of prev) {
            currentMap.set(k, v);
          }
          return prev; // no change yet
        });

        let changed = false;
        for (const ds of datasetList) {
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
      }
    } catch {
      // API failed — try static fallback
      console.warn("API unavailable, trying static fallback data...");
      await loadStaticFallbackData();
    }
  }, [loadDatasetData, loadStaticFallbackData]);

  // Load datasets on mount
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    refreshDatasets().catch(() => {
      // Silently fail - datasets list is non-critical
    });
  }, []);

  // ── Toggle dataset selection ────────────────────────────────────

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

  // ── Select all ──────────────────────────────────────────────────

  const selectAll = useCallback(() => {
    setSelectedDatasetIds((prev) => {
      const next = new Set(prev);
      // Add all dataset IDs from the current datasets list (using ref to avoid dependency)
      for (const ds of datasetsRef.current) {
        next.add(ds.id);
      }
      return next;
    });
  }, []);

  // ── Deselect all ────────────────────────────────────────────────

  const deselectAll = useCallback(() => {
    setSelectedDatasetIds(new Set());
  }, []);

  // ── Load dataset by ID (load data + auto-select) ───────────────

  const loadDataset = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      try {
        // Always load fresh data from API
        const normalized = await loadDatasetData(id);
        if (!normalized) {
          throw new Error("数据集内容为空或加载失败");
        }
        setDatasetDataMap((prev) => {
          const next = new Map(prev);
          next.set(id, normalized);
          return next;
        });
        // Auto-select
        setSelectedDatasetIds((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "加载数据集失败";
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadDatasetData]
  );

  // ── Upload and auto-select ──────────────────────────────────────

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

        // Auto-load and select the uploaded dataset
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

        // Remove from data map
        setDatasetDataMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });

        // Remove from selection
        setSelectedDatasetIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        await refreshDatasets();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "删除失败";
        setError(msg);
      }
    },
    [refreshDatasets]
  );

  // ── Refresh all data ────────────────────────────────────────────

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
        isStaticMode: IS_STATIC_EXPORT,
        datasets,
        isLoading,
        error,
        toggleDataset,
        selectAll,
        deselectAll,
        loadDataset,
        uploadAndLoad,
        deleteDataset,
        refreshDatasets,
        refreshAllData,
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
