import { useState } from 'react';
import { useBusStore } from '../../store/useBusStore';
import { useRouteStore } from '../../store/useRouteStore';
import { Table, Card, Badge, Button, StatusDot } from '@repo/utils/ui';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Bus, AlertTriangle, TrendingUp } from 'lucide-react';

const analyticsData = [
  { time: '08:00', load: 45 },
  { time: '10:00', load: 85 },
  { time: '12:00', load: 60 },
  { time: '14:00', load: 55 },
  { time: '16:00', load: 90 },
  { time: '18:00', load: 70 },
];

export default function AdminDashboard() {
  const { activeBuses, locations } = useBusStore();
  const { routes } = useRouteStore();

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fleet Management</h2>
        <div className="flex gap-2">
          <Button variant="outline">Export Data</Button>
          <Button>+ New Route</Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><Bus /></div>
          <div>
            <p className="text-sm text-gray-500">Active Fleet</p>
            <p className="text-xl font-bold">12 / 15</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full"><Users /></div>
          <div>
            <p className="text-sm text-gray-500">Total Passengers</p>
            <p className="text-xl font-bold">1,240</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-full"><AlertTriangle /></div>
          <div>
            <p className="text-sm text-gray-500">Open Alerts</p>
            <p className="text-xl font-bold">2</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full"><TrendingUp /></div>
          <div>
            <p className="text-sm text-gray-500">On-Time Performance</p>
            <p className="text-xl font-bold">94%</p>
          </div>
        </Card>
      </div>

      {/* Fleet Monitoring Table */}
      <Card>
        <h3 className="font-bold mb-4">Real-time Monitor</h3>
        <Table headers={['Vehicle', 'Route', 'Driver', 'Speed', 'Status']}>
          {activeBuses.length > 0 ? activeBuses.map(bus => {
            const lastLoc = locations[bus.id];
            return (
              <tr key={bus.id}>
                <td className="px-6 py-4 font-semibold">{bus.registration}</td>
                <td className="px-6 py-4">101 - Downtown</td>
                <td className="px-6 py-4">John Doe</td>
                <td className="px-6 py-4">{lastLoc?.speed || 0} km/h</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <StatusDot status="online" />
                    <span>In Transit</span>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
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
                <p className="text-sm text-yellow-700">Route 101 - Traffic congestion at Central Mall</p>
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
    </div>
  );
}
