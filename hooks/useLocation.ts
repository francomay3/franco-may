import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permission?: PermissionState; // 'granted' | 'denied' | 'prompt'
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  });

  const watchIdRef = useRef<number | null>(null);
  const mounted = useRef(true);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    if (!mounted.current) {
      return;
    }
    setLocation(prev => ({
      ...prev,
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      error: null,
      loading: false,
    }));
  }, []);

  const handleError = useCallback((err: GeolocationPositionError | any) => {
    if (!mounted.current) {
      return;
    }
    const code = typeof err?.code === 'number' ? err.code : -1;
    const msg =
      code === 1
        ? 'Location access denied.'
        : code === 2
          ? 'Location unavailable.'
          : code === 3
            ? 'Location request timed out.'
            : (err?.message ?? 'Unknown geolocation error.');
    setLocation(prev => ({ ...prev, error: msg, loading: false }));
  }, []);

  const startWatching = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation not supported.',
        loading: false,
      }));
      return;
    }
    setLocation(prev => ({ ...prev, loading: true, error: null }));
    try {
      const id = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 }
      );
      watchIdRef.current = id;
    } catch (e) {
      handleError(e);
    }
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // keep last known position; just mark not loading
    setLocation(prev => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    mounted.current = true;

    // reflect permission state (helps debug “it doesn’t work”)
    if ('permissions' in navigator && (navigator as any).permissions?.query) {
      (navigator as any).permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((p: PermissionStatus) => {
          setLocation(prev => ({ ...prev, permission: p.state }));
          p.onchange = () =>
            setLocation(prev => ({ ...prev, permission: p.state }));
        })
        .catch(() => {});
    }

    startWatching();
    return () => {
      mounted.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  return { ...location, startWatching, stopWatching };
};
