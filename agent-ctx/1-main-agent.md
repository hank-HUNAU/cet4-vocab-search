# Task: Implement JSON File Upload with Data Refresh for CET4 Annotation System

## Summary
Successfully implemented the data upload and dynamic data refresh system for the CET4 annotation system. All 5 tabs now use dynamic data from a React context, and users can upload JSON files that replace/augment the static data.

## Files Created
1. `/home/z/my-project/src/lib/cet4-utils.ts` - Parameterized utility functions that accept `CET4Data` as input
2. `/home/z/my-project/src/context/DataContext.tsx` - React context provider with data management methods

## Files Modified
1. `/home/z/my-project/src/app/layout.tsx` - Wrapped with DataProvider and added SonnerToaster
2. `/home/z/my-project/src/app/page.tsx` - Complete rewrite to use dynamic data from context

## Key Changes

### cet4-utils.ts
- All helper functions now accept `CET4Data` as first parameter
- Added `enrichCET4Data()` to compute missing difficulty/frequency fields
- `getWordPartOfSpeechDistribution()` uses grammar-based classification (works for any data)
- `calculateDifficulty()` and `getFrequency()` exported for reuse

### DataContext.tsx
- Holds current `CET4Data` state, defaults to static `cet4Data`
- Provides: `loadDataset()`, `resetToDefault()`, `uploadAndLoad()`, `deleteDataset()`, `refreshDatasets()`
- Tracks `isLoading`, `error`, `currentDatasetId`, `datasets` list
- Auto-enriches uploaded data with difficulty/frequency calculations

### page.tsx
- All 5 tabs now accept `{ data: CET4Data }` prop and use parameterized utils
- `DataUploadTab` uses context methods for upload/delete
- New `DataSourceSelector` component above tabs for dataset switching
- Select dropdown to switch between built-in and uploaded datasets
- "恢复默认数据" button when using custom data
- Dataset list with load/export/delete buttons
- Toast notifications via sonner for upload/delete operations
- Dynamic set filter in QuestionSearchTab (not hardcoded to 3 sets)
- Footer shows dynamic data source info

### layout.tsx
- Wrapped children with `<DataProvider>`
- Added `<SonnerToaster />` for toast notifications

## Testing
- `bun run lint` passes with no errors
- Dev server compiles and serves successfully
- API endpoints `/api/datasets` and `/api/upload` respond correctly
