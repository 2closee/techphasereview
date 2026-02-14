

# Scholarship Application System

## Overview

Add a scholarship system that allows registered students to apply for financial aid (30-100% tuition reduction) from their dashboard. Admins can review, approve, and manage scholarship applications with full visibility into applicant data.

## User Flow

1. Student registers and creates their account (existing flow)
2. Student sees a "Apply for Scholarship" button on their dashboard
3. Student fills out a scholarship application form (motivation, financial situation)
4. Admin reviews applications in a dedicated Scholarship Management page
5. Admin approves/denies with a specific discount percentage
6. Student's tuition balance is automatically adjusted
7. Student sees scholarship status and updated payment info on their dashboard

## Database Changes

### New Table: `scholarship_applications`

| Column | Type | Description |
|---|---|---|
| id | uuid (PK) | Auto-generated |
| student_id | uuid (FK) | Links to student_registrations.id |
| user_id | uuid | The student's auth user ID |
| program_id | uuid | The program they're applying for |
| employment_status | text | employed / unemployed / self-employed / student |
| household_size | integer | Number of dependents |
| monthly_income | text | Income range bracket |
| motivation | text | Why they need the scholarship (max 500 words) |
| how_training_helps | text | What they plan to do with the skills |
| supporting_info | text | Any additional context |
| requested_percentage | integer | What % they're requesting (30-100) |
| granted_percentage | integer | What % admin approved (null until decided) |
| status | text | pending / under_review / approved / denied |
| admin_notes | text | Internal notes by reviewer |
| reviewed_by | uuid | Admin who made the decision |
| reviewed_at | timestamptz | When decision was made |
| created_at | timestamptz | Application submission date |
| updated_at | timestamptz | Last update |

### RLS Policies
- Students can INSERT their own applications and SELECT their own
- Admins/super_admins can SELECT all, UPDATE all
- One application per student per program (unique constraint)

## Frontend Changes

### 1. Student Dashboard -- Scholarship CTA
- File: `src/pages/student/StudentDashboard.tsx`
- Add a prominent card/banner: "Need Financial Assistance? Apply for a Scholarship"
- Show current scholarship status if already applied (pending, approved with %, denied)
- Disable the button if already applied

### 2. New Page: Student Scholarship Application
- File: `src/pages/student/StudentScholarship.tsx`
- Form fields: employment status, household size, monthly income range, motivation statement, how training helps, requested percentage (slider 30-100%)
- Zod validation with proper limits
- Success state showing "Application submitted -- you'll be notified of the decision"

### 3. Student Sidebar Update
- File: `src/components/dashboard/DashboardSidebar.tsx`
- Add "Scholarship" nav item under student nav items

### 4. New Page: Admin Scholarship Management
- File: `src/pages/admin/AdminScholarships.tsx`
- Table view of all applications with filters (status, program, date)
- Summary stats: total applications, pending, approved, denied, average discount
- Click to expand/review individual applications
- Approve/Deny actions with percentage slider and admin notes
- View applicant's registration details and financial info side-by-side

### 5. Admin Sidebar Update
- Add "Scholarships" nav item under admin nav items

### 6. App Router
- File: `src/App.tsx`
- Add routes: `/student/scholarship` and `/admin/scholarships`

## Scholarship Impact on Payments

When a scholarship is approved:
- The student's effective tuition is recalculated: `tuition_fee * (1 - granted_percentage / 100)`
- The StudentPayments page shows the scholarship discount
- If 100% scholarship, the student's payment requirement is waived entirely
- The admin payment views reflect the scholarship adjustment

## Technical Details

### Validation (Zod schema for application form)
```
motivation: max 2000 characters, required
how_training_helps: max 1000 characters, required  
requested_percentage: integer, min 30, max 100
employment_status: enum [employed, unemployed, self_employed, student]
household_size: integer, min 1, max 20
```

### Notification Integration
- When a scholarship decision is made, create a notification for the student using the existing `notifications` table
- Notification includes the outcome and next steps

### Files to Create
- `src/pages/student/StudentScholarship.tsx` -- Application form
- `src/pages/admin/AdminScholarships.tsx` -- Admin management page

### Files to Modify
- `src/components/dashboard/DashboardSidebar.tsx` -- Add nav items
- `src/App.tsx` -- Add routes
- `src/pages/student/StudentDashboard.tsx` -- Add scholarship CTA card
- `src/pages/student/StudentPayments.tsx` -- Show scholarship discount if applicable
