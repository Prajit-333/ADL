import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api } from '../services/api';

const toRadians = (deg: number) => (deg * Math.PI) / 180;

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export function useTripTracker(enabled: boolean, assignment: any) {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stopsCrossed, setStopsCrossed] = useState(0);
  const [tripStatus, setTripStatus] = useState<'STATIONARY' | 'ACTIVE' | 'WRONG_DIRECTION' | 'OFF_ROUTE'>('STATIONARY');
  
  const wakeLockRef = useRef<any>(null);
  const latestPosRef = useRef<GeolocationPosition | null>(null);
  const lastSentTimeRef = useRef<number>(0);
  const prevDistanceRef = useRef<number | null>(null);
  const initialCheckDoneRef = useRef(false);

  const vehicleId = assignment?.vehicleId;
  // Sort stops by sequence so stops[0] is always the actual first stop
  const stops = useMemo(
    () => [...(assignment?.route?.stops || [])].sort((a: any, b: any) => a.sequence - b.sequence),
    [assignment]
  );

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Screen Wake Lock released');
        });
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Setup WakeLock and Initial state when enabled
  useEffect(() => {
    if (enabled) {
      requestWakeLock();
      initialCheckDoneRef.current = false;
      setStopsCrossed(0);
      setTripStatus('STATIONARY');
    } else {
      releaseWakeLock();
    }
    
    const handleVisibilityChange = async () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible' && enabled) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Main Tracking Loop
  const processLocation = useCallback(async (pos: GeolocationPosition) => {
    if (!vehicleId || !enabled) return;

    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const speedMs = pos.coords.speed || 0;
    const speedKmh = speedMs * 3.6;

    let newStatus = tripStatus;
    let currentStopsCrossed = stopsCrossed;

    if (stops.length > 0) {
      // 1. Initial Off-Route check
      if (!initialCheckDoneRef.current) {
        const distToStart = getDistanceKm(lat, lon, stops[0].latitude, stops[0].longitude);
        if (distToStart > 0.5) { // more than 500m from start
          newStatus = 'OFF_ROUTE';
        }
        initialCheckDoneRef.current = true;
      }

      // 2. Auto-Stop Detection
      if (currentStopsCrossed < stops.length) {
        const nextStop = stops[currentStopsCrossed];
        const distToNext = getDistanceKm(lat, lon, nextStop.latitude, nextStop.longitude);
        
        // Auto-arrive if within 50 meters
        // Auto-arrive if within 50 meters
        if (distToNext < 0.05) {
          currentStopsCrossed++;
          setStopsCrossed(currentStopsCrossed);
          prevDistanceRef.current = null; // reset for next stop
          newStatus = 'ACTIVE';
        } else {
          // 3. Direction & Stationary Checks
          if (speedKmh < 1) {
            newStatus = 'STATIONARY';
          } else {
            // Check if still off route (more than 500m from next stop, roughly)
            // or just rely on direction
            if (newStatus === 'OFF_ROUTE' && distToNext < 0.5) {
               newStatus = 'ACTIVE'; // Recovered
            }
            
            if (newStatus !== 'OFF_ROUTE') {
              if (prevDistanceRef.current !== null && distToNext > prevDistanceRef.current + 0.05) {
                // Moved 50m further away from the stop
                newStatus = 'WRONG_DIRECTION';
              } else if (newStatus === 'WRONG_DIRECTION' && distToNext < prevDistanceRef.current!) {
                // Corrected direction
                newStatus = 'ACTIVE';
                prevDistanceRef.current = distToNext;
              } else if (newStatus !== 'WRONG_DIRECTION') {
                newStatus = 'ACTIVE';
                if (prevDistanceRef.current === null || distToNext < prevDistanceRef.current) {
                  prevDistanceRef.current = distToNext;
                }
              }
            }
          }
        }
      } else {
        // Trip finished
        newStatus = speedKmh < 1 ? 'STATIONARY' : 'ACTIVE';
      }
    } else {
      newStatus = speedKmh < 1 ? 'STATIONARY' : 'ACTIVE';
    }

    setTripStatus(newStatus);

    // 4. Throttling logic
    const now = Date.now();
    const timeSinceLastSend = now - lastSentTimeRef.current;
    const sendInterval = speedKmh > 1 ? 15000 : 60000; // 15s if moving, 60s if stationary

    if (timeSinceLastSend >= sendInterval) {
      lastSentTimeRef.current = now;
      try {
        await api.updateLocation({
          vehicleId,
          latitude: lat,
          longitude: lon,
          speed: speedKmh,
          status: newStatus,
          stopsCrossed: currentStopsCrossed,
        } as any); // cast to any because we updated types but api.ts signature might need loose types
      } catch (err) {
        console.error('Failed to send location update', err);
      }
    }
  }, [enabled, vehicleId, stops, stopsCrossed, tripStatus]);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition(pos);
        latestPosRef.current = pos;
        processLocation(pos);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    // Backup interval loop just in case watchPosition hangs (happens on some mobile browsers)
    const backupInterval = setInterval(() => {
      if (latestPosRef.current) {
        processLocation(latestPosRef.current);
      }
    }, 15000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(backupInterval);
    };
  }, [enabled, processLocation]);

  return { position, error, stopsCrossed, tripStatus };
}
