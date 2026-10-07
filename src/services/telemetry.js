/**
 * Production Client Telemetry Service
 * Sends unhandled client exceptions and render crashes to the backend telemetry logger.
 */
import { API_BASE_URL } from './api.js';

export async function logClientError(error, info = {}) {
  try {
    const payload = {
      error: {
        message: error?.message || String(error),
        stack: error?.stack || null,
        name: error?.name || 'Error',
      },
      info: {
        componentStack: info?.componentStack || null,
      },
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // Print to console in dev mode
    if (import.meta.env.DEV) {
      console.error('[Telemetry] Caught client error:', payload);
    }

    // Attempt to log to telemetry backend endpoint
    await fetch(`${API_BASE_URL}/telemetry/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Keepalive ensures the request fires even during page unload or crashes
      keepalive: true,
    }).catch(() => {
      // Fail silently to prevent crashing the error boundary itself
    });
  } catch (telemetryErr) {
    console.warn('[Telemetry] Failed to dispatch error log:', telemetryErr);
  }
}

export default {
  logClientError,
};
