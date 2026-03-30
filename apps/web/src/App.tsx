import { useEffect, type ReactElement } from 'react';
import { useAuthStore } from './store/useAuthStore';
import { useBusStore } from './store/useBusStore';
import { realtime } from './services/realtime';
import { startSimulation } from './services/mock';
import PassengerDashboard from './features/passenger/PassengerDashboard';
import DriverDashboard from './features/driver/DriverDashboard';
import AdminDashboard from './features/admin/AdminDashboard';
import TransitAdminDashboard from './features/transit-admin/TransitAdminDashboard';
import LoginPage from './features/auth/LoginPage';
import { Button } from '@repo/utils/ui';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import type { UserRole } from './store/useAuthStore';

interface ProtectedRouteProps {
  children: ReactElement;
  allowedRoles?: UserRole[];
}

function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true';
    if (useMock) {
      startSimulation((update) => {
        useBusStore.getState().updateLocation(update);
      });
    } else {
      realtime.connect();
    }
    return () => realtime.disconnect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">ADL Transport</h1>
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          {isAuthenticated && user && (
            <>
              <span className="text-sm text-blue-100 hidden md:inline">
                {user.name} ({user.role.replace('_', ' ')})
              </span>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/passenger"
            element={
              <ProtectedRoute allowedRoles={['PASSENGER']}>
                <PassengerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <DriverDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transit-admin"
            element={
              <ProtectedRoute allowedRoles={['TRANSIT_ADMIN']}>
                <TransitAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}
