

# CSV Export and Manual Batch/Course Assignment for Super Admin

## Feature 1: CSV Export of Student Applications

Add a "Download CSV" button to the `AdminStudents.tsx` page that exports the currently filtered student registration data.

### How it works
- A new "Download CSV" button will appear next to the status filter dropdown
- It exports the currently visible (filtered) registrations
- The CSV will include: Name, Email, Phone, Gender, Date of Birth, Address, City, State, Program, Location, Education Level, Previous Experience, Emergency Contact, Status, Payment Status, Matriculation Number, Applied Date
- Pure client-side implementation -- no edge function needed

### Changes
- **`src/pages/admin/AdminStudents.tsx`**: Add a `Download` icon import, a `downloadCSV` helper function that converts the `filteredRegistrations` array to CSV text and triggers a browser download, and a Button in the filters bar

---

## Feature 2: Manual Student-to-Batch Assignment

Add the ability to manually assign a student to a specific program, location, and batch from the student detail dialog in `AdminStudents.tsx`.

### How it works
- In the student detail dialog, a new "Assign to Batch" section appears for students who are approved or enrolled but not yet assigned to a batch
- The admin selects a Program, Location, and then an available Batch (filtered by program + location)
- On confirmation, the student's `program_id`, `preferred_location_id`, and `batch_id` are updated, and the batch's `current_count` is incremented
- Students already assigned to a batch will show their current assignment with an option to reassign

### Changes
- **`src/pages/admin/AdminStudents.tsx`**:
  - Expand the `Registration` type to include `batch_id`, `preferred_location_id`, and related fields
  - Add state for programs list, locations list, and batches list (fetched on dialog open)
  - Add an "Assign to Batch" section in the detail dialog with three Select dropdowns (Program, Location, Batch)
  - Add an `assignToBatch` function that updates `student_registrations` and increments the batch count
  - No database migration needed -- all required columns (`batch_id`, `program_id`, `preferred_location_id`) already exist on `student_registrations`

### Technical Details

**CSV Export function outline:**
```text
1. Map filteredRegistrations to flat row objects
2. Generate CSV header from column keys
3. Join rows with commas, escaping values containing commas/quotes
4. Create a Blob, generate object URL, trigger download via hidden anchor
```

**Batch assignment flow:**
```text
1. Admin opens student detail dialog
2. Admin clicks "Assign to Batch" (or sees current assignment)
3. Selects Program -> fetches locations offering that program
4. Selects Location -> fetches open/full batches for that program+location
5. Selects Batch -> clicks "Assign"
6. System updates student_registrations.batch_id, program_id, preferred_location_id
7. System increments course_batches.current_count
8. If count reaches max, batch status auto-updates to 'full'
```

No new database tables or migrations are required. All operations use existing columns and RLS policies that already grant admin/super_admin full access.

