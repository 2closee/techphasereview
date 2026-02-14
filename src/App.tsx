import { Toaster } from "@/components/ui/toaster";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminSessions from "./pages/admin/AdminSessions";
import AdminGeolocationAttendance from "./pages/admin/AdminGeolocationAttendance";
import StudentCheckIn from "./pages/student/StudentCheckIn";
import StudentEnrollment from "./pages/student/StudentEnrollment";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StudentRegistration from "./pages/StudentRegistration";
import CompleteEnrollment from "./pages/CompleteEnrollment";
import AdminAuth from "./pages/AdminAuth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTeachers from "./pages/admin/AdminTeachers";
import AdminBatches from "./pages/admin/AdminBatches";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import AccountantRegistrations from "./pages/accountant/AccountantRegistrations";
import AccountantPayments from "./pages/accountant/AccountantPayments";
import AccountantReports from "./pages/accountant/AccountantReports";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherGrades from "./pages/teacher/TeacherGrades";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCourses from "./pages/student/StudentCourses";
import StudentGrades from "./pages/student/StudentGrades";
import StudentPayments from "./pages/student/StudentPayments";
import StudentScholarship from "./pages/student/StudentScholarship";
import StudentProfile from "./pages/student/StudentProfile";
import AdminScholarships from "./pages/admin/AdminScholarships";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/register" element={<StudentRegistration />} />
              <Route path="/complete-enrollment" element={<CompleteEnrollment />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/programs" element={<ProtectedRoute allowedRoles={['admin']}><AdminPrograms /></ProtectedRoute>} />
              <Route path="/admin/students" element={<ProtectedRoute allowedRoles={['admin']}><AdminStudents /></ProtectedRoute>} />
              <Route path="/admin/teachers" element={<ProtectedRoute allowedRoles={['admin']}><AdminTeachers /></ProtectedRoute>} />
              <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={['admin']}><AdminBatches /></ProtectedRoute>} />
              <Route path="/admin/staff" element={<ProtectedRoute allowedRoles={['admin']}><AdminStaff /></ProtectedRoute>} />
              <Route path="/admin/locations" element={<ProtectedRoute allowedRoles={['admin']}><AdminLocations /></ProtectedRoute>} />
              <Route path="/admin/sessions" element={<ProtectedRoute allowedRoles={['admin']}><AdminSessions /></ProtectedRoute>} />
              <Route path="/admin/attendance" element={<ProtectedRoute allowedRoles={['admin']}><AdminAttendance /></ProtectedRoute>} />
              <Route path="/admin/geolocation" element={<ProtectedRoute allowedRoles={['admin']}><AdminGeolocationAttendance /></ProtectedRoute>} />
              <Route path="/admin/payments" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayments /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />
              <Route path="/admin/scholarships" element={<ProtectedRoute allowedRoles={['admin']}><AdminScholarships /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              
              {/* Accountant Routes */}
              <Route path="/accountant" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
              <Route path="/accountant/registrations" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantRegistrations /></ProtectedRoute>} />
              <Route path="/accountant/payments" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantPayments /></ProtectedRoute>} />
              <Route path="/accountant/reports" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantReports /></ProtectedRoute>} />
              <Route path="/accountant/*" element={<ProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></ProtectedRoute>} />
              
              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/classes" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
              <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudents /></ProtectedRoute>} />
              <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
              <Route path="/teacher/timetable" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherTimetable /></ProtectedRoute>} />
              <Route path="/teacher/grades" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherGrades /></ProtectedRoute>} />
              <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProfile /></ProtectedRoute>} />
              <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              
              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={['student']}><StudentEnrollment /></ProtectedRoute>} />
              <Route path="/student/checkin" element={<ProtectedRoute allowedRoles={['student']}><StudentCheckIn /></ProtectedRoute>} />
              <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['student']}><StudentCourses /></ProtectedRoute>} />
              <Route path="/student/grades" element={<ProtectedRoute allowedRoles={['student']}><StudentGrades /></ProtectedRoute>} />
              <Route path="/student/payments" element={<ProtectedRoute allowedRoles={['student']}><StudentPayments /></ProtectedRoute>} />
              <Route path="/student/scholarship" element={<ProtectedRoute allowedRoles={['student']}><StudentScholarship /></ProtectedRoute>} />
              <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
              <Route path="/student/*" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
