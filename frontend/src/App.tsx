import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Landing } from './pages/Landing'
import { About } from './pages/About'
import { Jobs } from './pages/Jobs'
import { JobDetail } from './pages/JobDetail'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { CandidateDashboard } from './pages/candidate/CandidateDashboard'
import { CandidateProfile } from './pages/candidate/CandidateProfile'
import { MyApplications } from './pages/candidate/MyApplications'
import { CompanyDashboard } from './pages/company/CompanyDashboard'
import { CompanyProfile } from './pages/company/CompanyProfile'
import { CompanyJobs } from './pages/company/CompanyJobs'
import { CompanyApplications } from './pages/company/CompanyApplications'
import { JobForm } from './pages/company/JobForm'
import { JobApplications } from './pages/company/JobApplications'
import { CompanyMatching } from './pages/company/CompanyMatching'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminUsers } from './pages/admin/AdminUsers'
import { AdminJobs } from './pages/admin/AdminJobs'
import { AdminApplications } from './pages/admin/AdminApplications'
import { AdminReports } from './pages/admin/AdminReports'
import { AdminProfile } from './pages/admin/AdminProfile'
import { Feed } from './pages/Feed'
import { PublicProfile } from './pages/PublicProfile'
import { Messages } from './pages/Messages'
import { Connections } from './pages/Connections'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <ErrorBoundary>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/u/:username" element={<PublicProfile />} />

              {/* Authenticated home feed — all roles */}
              <Route element={<ProtectedRoute roles={['candidate', 'company', 'admin']} />}>
                <Route path="/home" element={<Feed />} />
              </Route>

              {/* Candidate */}
              <Route element={<ProtectedRoute roles={['candidate']} />}>
                <Route path="/dashboard" element={<CandidateDashboard />} />
                <Route path="/profile" element={<CandidateProfile />} />
                <Route path="/applications" element={<MyApplications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/connections" element={<Connections />} />
              </Route>

              {/* Company */}
              <Route element={<ProtectedRoute roles={['company']} />}>
                <Route path="/company/dashboard" element={<CompanyDashboard />} />
                <Route path="/company/profile" element={<CompanyProfile />} />
                <Route path="/company/jobs" element={<CompanyJobs />} />
                <Route path="/company/applications" element={<CompanyApplications />} />
                <Route path="/company/jobs/new" element={<JobForm />} />
                <Route path="/company/jobs/:id/edit" element={<JobForm />} />
                <Route path="/company/jobs/:id/applications" element={<JobApplications />} />
                <Route path="/company/matching" element={<CompanyMatching />} />
              </Route>

              {/* Admin */}
              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/jobs" element={<AdminJobs />} />
                <Route path="/admin/applications" element={<AdminApplications />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/profile" element={<AdminProfile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Landing />} />
            </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}
