import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import PracticeWorkspace from '@/components/practice/PracticeWorkspace';

export default function StudentPractice() {
  return (
    <DashboardLayout title="Coding Practice">
      <PracticeWorkspace />
    </DashboardLayout>
  );
}
