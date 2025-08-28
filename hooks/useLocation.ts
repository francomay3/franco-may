import { useState, useEffect, useCallback, useRef } from 'react';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
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

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage =
          'Location access denied. Please allow location access in your browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage =
          'Location information is unavailable. Please check your GPS/network connection.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Please try again.';
        break;
      default:
        errorMessage = 'An unknown error occurred while getting your location.';
        break;
    }

    setLocation(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser.',
        loading: false,
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
    });

    watchIdRef.current = id;
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clear location when stopping
    setLocation({
      latitude: null,
      longitude: null,
      accuracy: null,
      error: null,
      loading: false,
    });
  }, []);

  // Start watching on mount
  useEffect(() => {
    startWatching();

    // Cleanup on unmount
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []); // Empty dependency array - only run on mount

  return {
    ...location,
    startWatching,
    stopWatching,
  };
};
