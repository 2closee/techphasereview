

# Fix Free Short Course Duration Display

## Problem
When a student selects a course on the `/free-course` registration page, the duration shown is the program's original paid duration (e.g., "6 months") instead of the fixed "3 Weeks" introductory duration.

## Solution
Override the displayed duration in three places within `src/pages/FreeShortCourse.tsx`:

1. **Course dropdown items** (line 351): Change `{course.duration} {course.duration_unit}` → `3 Weeks`
2. **Summary section - selected program** (line 272): Change `{selectedProgram.duration} {selectedProgram.duration_unit}` → `3 Weeks`
3. **Any other duration references**: Ensure no other place leaks the paid duration.

This is a display-only change — the database program records keep their original duration. The free course page simply hardcodes "3 Weeks" as the introductory period.

### File: `src/pages/FreeShortCourse.tsx`
- Line 272: Replace `{selectedProgram.duration} {selectedProgram.duration_unit} • FREE` with `3 Weeks • FREE`
- Line 351: Replace `{course.name} — {course.duration} {course.duration_unit} (Free)` with `{course.name} — 3 Weeks (Free)`

No database changes needed.

