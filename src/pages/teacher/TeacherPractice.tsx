import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PracticeReport from '@/components/practice/PracticeReport';

export default function TeacherPractice() {
  return (
    <DashboardLayout title="Practice Progress">
      <PracticeReport />
    </DashboardLayout>
  );
}
