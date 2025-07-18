import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ToolsPage from './pages/tools/ToolsPage';
import MachinesPage from './pages/machines/MachinesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import SettingsPage from './pages/settings/SettingsPage';
import ToastContainer from './components/common/ToastContainer';
import { ROUTES } from './constants';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background-black">
            <Routes>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.TOOLS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ToolsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.MACHINES}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <MachinesPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.EMPLOYEES}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EmployeesPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.SETTINGS}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <SettingsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
            <ToastContainer />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;