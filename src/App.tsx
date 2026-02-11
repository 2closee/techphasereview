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
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
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
              <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
              <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
              
              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              <Route path="/teacher/attendance" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
              <Route path="/teacher/*" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
              
              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
              <Route path="/student/sessions" element={<ProtectedRoute allowedRoles={['student']}><StudentEnrollment /></ProtectedRoute>} />
              <Route path="/student/checkin" element={<ProtectedRoute allowedRoles={['student']}><StudentCheckIn /></ProtectedRoute>} />
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
