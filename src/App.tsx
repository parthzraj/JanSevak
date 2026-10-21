import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginScreen } from './pages/LoginScreen';
import { HomeScreen } from './pages/HomeScreen';
import { SearchScreen } from './pages/SearchScreen';
import { CreateReportScreen } from './pages/CreateReportScreen';
import { PositiveImpactScreen } from './pages/PositiveImpactScreen';
import { MenuScreen } from './pages/MenuScreen';
import { VacanciesScreen } from './pages/VacanciesScreen';
import { GamesScreen } from './pages/GamesScreen';
import { ReportAnalysisScreen } from './pages/ReportAnalysisScreen';
import { LearnCertifyScreen } from './pages/LearnCertifyScreen';
import { NotificationsScreen } from './pages/NotificationsScreen';
import { RewardsScreen } from './pages/RewardsScreen';
import { ProfileScreen } from './pages/ProfileScreen';
import { PublicProfileScreen } from './pages/PublicProfileScreen';
import { PredictiveAlertsScreen } from './pages/PredictiveAlertsScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/home" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <HomeScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-report"
          element={
            <ProtectedRoute>
              <CreateReportScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/positive-impact"
          element={
            <ProtectedRoute>
              <PositiveImpactScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <MenuScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vacancies"
          element={
            <ProtectedRoute>
              <VacanciesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <GamesScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/report-analysis"
          element={
            <ProtectedRoute>
              <ReportAnalysisScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learn-certify"
          element={
            <ProtectedRoute>
              <LearnCertifyScreen />
            </ProtectedRoute>
          }
        />
        <Route path="/badges-certificates" element={<Navigate to="/rewards" replace />} />
        <Route path="/badges" element={<Navigate to="/rewards" replace />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute>
              <RewardsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <PredictiveAlertsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictive-alerts"
          element={
            <ProtectedRoute>
              <PredictiveAlertsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:id"
          element={
            <ProtectedRoute>
              <PublicProfileScreen />
            </ProtectedRoute>
          }
        />
        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
