import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RoleGuard, GuestGuard } from "@/components/auth/RoleGuard";
import { LanguageProvider } from "@/components/common/LanguageProvider";
import "@/lib/i18n";

// Auth Pages
import LoginPage from "@/pages/auth/Login";
import SignupPage from "@/pages/auth/Signup";
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import AccountDisabledPage from "@/pages/auth/AccountDisabled";

// Doctor Pages
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorAppointments from "@/pages/doctor/Appointments";
import CreateAppointment from "@/pages/doctor/CreateAppointment";
import DoctorPatients from "@/pages/doctor/Patients";
import DoctorPrescriptions from "@/pages/doctor/Prescriptions";
import CreatePrescription from "@/pages/doctor/CreatePrescription";
import DoctorLabRequests from "@/pages/doctor/LabRequests";
import CreateLabRequest from "@/pages/doctor/CreateLabRequest";
import DoctorLabResults from "@/pages/doctor/LabResults";
import FindPatient from "@/pages/doctor/FindPatient";
import DoctorChat from "@/pages/doctor/Chat";
import DoctorProfile from "@/pages/doctor/Profile";
import ManageAvailability from "@/pages/doctor/ManageAvailability";
import AIModels from "@/pages/doctor/AIModels";

// Lab Pages
import LabDashboard from "@/pages/lab/LabDashboard";
import LabRequests from "@/pages/lab/Requests";
import UploadResult from "@/pages/lab/UploadResult";
import LabResults from "@/pages/lab/Results";
import LabProfile from "@/pages/lab/Profile";

// Admin Pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminPolicies from "@/pages/admin/Policies";
import CreatePolicy from "@/pages/admin/CreatePolicy";
import AdminProfile from "@/pages/admin/Profile";
import AdminUserDetails from "@/pages/admin/UserDetails";
import EditPolicy from "@/pages/admin/EditPolicy";
import AdminStatistics from "@/pages/admin/Statistics";

// Lab Pages (More)
import LabRequestDetails from "@/pages/lab/RequestDetails";
import EditResult from "@/pages/lab/EditResult";

// Patient Pages
import PatientDashboard from "@/pages/patient/PatientDashboard";
import PatientAppointments from "@/pages/patient/Appointments";
import PatientPrescriptions from "@/pages/patient/Prescriptions";
import PatientLabResults from "@/pages/patient/LabResults";
import PatientChat from "@/pages/patient/Chat";
import PatientProfile from "@/pages/patient/Profile";
import UploadDocument from "@/pages/patient/UploadDocument";
import BookAppointment from "@/pages/patient/BookAppointment";
import VideoRoom from "@/pages/common/VideoRoom";

