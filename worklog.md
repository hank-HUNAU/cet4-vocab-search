---
Task ID: 1
Agent: Main Agent
Task: Fix JSON upload functionality and complete pending TODO items

Work Log:
- Read and analyzed all key files: page.tsx, DataContext.tsx, cet4-data.ts, cet4-utils.ts, upload/route.ts, datasets/route.ts
- Identified the root cause: Upload tab was hidden when no data was loaded (hasData === false)
- Fixed page.tsx: Made all tabs (including upload) always visible
- Added "前往上传数据" button in the no-data prompt to guide users to the upload tab
- Fixed DataSourceSelector: auto-expand when no data is selected
- Verified checkbox/select-all functionality is already properly implemented in DataSourceSelector and DataUploadTab
- Verified filtering logic: DataContext.mergeSelectedData only merges selected datasets
- Verified .map() error is fixed: all .map() calls have defensive ?? [] checks
- Verified 2015年6月 data: database is empty, cet4-data.ts has sets: [], nothing to delete
- Built and tested the project successfully
- Tested upload API with sample JSON files - works correctly
- Tested dataset listing and data loading APIs - works correctly
- Cleaned up test data from database

Stage Summary:
- Main fix: Upload tab is now always accessible regardless of data state
- All 4 original TODO items are now complete
- Build succeeds, API tested and working
