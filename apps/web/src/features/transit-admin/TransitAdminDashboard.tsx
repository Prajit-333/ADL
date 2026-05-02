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
  const { routes, stops, setRoutes, setStops } = useRouteStore();
  const { activeBuses, setActiveBuses } = useBusStore();
  const { logout } = useAuthStore();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignmentRows, setAssignmentRows] = useState<
    Array<{
      id: string;
      vehicleId: string;
      routeId: string;
      driverId: string;
      vehicleRegistration: string;
      routeCode: string;
      driverName: string;
      startDate: string;
    }>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const [assignmentForm, setAssignmentForm] = useState({
    vehicleId: '',
    routeId: '',
    driverId: '',
  });

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [routesRes, stopsRes, busesRes, driversRes, assignmentsRes] = await Promise.all([
          api.getRoutes(),
          api.getStops(),
          api.getActiveBuses(),
          api.getDrivers(),
          api.getAssignments(),
        ]);

        if (routesRes.success) setRoutes(routesRes.data);
        if (stopsRes.success) setStops(stopsRes.data);
        if (busesRes.success && busesRes.data.length > 0) setActiveBuses(busesRes.data);
        if (driversRes.success) setDrivers(driversRes.data);
        if (assignmentsRes.success) {
          setAssignmentRows(
            assignmentsRes.data.map((item) => ({
              id: item.id,
              vehicleId: item.vehicleId,
              routeId: item.routeId,
              driverId: item.driverId,
              vehicleRegistration: item.vehicleRegistration,
              routeCode: item.routeCode,
              driverName: item.driverName,
              startDate: item.startDate,
            })),
          );
        }
      } catch (error) {
        console.error(error);
        setErrorMessage('Failed to load transit admin data from API.');
      }
    };

    void bootstrap();
  }, [setActiveBuses, setRoutes, setStops]);

  const vehicles = useMemo(
    () => (activeBuses.length > 0 ? activeBuses : defaultVehicles),
    [activeBuses],
  );

  const handleAddVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const registration = vehicleForm.registration.trim().toUpperCase();
    const type = vehicleForm.type.trim();
    const capacity = Number(vehicleForm.capacity);

    if (!registration || !type || Number.isNaN(capacity) || capacity < 10) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createVehicle({
        registration,
        type,
        capacity,
        status: vehicleForm.status,
      });
      if (res.success) {
        setActiveBuses([res.data, ...vehicles]);
        setVehicleForm({ registration: '', type: '', capacity: '40', status: VehicleStatus.ACTIVE });
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Failed to create vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVehicleStatusUpdate = (vehicleId: string, status: VehicleStatus) => {
    const updated = vehicles.map((vehicle) =>
      vehicle.id === vehicleId ? { ...vehicle, status } : vehicle,
    );
    setActiveBuses(updated);
  };

  const handleAddRoute = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const code = routeForm.code.trim().toUpperCase();
    const name = routeForm.name.trim();
    const city = routeForm.city.trim();

    if (!code || !name || !city) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createRoute({ code, name, city });
      if (res.success) {
        setRoutes([res.data, ...routes]);
        setRouteForm({ code: '', name: '', city: '' });
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStop = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    const routeId = stopForm.routeId.trim();
    const name = stopForm.name.trim();
    const latitude = Number(stopForm.latitude);
    const longitude = Number(stopForm.longitude);

    if (!routeId || !name || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createStop({ routeId, name, latitude, longitude });
      if (res.success) {
        setStops([res.data, ...stops]);
        setStopForm({ routeId: '', name: '', latitude: '', longitude: '' });
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Failed to create stop');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAssignment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!assignmentForm.vehicleId || !assignmentForm.routeId || !assignmentForm.driverId) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.createAssignment({
        vehicleId: assignmentForm.vehicleId,
        routeId: assignmentForm.routeId,
        driverId: assignmentForm.driverId,
      });
      if (res.success) {
        const vehicle = vehicles.find((item) => item.id === assignmentForm.vehicleId);
        const route = routes.find((item) => item.id === assignmentForm.routeId);
        const driver = drivers.find((item) => item.id === assignmentForm.driverId);
        setAssignmentRows([
          {
            id: res.data.id,
            vehicleId: res.data.vehicleId,
            routeId: res.data.routeId,
            driverId: res.data.driverId,
            startDate: res.data.startDate,
            vehicleRegistration: vehicle?.registration ?? res.data.vehicleId,
            routeCode: route?.code ?? res.data.routeId,
            driverName: driver?.name ?? res.data.driverId,
          },
          ...assignmentRows,
        ]);
        setAssignmentForm({ vehicleId: '', routeId: '', driverId: '' });
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Failed to create assignment');
    } finally {
      setIsSubmitting(false);
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
      {errorMessage && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

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
          <Button type="submit" disabled={isSubmitting}>Add Vehicle</Button>
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

      <Card className="space-y-4">
        <h3 className="font-bold">Assign Driver, Route and Vehicle</h3>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3" onSubmit={handleAddAssignment}>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            value={assignmentForm.vehicleId}
            onChange={(event) =>
              setAssignmentForm((prev) => ({ ...prev, vehicleId: event.target.value }))
            }
          >
            <option value="">Select Vehicle</option>
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.registration}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            value={assignmentForm.routeId}
            onChange={(event) =>
              setAssignmentForm((prev) => ({ ...prev, routeId: event.target.value }))
            }
          >
            <option value="">Select Route</option>
            {routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.code} - {route.name}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-300 rounded-md px-3 py-2 bg-white"
            value={assignmentForm.driverId}
            onChange={(event) =>
              setAssignmentForm((prev) => ({ ...prev, driverId: event.target.value }))
            }
          >
            <option value="">Select Driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
          <Button type="submit" disabled={isSubmitting}>Create Assignment</Button>
        </form>

        <Table headers={['Vehicle', 'Route', 'Driver', 'Start Date']}>
          {assignmentRows.length > 0 ? (
            assignmentRows.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4">{item.vehicleRegistration}</td>
                <td className="px-6 py-4">{item.routeCode}</td>
                <td className="px-6 py-4">{item.driverName}</td>
                <td className="px-6 py-4">{new Date(item.startDate).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                No assignments created yet.
              </td>
            </tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
