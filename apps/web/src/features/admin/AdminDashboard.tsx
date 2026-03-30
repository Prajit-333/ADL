import { useEffect, useState } from 'react';
import { useBusStore } from '../../store/useBusStore';
import { useRouteStore } from '../../store/useRouteStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Table, Card, Badge, Button, StatusDot } from '@repo/utils/ui';
import type { Bus } from '@repo/utils/types';
import { VehicleStatus } from '@repo/utils/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Users, Bus as BusIcon, AlertTriangle, TrendingUp, Settings, Activity } from 'lucide-react';

const analyticsData = [
  { time: '08:00', load: 45 },
  { time: '10:00', load: 85 },
  { time: '12:00', load: 60 },
  { time: '14:00', load: 55 },
  { time: '16:00', load: 90 },
  { time: '18:00', load: 70 },
];

const defaultVehicles: Bus[] = [
  {
    id: 'b1',
    registration: 'KA-01-F-1234',
    type: 'AC',
    capacity: 48,
    status: VehicleStatus.ACTIVE,
  },
  {
    id: 'b2',
    registration: 'KA-02-G-5511',
    type: 'Non-AC',
    capacity: 52,
    status: VehicleStatus.INACTIVE,
  },
];

interface AdminAction {
  id: string;
  action: string;
  timestamp: string;
}

interface SystemParams {
  gpsHeartbeatSeconds: number;
  dispatchRefreshSeconds: number;
  delayAlertMinutes: number;
  maxAllowedSpeedKmh: number;
}

interface HealthService {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  uptime: string;
  checkedAt: string;
}

const initialHealth: HealthService[] = [
  {
    id: 'api',
    name: 'API Gateway',
    status: 'online',
    uptime: '99.98%',
    checkedAt: new Date().toLocaleTimeString(),
  },
  {
    id: 'ingest',
    name: 'Telemetry Ingest',
    status: 'online',
    uptime: '99.92%',
    checkedAt: new Date().toLocaleTimeString(),
  },
  {
    id: 'realtime',
    name: 'Realtime Stream',
    status: 'busy',
    uptime: '99.85%',
    checkedAt: new Date().toLocaleTimeString(),
  },
  {
    id: 'db',
    name: 'Primary Database',
    status: 'online',
    uptime: '99.99%',
    checkedAt: new Date().toLocaleTimeString(),
  },
];

