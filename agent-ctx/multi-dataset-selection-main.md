# Task: CET4 Multi-Dataset Selection System

## Summary of Changes

### 1. `/home/z/my-project/src/data/cet4-data.ts`
- Removed all 3 hardcoded exam sets (set_id 1, 2, 3) from the `cet4Data` export
- Set `sets: []` and `total_sets: 0`, `exam_year: 0`, `exam_month: 0`
- Kept all type definitions, helper functions (calculateDifficulty, getFrequency), and subCategoryFrequency mapping intact
- The file is now ~150 lines instead of 1500+

### 2. `/home/z/my-project/src/context/DataContext.tsx`
- Complete refactor from single-dataset to multi-dataset selection architecture
- New state: `datasetDataMap` (Map<string, CET4Data>), `selectedDatasetIds` (Set<string>)
- Computed properties: `data` (merged from all selected), `allDatasetIds`, `isAllSelected`
- New methods: `toggleDataset`, `selectAll`, `deselectAll`, `refreshAllData`
- `refreshDatasets` now loads data for all datasets that aren't already in the map
- `loadDataset` loads data and auto-selects it
- `uploadAndLoad` auto-selects new datasets
- `deleteDataset` removes from map, selection, and list
- `mergeSelectedData` function combines sets from all selected datasets with unique set_ids

### 3. `/home/z/my-project/src/app/api/upload/route.ts`
- Created new POST handler for JSON file upload
- Accepts multipart/form-data with file, name, description, tags fields
- Validates JSON format and checks for duplicate names
- Extracts metadata (exam_year, exam_month, totalSets) from the file
- Saves to Dataset table via Prisma

### 4. `/home/z/my-project/src/app/page.tsx`
- **DataSourceSelector**: Replaced single `<Select>` dropdown with checkbox-based selection
  - "全选" checkbox at top for select/deselect all
  - Each dataset shown with checkbox, name, year/month badge, sets count badge
  - Shows "已选择 X/Y 个数据集" counter
  - No built-in data option (removed since sets are empty)
  - Expandable section with scrollable dataset list
  
- **HomePage**: Removed `isDefaultData` references, updated to use `selectedDatasetIds` and `datasets`
  - Header badge shows "X个数据集" or "未选择"
  - Empty state messages improved: "请先上传数据集" or "请在上方勾选数据集"

- **DataUploadTab**: Updated to use `selectedDatasetIds` instead of `currentDatasetId`
  - Each dataset row has a checkbox for selection
  - "当前加载" badge replaced with "已选中" badge
  - Removed separate "load dataset" button (checkbox handles it)

- **Null safety**: Added `?? []` safety checks for `data.sets`, `data.question_types` throughout

## Architecture Decisions
- Built-in data is empty (no default data) - all data comes from uploaded datasets
- Multiple datasets can be selected simultaneously via checkboxes
- Merged data combines sets from all selected datasets with unique set_ids (sequential numbering)
- When datasets are refreshed on mount, their data is also loaded into the map
- The `enrichCET4Data` function is applied after merging, ensuring all sets have proper difficulty/frequency
