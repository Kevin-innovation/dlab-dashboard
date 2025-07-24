import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { LoginForm } from './components/auth/LoginForm'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { Layout } from './components/layout/Layout'
import Dashboard from './pages/dashboard'
import { StudentsPage } from './pages/students'
import { SchedulePage } from './pages/schedule'
import PaymentsPage from './pages/payments'
import StatisticsPage from './pages/statistics'
import FeedbackPage from './pages/feedback'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="schedule" element={<SchedulePage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="statistics" element={<StatisticsPage />} />
            <Route path="feedback" element={<FeedbackPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
