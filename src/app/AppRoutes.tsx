import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleProtected } from './RoleProtected';
import {AppProvider} from "../contexts/AppContext"
// Lazy load pages for better performance
const LoginPage = React.lazy(() => import('../features/features/auth/LoginPage'));
const SignupPage = React.lazy(() => import('../features/features/auth/SignupPage'));
const ForgotPasswordPage = React.lazy(() => import('../features/features/auth/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('../features/features/dashboard/DashboardPage'));
const ProjectList = React.lazy(() => import('../features/features/projects/ProjectList'));
const ProjectDetailPage = React.lazy(() => import('../features/features/projects/ProjectDetail'));
const RoleList = React.lazy(() => import('../features/features/role/RoleList'));
const UserList = React.lazy(() => import('../features/features/user/UserList'));
const ClientList = React.lazy(() => import('../features/features/client/ClientList'));
const Reports = React.lazy(() => import('../features/features/report/ReportList'));
// const {App} = React.lazy(() => import('../contexts/AppContext'));
// Calendar and Timesheet - USE YOUR EXISTING PATHS
const CalendarView = React.lazy(() => import('../features/features/calendar/calender'));
const Timesheet = React.lazy(() => import('../features/features/timesheet/TimesheetList'));
const RolePermission = React.lazy(() => import('../features/features/rolepermission/RolePermission'));
const RoleForm = React.lazy(() => import('../features/features/role/RoleForm'));

export const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/auth/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/auth/signup" 
          element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/auth/forgot-password" 
          element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" replace />} 
        />

        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppProvider >
            <DashboardPage />
            </AppProvider>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <ProjectList />
            
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <ProjectDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/report" element={
          <ProtectedRoute>
          <AppProvider ><Reports /></AppProvider>
            
            
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <AppProvider >

            <CalendarView />
            </AppProvider>

          </ProtectedRoute>
        } />
        <Route path="/timesheet" element={
          <ProtectedRoute>
            <AppProvider>

            <Timesheet />
            </AppProvider>
          </ProtectedRoute>
        } />
        <Route path="/role" element={
          <ProtectedRoute>
            <RoleList />
          </ProtectedRoute>
        } />
        <Route path="/role/:id" element={
          <ProtectedRoute>
            <RoleForm />
          </ProtectedRoute>
        } />
        <Route path="/user" element={
          <ProtectedRoute>
            <UserList />
          </ProtectedRoute>
        } />
        <Route path="/client" element={
          <ProtectedRoute>
            <ClientList />
          </ProtectedRoute>
        } />
        <Route path="/rolepermission" element={
          <ProtectedRoute>
            <RolePermission />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  );
};