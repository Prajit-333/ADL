import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card } from '@repo/utils/ui';
import { useAuthStore, type AuthUser } from '../../store/useAuthStore';

type LoginRole = 'PASSENGER' | 'DRIVER' | 'ADMIN' | 'TRANSIT_ADMIN';

interface RoleOption {
  role: LoginRole;
  label: string;
  hint: string;
  username?: string;
  password?: string;
  buttonText: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'PASSENGER',
    label: 'Passenger',
    hint: 'Track buses and routes in real time.',
    buttonText: 'Continue as Passenger',
  },
  {
    role: 'DRIVER',
    label: 'Driver',
    hint: 'Use driver dashboard and trip controls.',
    username: 'driver',
    password: 'driver123',
    buttonText: 'Login as Driver',
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    hint: 'Platform admin access and system controls.',
    username: 'admin',
    password: 'admin123',
    buttonText: 'Login as Admin',
  },
  {
    role: 'TRANSIT_ADMIN',
    label: 'Transit Admin',
    hint: 'Manage routes, bus stops, and vehicles.',
    username: 'transitadmin',
    password: 'transit123',
    buttonText: 'Login as Transit Admin',
  },
];

const rolePath: Record<LoginRole, string> = {
  PASSENGER: '/passenger',
  DRIVER: '/driver',
  ADMIN: '/admin',
  TRANSIT_ADMIN: '/transit-admin',
};

const roleName: Record<LoginRole, string> = {
  PASSENGER: 'Passenger',
  DRIVER: 'Driver',
  ADMIN: 'Admin',
  TRANSIT_ADMIN: 'Transit Admin',
};

const roleId: Record<LoginRole, string> = {
  PASSENGER: 'passenger-1',
  DRIVER: 'driver-1',
  ADMIN: 'admin-1',
  TRANSIT_ADMIN: 'transit-admin-1',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login, logout } = useAuthStore();

  const [selectedRole, setSelectedRole] = useState<LoginRole>('PASSENGER');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const selectedRoleConfig = useMemo(
    () => roleOptions.find((option) => option.role === selectedRole) ?? roleOptions[0],
    [selectedRole],
  );

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedRole === 'PASSENGER') {
      const passenger: AuthUser = {
        id: roleId.PASSENGER,
        name: roleName.PASSENGER,
        role: 'PASSENGER',
      };
      login(passenger);
      navigate('/passenger');
      return;
    }

    const username = credentials.username.trim().toLowerCase();
    const password = credentials.password;

    if (username === selectedRoleConfig.username && password === selectedRoleConfig.password) {
      const userData: AuthUser = {
        id: roleId[selectedRole],
        name: roleName[selectedRole],
        role: selectedRole,
      };
      login(userData);
      setCredentials({ username: '', password: '' });
      setError('');
      navigate(rolePath[selectedRole]);
      return;
    }

    setError(`Invalid credentials for ${selectedRoleConfig.label}.`);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-6">
        <Card className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">ADL Login</h1>
            <p className="text-slate-600 mt-1">
              Select your portal and continue with the matching credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roleOptions.map((option) => (
              <button
                key={option.role}
                type="button"
                className={`text-left border rounded-lg px-4 py-3 transition ${
                  selectedRole === option.role
                    ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
                onClick={() => {
                  setSelectedRole(option.role);
                  setError('');
                  setCredentials({ username: '', password: '' });
                }}
              >
                <p className="font-semibold text-slate-900">{option.label}</p>
                <p className="text-xs text-slate-500 mt-1">{option.hint}</p>
              </button>
            ))}
          </div>

          <form className="space-y-3" onSubmit={handleLogin}>
            {selectedRole !== 'PASSENGER' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <input
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                    value={credentials.username}
                    onChange={(event) =>
                      setCredentials((prev) => ({ ...prev, username: event.target.value }))
                    }
                    autoComplete="username"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                    value={credentials.password}
                    onChange={(event) =>
                      setCredentials((prev) => ({ ...prev, password: event.target.value }))
                    }
                    autoComplete="current-password"
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            {error && <Alert variant="error" message={error} />}
            <Button type="submit" className="w-full">
              {selectedRoleConfig.buttonText}
            </Button>
          </form>

          <div className="text-xs text-slate-500 rounded-md bg-slate-50 border border-slate-200 p-3">
            <p className="font-semibold text-slate-700 mb-1">Demo Credentials</p>
            <p>Admin: admin / admin123</p>
            <p>Transit Admin: transitadmin / transit123</p>
            <p>Driver: driver / driver123</p>
          </div>
        </Card>

        <Card className="p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Current Session</h2>
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Logged in as <span className="font-semibold text-slate-900">{user.name}</span>
              </p>
              <div className="flex flex-col gap-2">
                <Link to={rolePath[user.role as LoginRole]}>
                  <Button className="w-full" variant="outline">
                    Open My Dashboard
                  </Button>
                </Link>
                <Button className="w-full" variant="danger" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No active user session.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
