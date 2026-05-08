import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Card, Button, Badge } from '@repo/utils/ui';
import { api } from '../../services/api';
import { Users, Route as RouteIcon, Bus as BusIcon, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const { logout } = useAuthStore();
  const [stats, setStats] = useState({ drivers: 0, routes: 0, vehicles: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [drivers, routes, vehicles] = await Promise.all([
          api.getDrivers(),
          api.getRoutes(),
          api.getBuses()
        ]);
        setStats({
          drivers: drivers.data?.length || 0,
          routes: routes.data?.length || 0,
          vehicles: vehicles.data?.length || 0
        });
      } catch (err) {
        console.error('Failed to fetch system stats', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">System Admin Dashboard</h2>
          <p className="text-gray-500">Monitor global system health and resource counts</p>
        </div>
        <Button variant="outline" onClick={logout}>Logout</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users /></div>
          <div>
            <p className="text-sm text-gray-500">Total Drivers</p>
            <p className="text-2xl font-bold">{stats.drivers}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg"><RouteIcon /></div>
          <div>
            <p className="text-sm text-gray-500">Total Routes</p>
            <p className="text-2xl font-bold">{stats.routes}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><BusIcon /></div>
          <div>
            <p className="text-sm text-gray-500">Total Vehicles</p>
            <p className="text-2xl font-bold">{stats.vehicles}</p>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="text-green-600" /> System Health
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
            <span>API Server</span>
            <Badge variant="success">Online</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
            <span>Real-time Service (Kafka)</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded border">
            <span>Database (Postgres)</span>
            <Badge variant="success">Healthy</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
