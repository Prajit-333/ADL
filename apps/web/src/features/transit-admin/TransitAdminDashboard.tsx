import { useEffect, useMemo, useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useBusStore } from '../../store/useBusStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Badge, Button, Card, StatusDot, Table } from '@repo/utils/ui';
import { VehicleStatus, type Bus, type Route, type Stop } from '@repo/utils/types';
import { Bus as BusIcon, MapPinned, Route as RouteIcon } from 'lucide-react';

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

const statusBadgeVariant = (status: VehicleStatus) => {
  if (status === VehicleStatus.ACTIVE) return 'success';
  if (status === VehicleStatus.MAINTENANCE) return 'warning';
  return 'danger';
};

export default function TransitAdminDashboard() {
  const { routes, stops, setRoutes, setStops } = useRouteStore();
  const { activeBuses, setActiveBuses } = useBusStore();
  const { logout } = useAuthStore();

  const [vehicleForm, setVehicleForm] = useState({
    registration: '',
    type: '',
    capacity: '40',
    status: VehicleStatus.ACTIVE,
  });

  const [routeForm, setRouteForm] = useState({
    code: '',
    name: '',
    city: '',
  });

  const [stopForm, setStopForm] = useState({
    name: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (activeBuses.length === 0) {
      setActiveBuses(defaultVehicles);
    }
  }, [activeBuses.length, setActiveBuses]);

  const vehicles = useMemo(
    () => (activeBuses.length > 0 ? activeBuses : defaultVehicles),
    [activeBuses],
  );

  const handleAddVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const registration = vehicleForm.registration.trim().toUpperCase();
    const type = vehicleForm.type.trim();
    const capacity = Number(vehicleForm.capacity);

    if (!registration || !type || Number.isNaN(capacity) || capacity < 10) {
      return;
    }

    const newVehicle: Bus = {
      id: `vehicle-${Date.now()}`,
      registration,
      type,
      capacity,
      status: vehicleForm.status,
    };

    setActiveBuses([newVehicle, ...vehicles]);
    setVehicleForm({ registration: '', type: '', capacity: '40', status: VehicleStatus.ACTIVE });
  };

  const handleVehicleStatusUpdate = (vehicleId: string, status: VehicleStatus) => {
    const updated = vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, status } : vehicle,
    );
    setActiveBuses(updated);
  };

  const handleAddRoute = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = routeForm.code.trim().toUpperCase();
    const name = routeForm.name.trim();
    const city = routeForm.city.trim();

    if (!code || !name || !city) {
      return;
    }

    const newRoute: Route = {
      id: `route-${Date.now()}`,
      code,
      name,
      city,
      isActive: true,
      stops: [],
    };

    setRoutes([newRoute, ...routes]);
    setRouteForm({ code: '', name: '', city: '' });
  };

  const handleAddStop = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = stopForm.name.trim();
    const latitude = Number(stopForm.latitude);
    const longitude = Number(stopForm.longitude);

    if (!name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      name,
      latitude,
      longitude,
    };

    setStops([newStop, ...stops]);
    setStopForm({ name: '', latitude: '', longitude: '' });
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transit Admin Panel</h2>
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3">
          <RouteIcon className="text-blue-600" />
          <div>
            <p className="text-sm text-gray-500">Routes</p>
            <p className="text-xl font-bold">{routes.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <MapPinned className="text-green-600" />
          <div>
            <p className="text-sm text-gray-500">Bus Stops</p>
            <p className="text-xl font-bold">{stops.length}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <BusIcon className="text-orange-600" />
          <div>
            <p className="text-sm text-gray-500">Vehicles</p>
            <p className="text-xl font-bold">{vehicles.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <h3 className="font-bold">Manage Routes</h3>
          <form className="grid grid-cols-1 gap-3" onSubmit={handleAddRoute}>
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              placeholder="Route Code (101)"
              value={routeForm.code}
              onChange={(event) => setRouteForm((prev) => ({ ...prev, code: event.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              placeholder="Route Name"
              value={routeForm.name}
              onChange={(event) => setRouteForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              placeholder="City"
              value={routeForm.city}
              onChange={(event) => setRouteForm((prev) => ({ ...prev, city: event.target.value }))}
            />
            <Button type="submit">Add Route</Button>
          </form>

          <Table headers={['Code', 'Name', 'City', 'Status']}>
            {routes.length > 0 ? (
              routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-6 py-4 font-semibold">{route.code}</td>
                  <td className="px-6 py-4">{route.name}</td>
                  <td className="px-6 py-4">{route.city}</td>
                  <td className="px-6 py-4">
                    <Badge variant={route.isActive ? 'success' : 'warning'}>
                      {route.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No routes configured.
                </td>
              </tr>
            )}
          </Table>
        </Card>

        <Card className="space-y-4">
          <h3 className="font-bold">Manage Bus Stops</h3>
          <form className="grid grid-cols-1 gap-3" onSubmit={handleAddStop}>
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              placeholder="Stop Name"
              value={stopForm.name}
              onChange={(event) => setStopForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              type="number"
              step="any"
              placeholder="Latitude"
              value={stopForm.latitude}
              onChange={(event) =>
                setStopForm((prev) => ({ ...prev, latitude: event.target.value }))
              }
            />
            <input
              className="border border-gray-300 rounded-md px-3 py-2"
              type="number"
              step="any"
              placeholder="Longitude"
              value={stopForm.longitude}
              onChange={(event) =>
                setStopForm((prev) => ({ ...prev, longitude: event.target.value }))
              }
            />
            <Button type="submit">Add Stop</Button>
          </form>

          <Table headers={['Stop', 'Latitude', 'Longitude']}>
            {stops.length > 0 ? (
              stops.map((stop) => (
                <tr key={stop.id}>
                  <td className="px-6 py-4 font-semibold">{stop.name}</td>
                  <td className="px-6 py-4 font-mono text-sm">{stop.latitude.toFixed(4)}</td>
                  <td className="px-6 py-4 font-mono text-sm">{stop.longitude.toFixed(4)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No bus stops configured.
                </td>
              </tr>
            )}
          </Table>
        </Card>
      </div>

      <Card className="space-y-4">
        <h3 className="font-bold">Manage Vehicles</h3>
        <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleAddVehicle}>
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Registration"
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
            className="border border-gray-300 rounded-md px-3 py-2"
            type="number"
            value={vehicleForm.capacity}
            onChange={(event) =>
              setVehicleForm((prev) => ({ ...prev, capacity: event.target.value }))
            }
            placeholder="Capacity"
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

        <Table headers={['Registration', 'Type', 'Capacity', 'Status', 'Actions']}>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="px-6 py-4 font-semibold">{vehicle.registration}</td>
              <td className="px-6 py-4">{vehicle.type}</td>
              <td className="px-6 py-4">{vehicle.capacity ?? '--'}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <StatusDot status={vehicle.status === VehicleStatus.ACTIVE ? 'online' : 'busy'} />
                  <Badge variant={statusBadgeVariant(vehicle.status)}>{vehicle.status}</Badge>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVehicleStatusUpdate(vehicle.id, VehicleStatus.ACTIVE)}
                  >
                    Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleVehicleStatusUpdate(vehicle.id, VehicleStatus.MAINTENANCE)}
                  >
                    Maint.
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
