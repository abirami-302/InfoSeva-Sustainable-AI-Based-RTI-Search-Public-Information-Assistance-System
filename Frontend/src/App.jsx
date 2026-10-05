import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { DataManagerProvider } from './context/DataManagerContext';
import { AdminProvider } from './context/AdminContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './pages/landing/LandingPage';
import UserLayout from './components/layout/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import SearchInformation from './pages/user/SearchInformation';
import RTIRetrieval from './pages/user/RTIRetrieval';
import GenerateRTIDraft from './pages/user/GenerateRTIDraft';
import GovernmentSchemes from './pages/user/GovernmentSchemes';
import SchemeDetails from './pages/user/SchemeDetails';
import DocumentDetails from './pages/user/DocumentDetails';
import CircularDetails from './pages/user/CircularDetails';
import DocumentSummarizer from './pages/user/DocumentSummarizer';
import AIAssistant from './pages/user/AIAssistant';
import SavedItems from './pages/user/SavedItems';
import UserProfile from './pages/user/UserProfile';
import GovernmentServices from './pages/user/GovernmentServices';
import ApplyServices from './pages/user/ApplyServices';
import GovernmentUpdates from './pages/user/GovernmentUpdates';
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import Analytics from './pages/admin/Analytics';
import DataManagerManagement from "./pages/admin/DataManagerManagement";
import ActivityLogs from "./pages/admin/ActivityLogs";
import AdminProfile from "./pages/admin/AdminProfile";
import DataManagerLayout from './components/layout/DataManagerLayout';
import DataManagerDashboard from './pages/datamanager/DataManagerDashboard';

import {
  ReviewQueue,
  DataIngestion,
  BulkUpload,
  DataSources,
  ContentGaps,
  DMAnalytics,
  DMProfile,
  UploadHistory,
  MyDrafts,
} from './pages/datamanager';
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  return (
    <AuthProvider>
      <AdminProvider>
      <DataManagerProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Legacy dashboard redirects — send to the proper layout-wrapped routes */}
          <Route path="/dashboard/user" element={<Navigate to="/user" replace />} />
          <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard/datamanager" element={<Navigate to="/datamanager" replace />} />

          {/* User Module */}
          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={['user', 'citizen']}>
                <UserLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<UserDashboard />} />
            <Route path="search" element={<SearchInformation />} />
            <Route path="rti" element={<RTIRetrieval />} />
            <Route path="rti-draft" element={<GenerateRTIDraft />} />
            <Route path="schemes" element={<GovernmentSchemes />} />
            <Route path="schemes/:id" element={<SchemeDetails />} />
            <Route path="documents/:id" element={<DocumentDetails />} />
            <Route path="circulars/:id" element={<CircularDetails />} />
            <Route path="docs" element={<DocumentSummarizer />} />
            <Route path="assistant" element={<AIAssistant />} />
            <Route path="saved" element={<SavedItems />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="government-services" element={<GovernmentServices />} />
            <Route path="government-services/apply" element={<ApplyServices />} />
            <Route path="updates" element={<GovernmentUpdates />} />
          </Route>

          {/* Admin Module */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="data-managers" element={<DataManagerManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="review" element={<ReviewQueue readOnly={true} />} />
            <Route path="logs" element={<ActivityLogs />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>

          {/* Data Manager Module */}
          <Route
            path="/datamanager"
            element={
              <ProtectedRoute allowedRoles={['datamanager', 'data_manager']}>
                <DataManagerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DataManagerDashboard />} />
            <Route path="sources" element={<DataSources />} />
            <Route path="ingestion" element={<DataIngestion />} />
            <Route path="bulk" element={<BulkUpload />} />
            <Route path="review" element={<ReviewQueue />} />
            <Route path="drafts" element={<MyDrafts />} />
            <Route path="gaps" element={<ContentGaps />} />
            <Route path="analytics" element={<DMAnalytics />} />
            <Route path="profile" element={<DMProfile />} />
            <Route path="history" element={<UploadHistory />} />

            {/* Legacy redirects */}
            <Route path="upload" element={<Navigate to="/datamanager/ingestion" replace />} />
            <Route path="ocr" element={<Navigate to="/datamanager/review" replace />} />
            <Route path="indexing" element={<Navigate to="/datamanager/review" replace />} />
            <Route path="review-queue" element={<Navigate to="/datamanager/review" replace />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </DataManagerProvider>
      </AdminProvider>
    </AuthProvider>
  );
}

export default App;