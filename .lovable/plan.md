

# Auto-Create Batches and Bulk Batch Assignment

## Problem Summary

1. **No batches exist** for some program+location combinations, so the batch assignment dropdown shows "No batches available" and the admin is stuck.
2. There is no way to **assign batches in bulk** to multiple students at once -- the admin must open each student's detail dialog individually.

## Solution

### 1. Auto-Create Batch in BatchAssignment Component

When the admin selects a Program and Location but no batches exist, the system will automatically offer to create one. A "Create New Batch" button will appear in the batch dropdown area, which creates a new batch (batch_number = next sequential number) for that program+location pair and selects it.

### 2. Bulk Batch Assignment

Add a **checkbox selection system** to the student registrations table so the admin can select multiple students, then assign them all to a batch in one action.

- Each row in the table gets a checkbox
- A "Select All (on page)" checkbox appears in the table header
- When students are selected, a floating action bar appears with a "Bulk Assign to Batch" button
- Clicking it opens a dialog with Program, Location, and Batch dropdowns (with auto-create support)
- On confirm, all selected students are updated and batch counts are adjusted

---

## Changes

### File: `src/components/admin/BatchAssignment.tsx`

- Add a "Create New Batch" button that appears when no batches exist for the selected program+location
- The button creates a new `course_batches` row with `batch_number` = max existing + 1 (or 1 if none exist), `max_students` = 15, `status` = 'open'
- After creation, auto-select the new batch

### File: `src/pages/admin/AdminStudents.tsx`

- Add `selectedStudents` state (Set of registration IDs) for checkbox tracking
- Add checkboxes to each table row and a "select all on page" checkbox in the header
- Add a bulk action bar that appears when students are selected, showing count and a "Bulk Assign to Batch" button
- Add a bulk assignment dialog containing Program/Location/Batch selects (reusing the same cascading logic from BatchAssignment) with auto-create batch support
- The bulk assign function loops through selected students, updates their `batch_id`, `program_id`, and `preferred_location_id`, and increments batch `current_count` accordingly
- Only students with status "approved" or "enrolled" can be bulk-assigned (others are skipped with a warning)

---

## Technical Details

**Auto-create batch logic (in BatchAssignment and bulk dialog):**

```text
1. Admin selects Program + Location
2. Query: SELECT MAX(batch_number) FROM course_batches WHERE program_id = X AND location_id = Y
3. If no batches or all full -> show "Create New Batch" button
4. On click: INSERT INTO course_batches (program_id, location_id, batch_number, max_students, status)
   VALUES (X, Y, max+1, 15, 'open')
5. Refresh batch list and auto-select the new batch
```

**Bulk assignment logic:**

```text
1. Admin checks multiple students via checkboxes
2. Clicks "Bulk Assign to Batch" in the floating bar
3. Selects Program, Location, Batch (or creates a new one)
4. System filters: only approved/enrolled students proceed
5. For each student:
   a. If student had a previous batch_id, decrement old batch count
   b. Update student_registrations with new batch_id, program_id, preferred_location_id
6. After all updates: set new batch current_count = previous count + number of newly assigned students
7. If new count >= max_students, set batch status to 'full'
8. Show summary toast: "X students assigned, Y skipped (wrong status)"
```

No database migrations are needed -- all required tables and columns already exist.

