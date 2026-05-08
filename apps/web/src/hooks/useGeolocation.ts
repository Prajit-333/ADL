import { useState, useEffect } from 'react';

export function useGeolocation(enabled: boolean, vehicleId?: string) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

<<<<<<< HEAD
=======
  const sendUpdate = useCallback(async (pos: GeolocationPosition) => {
    if (!vehicleId) return;
    try {
      await api.updateLocation({
        vehicleId,
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        speed: pos.coords.speed || 0,
      });
    } catch (err) {
      console.error('Failed to send location update', err);
    }
  }, [vehicleId]);

>>>>>>> c8830d5974eb3a3a2251c74c5429b40835c640aa
  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { position, error };
}
