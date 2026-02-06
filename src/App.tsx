import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthProvider } from './context/AuthContext';
import { SseProvider } from './context/SseContext';
import { UrlopProvider } from './context/UrlopContext';
import { BadaniaSzkolenieProvider } from './context/BadaniaSzkolenieContext';
import { MachineInspectionProvider } from './context/MachineInspectionContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/auth/LoginPage';
import ToolsPage from './pages/tools/ToolsPage';
import MachinesPage from './pages/machines/MachinesPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import EmployeeDetailPage from './pages/employees/EmployeeDetailPage';
import PayrollPage from './pages/payroll/PayrollPage';
import QuotesListPage from './pages/quotes/QuotesListPage';
import QuoteCreatePage from './pages/quotes/QuoteCreatePage';
import QuoteEditPage from './pages/quotes/QuoteEditPage';
import ToastContainer from './components/common/ToastContainer';
import { ROUTES } from './constants';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SseProvider>
          <UrlopProvider>
            <BadaniaSzkolenieProvider>
              <MachineInspectionProvider>
                <Router>
            <div className="min-h-screen bg-background-black">
              <Routes>
              <Route path={ROUTES.LOGIN} element={<LoginPage />} />
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
                path={ROUTES.EMPLOYEE_DETAIL}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <EmployeeDetailPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.PAYROLL}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PayrollPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.QUOTES}
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <QuotesListPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotes/new"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <QuoteCreatePage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotes/:id/edit"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <QuoteEditPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<Navigate to={ROUTES.QUOTES} replace />} />
            </Routes>
            <ToastContainer />
          </div>
                </Router>
              </MachineInspectionProvider>
            </BadaniaSzkolenieProvider>
          </UrlopProvider>
        </SseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;