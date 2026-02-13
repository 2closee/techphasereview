

# Fix: Reorder Migration SQL to Avoid Missing Table Error

## Problem

The migration script defines functions (`has_role`, `is_super_admin`, `get_user_role`) in Part 2 (line 24-45) that reference `public.user_roles`, but that table is not created until Part 3 (line 89). PostgreSQL validates table references at function creation time, causing the error.

## Solution

Restructure `NEW_PROJECT_MIGRATION.sql` so that:

1. **Enum** is created first (no change)
2. **All tables** are created next (profiles, user_roles, settings, notifications, then all LMS tables) -- but **without RLS policies** yet
3. **Functions** are created after tables exist
4. **Triggers** are created after functions exist
5. **RLS policies** are applied last (since they reference the functions)

This is purely a reordering of the same SQL statements. No logic changes.

## Technical Details

The new section order in the file:

```text
PART 1: Enums (app_role)
PART 2: All CREATE TABLE statements (no policies, no triggers)
PART 3: All ALTER TABLE ... ENABLE ROW LEVEL SECURITY
PART 4: All functions (has_role, is_super_admin, handle_new_user, etc.)
PART 5: All triggers
PART 6: All RLS policies
PART 7: Storage buckets + seed data
```

## What You Need To Do

Since you already ran part of the script and some objects may exist:

1. I will regenerate the **complete fixed script**
2. You will need to either:
   - **Drop what was partially created** and re-run the full fixed script, OR
   - **Run only the remaining parts** that failed

I will include a cleanup preamble (`DROP TABLE IF EXISTS ... CASCADE`) at the top so you can safely re-run the entire script from scratch on the same project.

