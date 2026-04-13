// Requests microphone permission and tracks its state.
// Triggers the iOS system dialog on first launch via getUserMedia.
// After denial or when the API is unavailable, the UI should guide the user to Settings.

import { useState, useEffect, useCallback } from 'react';

export type MicPermissionState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

export function useMicrophonePermission() {
  const [state, setState] = useState<MicPermissionState>('idle');

  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices) {
      setState('unavailable');
      return;
    }
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release immediately — we only need the permission grant, not a live stream
      stream.getTracks().forEach((t) => t.stop());
      setState('granted');
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        setState('denied');
      } else {
        setState('unavailable');
      }
    }
  }, []);

  // Probe on first mount to handle already-granted and first-launch cases
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  const isPermissionGranted = state === 'granted';
  // Show the permission sheet whenever permission is not confirmed granted
  const needsPermission = state !== 'granted';

  return { permissionState: state, isPermissionGranted, needsPermission, requestPermission };
}
