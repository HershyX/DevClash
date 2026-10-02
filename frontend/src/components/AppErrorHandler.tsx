/**
 * AppErrorHandler
 * ────────────────────────────────────────────────────────────────────────────
 * Subscribes to the apiErrorBus and translates HTTP errors into user-friendly
 * toast notifications. Mount this once at the app root (inside ToastProvider).
 *
 * Codes that are "noisy" to toast (handled inline by forms) are filtered out
 * in apiClient.ts via the SILENT_CODES set.
 */
import { useEffect } from 'react';
import { useToast } from '@context/ToastContext';
import { apiErrorBus, type ApiError } from '@services/apiClient';

const STATUS_MESSAGES: Record<number, { title: string; message: string }> = {
  0:   { title: 'Connection lost',     message: 'Cannot reach the server. Check your internet connection.' },
  403: { title: 'Access denied',       message: 'You do not have permission to perform this action.' },
  429: { title: 'Too many requests',   message: 'Please slow down and try again in a moment.' },
  500: { title: 'Server error',        message: 'Something went wrong on our end. Please try again.' },
  502: { title: 'Server unavailable',  message: 'The server is temporarily unavailable. Please try again shortly.' },
  503: { title: 'Service unavailable', message: 'The service is temporarily unavailable. Please try again.' },
};

export function AppErrorHandler() {
  const { showToast } = useToast();

  useEffect(() => {
    const handler = (err: ApiError) => {
      const preset = STATUS_MESSAGES[err.status];
      if (preset) {
        showToast({ type: 'error', title: preset.title, message: preset.message });
      } else if (err.status >= 500) {
        showToast({ type: 'error', title: 'Server error', message: err.serverMessage });
      } else if (err.status === 0) {
        showToast({ type: 'error', title: 'Connection lost', message: err.serverMessage });
      } else {
        // Unexpected non-silent code — surface the server message
        showToast({ type: 'error', title: `Error ${err.status}`, message: err.serverMessage });
      }
    };

    apiErrorBus.subscribe(handler);
    return () => apiErrorBus.unsubscribe(handler);
  }, [showToast]);

  return null; // renders nothing — side-effect only
}