const statusBadgeVariant = (status: VehicleStatus) => {
  if (status === VehicleStatus.ACTIVE) return 'success';
  if (status === VehicleStatus.MAINTENANCE) return 'warning';
  return 'danger';
};

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const { activeBuses, locations, setActiveBuses } = useBusStore();
  const { routes } = useRouteStore();
  const [vehicles, setVehicles] = useState<Bus[]>([]);
  const [systemParams, setSystemParams] = useState<SystemParams>({
    gpsHeartbeatSeconds: 5,
    dispatchRefreshSeconds: 15,
    delayAlertMinutes: 8,
    maxAllowedSpeedKmh: 70,
  });
  const [healthServices, setHealthServices] = useState<HealthService[]>(initialHealth);
  const [adminActions, setAdminActions] = useState<AdminAction[]>([]);
  const [vehicleForm, setVehicleForm] = useState({
    registration: '',
    type: '',
    capacity: '40',
    status: VehicleStatus.ACTIVE,
  });

  const addActionLog = (action: string) => {
    setAdminActions((prev) => [
      {
        id: `action-${Date.now()}-${prev.length}`,
        action,
        timestamp: new Date().toLocaleString(),
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (vehicles.length > 0) return;
    const initialVehicles = activeBuses.length > 0 ? activeBuses : defaultVehicles;
    setVehicles(initialVehicles);
    if (activeBuses.length === 0) {
      setActiveBuses(initialVehicles);
    }
  }, [activeBuses, setActiveBuses, vehicles.length]);

  const handleSaveSystemParams = () => {
    addActionLog('Updated transit system parameters');
  };

  const handleRunHealthCheck = () => {
    const statuses: Array<'online' | 'busy'> = ['online', 'online', 'busy'];
    setHealthServices((prev) =>
      prev.map((service) => ({
        ...service,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        checkedAt: new Date().toLocaleTimeString(),
      })),
    );
    addActionLog('Ran system health checks');
  };

  const handleAddVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const registration = vehicleForm.registration.trim().toUpperCase();
    const type = vehicleForm.type.trim();
    const capacity = Number(vehicleForm.capacity);
    if (!registration || !type || Number.isNaN(capacity) || capacity < 10) {
      return;
    }
    const newVehicle: Bus = {
      id: `b${Date.now()}`,
      registration,
      type,
      capacity,
      status: vehicleForm.status,
    };
    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);
    setActiveBuses(updated);
    setVehicleForm({ registration: '', type: '', capacity: '40', status: VehicleStatus.ACTIVE });
    addActionLog(`Added vehicle ${registration} to portal`);
  };

  const handleUpdateVehicleStatus = (vehicleId: string, status: VehicleStatus) => {
    const updatedVehicles = vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, status } : vehicle,
    );
    setVehicles(updatedVehicles);
    setActiveBuses(updatedVehicles);
    addActionLog(`Changed vehicle status for ${vehicleId} to ${status}`);
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Admin Control Panel</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunHealthCheck}>
            Run Health Check
          </Button>
          <Button variant="danger" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <BusIcon />
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Fleet</p>
            <p className="text-xl font-bold">
              {vehicles.filter((vehicle) => vehicle.status === VehicleStatus.ACTIVE).length} /{' '}
              {vehicles.length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Users />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Passengers</p>
            <p className="text-xl font-bold">1,240</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full">
            <AlertTriangle />
          </div>
          <div>
            <p className="text-sm text-gray-500">Open Alerts</p>
            <p className="text-xl font-bold">
              {healthServices.filter((service) => service.status !== 'online').length}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
            <TrendingUp />
          </div>
          <div>
            <p className="text-sm text-gray-500">On-Time Performance</p>
            <p className="text-xl font-bold">94%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-blue-700">
            <Activity size={20} />
            <h3 className="font-bold">System Health</h3>
          </div>
          <div className="space-y-3">
            {healthServices.map((service) => (
              <div
                key={service.id}
                className="border rounded-md p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-xs text-gray-500">
                    Uptime {service.uptime} | Checked {service.checkedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusDot status={service.status} />
                  <span className="text-sm capitalize">{service.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3 text-blue-700">
            <Settings size={20} />
            <h3 className="font-bold">System Parameters</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-gray-600">GPS Heartbeat (sec)</span>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5"
                value={systemParams.gpsHeartbeatSeconds}
                onChange={(event) =>
                  setSystemParams((prev) => ({
                    ...prev,
                    gpsHeartbeatSeconds: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-gray-600">Dispatch Refresh (sec)</span>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5"
                value={systemParams.dispatchRefreshSeconds}
                onChange={(event) =>
                  setSystemParams((prev) => ({
                    ...prev,
                    dispatchRefreshSeconds: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-gray-600">Delay Alert (min)</span>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5"
                value={systemParams.delayAlertMinutes}
                onChange={(event) =>
                  setSystemParams((prev) => ({
                    ...prev,
                    delayAlertMinutes: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-gray-600">Max Speed (km/h)</span>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-md px-2 py-1.5"
                value={systemParams.maxAllowedSpeedKmh}
                onChange={(event) =>
                  setSystemParams((prev) => ({
                    ...prev,
                    maxAllowedSpeedKmh: Number(event.target.value) || 0,
                  }))
                }
              />
            </label>
          </div>
          <Button onClick={handleSaveSystemParams}>Save Parameters</Button>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold">Add Vehicle to Portal</h3>
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleAddVehicle}>
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Registration (KA-09-AB-1111)"
            value={vehicleForm.registration}
            onChange={(event) =>
              setVehicleForm((prev) => ({ ...prev, registration: event.target.value }))
            }
          />
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Vehicle type"
            value={vehicleForm.type}
            onChange={(event) => setVehicleForm((prev) => ({ ...prev, type: event.target.value }))}
          />
          <input
            type="number"
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Capacity"
            value={vehicleForm.capacity}
            onChange={(event) =>
              setVehicleForm((prev) => ({ ...prev, capacity: event.target.value }))
            }
          />
          <select
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            value={vehicleForm.status}
            onChange={(event) =>
              setVehicleForm((prev) => ({ ...prev, status: event.target.value as VehicleStatus }))
            }
          >
            <option value={VehicleStatus.ACTIVE}>ACTIVE</option>
            <option value={VehicleStatus.INACTIVE}>INACTIVE</option>
            <option value={VehicleStatus.MAINTENANCE}>MAINTENANCE</option>
          </select>
          <Button type="submit">Add Vehicle</Button>
        </form>
      </Card>

      {/* Fleet Monitoring Table */}
      <Card>
        <h3 className="font-bold mb-4">Fleet Management Monitor</h3>
        <Table headers={['Vehicle', 'Type', 'Route', 'Speed', 'Status', 'Manage']}>
          {vehicles.length > 0 ? (
            vehicles.map((bus) => {
              const lastLoc = locations[bus.id];
              return (
                <tr key={bus.id}>
                  <td className="px-6 py-4 font-semibold">{bus.registration}</td>
                  <td className="px-6 py-4">{bus.type}</td>
                  <td className="px-6 py-4">
                    {routes[0] ? `${routes[0].code} - ${routes[0].name}` : 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">{lastLoc?.speed || 0} km/h</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <StatusDot status={bus.status === VehicleStatus.ACTIVE ? 'online' : 'busy'} />
                      <Badge variant={statusBadgeVariant(bus.status)}>{bus.status}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateVehicleStatus(bus.id, VehicleStatus.ACTIVE)}
                      >
                        Active
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateVehicleStatus(bus.id, VehicleStatus.MAINTENANCE)}
                      >
                        Maint.
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No active vehicles tracked.
              </td>
            </tr>
          )}
        </Table>
      </Card>

      {/* Analytics Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-80">
          <h3 className="font-bold mb-4">Passenger Load (24h)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="load" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="font-bold mb-4">Service Alerts</h3>
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50 flex justify-between items-center">
              <div>
                <p className="font-bold text-yellow-800">Commuter Delay</p>
                <p className="text-sm text-yellow-700">
                  Route 101 - Traffic congestion at Central Mall
                </p>
              </div>
              <Badge variant="warning">+15m</Badge>
            </div>
            <div className="p-3 border-l-4 border-red-500 bg-red-50 flex justify-between items-center">
              <div>
                <p className="font-bold text-red-800">Vehicle Offline</p>
                <p className="text-sm text-red-700">Bus KA-01-F-1234 - GPS Link Terminal Failure</p>
              </div>
              <Badge variant="danger">URGENT</Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold mb-4">Admin Activity Log</h3>
        {adminActions.length === 0 ? (
          <p className="text-sm text-gray-500">No actions recorded in this session.</p>
        ) : (
          <div className="space-y-2">
            {adminActions.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="border rounded-md px-3 py-2 flex justify-between items-center"
              >
                <p className="text-sm font-medium">{entry.action}</p>
                <span className="text-xs text-gray-500">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
