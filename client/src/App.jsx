import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PublicProfilePage from './pages/PublicProfilePage.jsx';
import EditProfilePage from './pages/EditProfilePage.jsx';
import ProjectsPage from './pages/ProjectsPage.jsx';
import ProjectDetailPage from './pages/ProjectDetailPage.jsx';
import ProjectFormPage from './pages/ProjectFormPage.jsx';
import MyProjectsPage from './pages/MyProjectsPage.jsx';
import ProjectApplicationsPage from './pages/ProjectApplicationsPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import { PlaceholderPage, NotFoundPage } from './pages/PlaceholderPage.jsx';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: false,
      },
    },
  });
}

export default function App({ client }) {
  const [queryClient] = useState(() => client || createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected App Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/users/:id" element={<PublicProfilePage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/new" element={<ProjectFormPage />} />
                <Route path="/projects/:id/edit" element={<ProjectFormPage edit />} />
                <Route path="/projects/:id/applications" element={<ProjectApplicationsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/my-projects" element={<MyProjectsPage />} />
                <Route path="/applications" element={<ApplicationsPage />} />
                <Route
                  path="/exchanges"
                  element={<PlaceholderPage title="Skill Exchanges" description="Collaborate and exchange skills with peers." />}
                />
                <Route
                  path="/people"
                  element={<PlaceholderPage title="People Search" description="Find students by skill and category." />}
                />
                <Route
                  path="/notifications"
                  element={<PlaceholderPage title="Notifications" description="View your activity and alerts." />}
                />
                <Route path="/profile/edit" element={<EditProfilePage />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
