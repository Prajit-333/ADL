import { useEffect, useMemo, useState } from 'react';
import { useRouteStore } from '../../store/useRouteStore';
import { useBusStore } from '../../store/useBusStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import { Badge, Button, Card, StatusDot, Table } from '@repo/utils/ui';
import { VehicleStatus, type Bus, type Driver } from '@repo/utils/types';
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
  const { routes, stops, selectedRouteId, setRoutes, setStops } = useRouteStore();
  const { activeBuses, setActiveBuses } = useBusStore();
  const { logout } = useAuthStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);

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
    routeId: '',
    name: '',
    latitude: '',
    longitude: '',
  });
  const [driverForm, setDriverForm] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNo: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [routesRes, stopsRes, busesRes, driversRes] = await Promise.all([
          api.getRoutes(),
          api.getStops(),
          api.getVehicles(),
          api.getDrivers(),
        ]);
        if (routesRes.success) setRoutes(routesRes.data);
        if (stopsRes.success) setStops(stopsRes.data);
        if (busesRes.success) setActiveBuses(busesRes.data);
        if (driversRes.success) setDrivers(driversRes.data);
      } catch {
        if (activeBuses.length === 0) {
          setActiveBuses(defaultVehicles);
        }
      }
    };

    void load();
  }, [activeBuses.length, setActiveBuses, setRoutes, setStops]);

  useEffect(() => {
    if (stopForm.routeId) return;
    const fallbackRouteId = selectedRouteId || routes[0]?.id || '';
    if (fallbackRouteId) {
      setStopForm((prev) => ({ ...prev, routeId: fallbackRouteId }));
    }
  }, [routes, selectedRouteId, stopForm.routeId]);

  const vehicles = useMemo(
    () => (activeBuses.length > 0 ? activeBuses : defaultVehicles),
    [activeBuses],
  );

  const handleAddVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const registration = vehicleForm.registration.trim().toUpperCase();
    const type = vehicleForm.type.trim();
    const capacity = Number(vehicleForm.capacity);

    if (!registration || !type || Number.isNaN(capacity) || capacity < 10) {
      return;
    }

    const res = await api.createVehicle({
      registration,
      type,
      capacity,
      status: vehicleForm.status,
    });
    if (res.success) {
      setActiveBuses([res.data, ...vehicles]);
    }
    setVehicleForm({ registration: '', type: '', capacity: '40', status: VehicleStatus.ACTIVE });
  };

  const handleVehicleStatusUpdate = async (vehicleId: string, status: VehicleStatus) => {
    const res = await api.updateVehicleStatus(vehicleId, status);
    if (!res.success) return;
    const updated = vehicles.map((vehicle) => (vehicle.id === vehicleId ? res.data : vehicle));
    setActiveBuses(updated);
  };

  const handleAddRoute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = routeForm.code.trim().toUpperCase();
    const name = routeForm.name.trim();
    const city = routeForm.city.trim();

    if (!code || !name || !city) {
      return;
    }

    const res = await api.createRoute({ code, name, city });
    if (res.success) {
      setRoutes([res.data, ...routes]);
    }
    setRouteForm({ code: '', name: '', city: '' });
  };

  const handleAddStop = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = stopForm.name.trim();
    const latitude = Number(stopForm.latitude);
    const longitude = Number(stopForm.longitude);
    const routeId = stopForm.routeId || selectedRouteId || routes[0]?.id;

    if (!routeId || !name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    const res = await api.createStop({ routeId, name, latitude, longitude });
    if (res.success) {
      setStops([res.data, ...stops]);
      setRoutes(
        routes.map((route) =>
          route.id === routeId
            ? {
                ...route,
                stops: [
                  ...route.stops,
                  {
                    ...res.data,
                    routeId,
                    sequence: route.stops.length + 1,
                  },
                ],
              }
            : route,
        ),
      );
    }
    setStopForm((prev) => ({ ...prev, name: '', latitude: '', longitude: '' }));
  };

  const handleAddDriver = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = driverForm.name.trim();
    const email = driverForm.email.trim().toLowerCase();
    if (!name || !email) return;

    const res = await api.createDriver({
      name,
      email,
      phone: driverForm.phone.trim() || undefined,
      licenseNo: driverForm.licenseNo.trim() || undefined,
    });

    if (res.success) {
      setDrivers((prev) => [res.data, ...prev]);
      setDriverForm({ name: '', email: '', phone: '', licenseNo: '' });
    }
  };

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transit Admin Panel</h2>
        <Button variant="danger" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
        <Card className="flex items-center gap-3">
          <BusIcon className="text-purple-600" />
          <div>
            <p className="text-sm text-gray-500">Drivers</p>
            <p className="text-xl font-bold">{drivers.length}</p>
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
            <select
              className="border border-gray-300 rounded-md px-3 py-2 bg-white"
              value={stopForm.routeId}
              onChange={(event) => setStopForm((prev) => ({ ...prev, routeId: event.target.value }))}
            >
              <option value="">Select Route</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} - {route.name}
                </option>
              ))}
            </select>
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
        <h3 className="font-bold">Manage Drivers</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleAddDriver}>
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Driver Name"
            value={driverForm.name}
            onChange={(event) => setDriverForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Driver Email"
            value={driverForm.email}
            onChange={(event) => setDriverForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="Phone"
            value={driverForm.phone}
            onChange={(event) => setDriverForm((prev) => ({ ...prev, phone: event.target.value }))}
          />
          <input
            className="border border-gray-300 rounded-md px-3 py-2"
            placeholder="License Number"
            value={driverForm.licenseNo}
            onChange={(event) => setDriverForm((prev) => ({ ...prev, licenseNo: event.target.value }))}
          />
          <Button type="submit">Add Driver</Button>
        </form>
        <Table headers={['Name', 'Email/ID', 'Phone', 'License']}>
          {drivers.length > 0 ? (
            drivers.map((driver) => (
              <tr key={driver.id}>
                <td className="px-6 py-4 font-semibold">{driver.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{driver.userId}</td>
                <td className="px-6 py-4">{driver.phone ?? '--'}</td>
                <td className="px-6 py-4">{driver.licenseNo ?? '--'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                No drivers configured.
              </td>
            </tr>
          )}
        </Table>
      </Card>

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