// Doctor Pages (More)
import PatientDetails from "@/pages/doctor/PatientDetails";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<GuestGuard><LoginPage /></GuestGuard>} />
              <Route path="/signup" element={<GuestGuard><SignupPage /></GuestGuard>} />
              <Route path="/forgot-password" element={<GuestGuard><ForgotPasswordPage /></GuestGuard>} />
              <Route path="/account-disabled" element={<AccountDisabledPage />} />

              {/* Doctor Routes */}
              <Route path="/doctor" element={<RoleGuard allowedRoles={['doctor']}><DoctorDashboard /></RoleGuard>} />
              <Route path="/doctor/appointments" element={<RoleGuard allowedRoles={['doctor']}><DoctorAppointments /></RoleGuard>} />
              <Route path="/doctor/appointments/create" element={<RoleGuard allowedRoles={['doctor']}><CreateAppointment /></RoleGuard>} />
              <Route path="/doctor/patients" element={<RoleGuard allowedRoles={['doctor']}><DoctorPatients /></RoleGuard>} />
              <Route path="/doctor/patients/find" element={<RoleGuard allowedRoles={['doctor']}><FindPatient /></RoleGuard>} />
              <Route path="/doctor/patients/:patientId" element={<RoleGuard allowedRoles={['doctor']}><PatientDetails /></RoleGuard>} />
              <Route path="/doctor/prescriptions" element={<RoleGuard allowedRoles={['doctor']}><DoctorPrescriptions /></RoleGuard>} />
              <Route path="/doctor/prescriptions/create" element={<RoleGuard allowedRoles={['doctor']}><CreatePrescription /></RoleGuard>} />
              <Route path="/doctor/lab-requests" element={<RoleGuard allowedRoles={['doctor']}><DoctorLabRequests /></RoleGuard>} />
              <Route path="/doctor/lab-requests/create" element={<RoleGuard allowedRoles={['doctor']}><CreateLabRequest /></RoleGuard>} />
              <Route path="/doctor/lab-results" element={<RoleGuard allowedRoles={['doctor']}><DoctorLabResults /></RoleGuard>} />
              <Route path="/doctor/chat" element={<RoleGuard allowedRoles={['doctor']}><DoctorChat /></RoleGuard>} />
              <Route path="/doctor/profile" element={<RoleGuard allowedRoles={['doctor']}><DoctorProfile /></RoleGuard>} />
              <Route path="/doctor/availability" element={<RoleGuard allowedRoles={['doctor']}><ManageAvailability /></RoleGuard>} />
              <Route path="/doctor/ai-models" element={<RoleGuard allowedRoles={['doctor']}><AIModels /></RoleGuard>} />

              {/* Lab Routes */}
              <Route path="/lab" element={<RoleGuard allowedRoles={['lab']}><LabDashboard /></RoleGuard>} />
              <Route path="/lab/requests" element={<RoleGuard allowedRoles={['lab']}><LabRequests /></RoleGuard>} />
              <Route path="/lab/requests/:requestId" element={<RoleGuard allowedRoles={['lab']}><LabRequestDetails /></RoleGuard>} />
              <Route path="/lab/results" element={<RoleGuard allowedRoles={['lab']}><LabResults /></RoleGuard>} />
              <Route path="/lab/results/upload" element={<RoleGuard allowedRoles={['lab']}><UploadResult /></RoleGuard>} />
              <Route path="/lab/results/edit/:resultId" element={<RoleGuard allowedRoles={['lab']}><EditResult /></RoleGuard>} />
              <Route path="/lab/profile" element={<RoleGuard allowedRoles={['lab']}><LabProfile /></RoleGuard>} />

              {/* Patient Routes */}
              <Route path="/patient" element={<RoleGuard allowedRoles={['patient']}><PatientDashboard /></RoleGuard>} />
              <Route path="/patient/appointments" element={<RoleGuard allowedRoles={['patient']}><PatientAppointments /></RoleGuard>} />
              <Route path="/patient/prescriptions" element={<RoleGuard allowedRoles={['patient']}><PatientPrescriptions /></RoleGuard>} />
              <Route path="/patient/lab-results" element={<RoleGuard allowedRoles={['patient']}><PatientLabResults /></RoleGuard>} />
              <Route path="/patient/chat" element={<RoleGuard allowedRoles={['patient']}><PatientChat /></RoleGuard>} />
              <Route path="/patient/upload" element={<RoleGuard allowedRoles={['patient']}><UploadDocument /></RoleGuard>} />
              <Route path="/patient/book-appointment" element={<RoleGuard allowedRoles={['patient']}><BookAppointment /></RoleGuard>} />
              <Route path="/patient/profile" element={<RoleGuard allowedRoles={['patient']}><PatientProfile /></RoleGuard>} />

              {/* Common Routes */}
              <Route path="/video-room/:appointmentId" element={<RoleGuard allowedRoles={['patient', 'doctor']}><VideoRoom /></RoleGuard>} />

              {/* Admin Routes */}
              <Route path="/admin" element={<RoleGuard allowedRoles={['admin']}><AdminDashboard /></RoleGuard>} />
              <Route path="/admin/users" element={<RoleGuard allowedRoles={['admin']}><AdminUsers /></RoleGuard>} />
              <Route path="/admin/users/:uid" element={<RoleGuard allowedRoles={['admin']}><AdminUserDetails /></RoleGuard>} />
              <Route path="/admin/policies" element={<RoleGuard allowedRoles={['admin']}><AdminPolicies /></RoleGuard>} />
              <Route path="/admin/policies/create" element={<RoleGuard allowedRoles={['admin']}><CreatePolicy /></RoleGuard>} />
              <Route path="/admin/policies/edit/:policyId" element={<RoleGuard allowedRoles={['admin']}><EditPolicy /></RoleGuard>} />
              <Route path="/admin/statistics" element={<RoleGuard allowedRoles={['admin']}><AdminStatistics /></RoleGuard>} />
              <Route path="/admin/profile" element={<RoleGuard allowedRoles={['admin']}><AdminProfile /></RoleGuard>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
