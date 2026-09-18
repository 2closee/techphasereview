import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PracticeReport from '@/components/practice/PracticeReport';

export default function AdminPractice() {
  return (
    <DashboardLayout title="Coding Practice Progress">
      <PracticeReport />
    </DashboardLayout>
  );
}
