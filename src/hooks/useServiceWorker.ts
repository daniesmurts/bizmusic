"use client";

import { useEffect, useState, useCallback } from "react";

export function useServiceWorker() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isDev = process.env.NODE_ENV === "development";

    if (isDev) {
      // In development, vigorously unregister any stale service workers
      // to resolve "sw.js 404" red errors.
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log("[PWA] Unregistered zombie service worker in dev");
          });
        }
      });
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Уже есть ожидающий воркер
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setShowUpdate(true);
        }

        // Новый воркер установлен и ожидает активации
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              setWaitingWorker(newWorker);
              setShowUpdate(true);
            }
          });
        });
      })
      .catch((err) => {
        console.error("SW registration failed:", err);
      });

    // Reload on new SW activation — but only when safe (no active uploads/fetches)
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;

      // Defer reload if the page has pending XHR uploads or fetch requests
      const hasPendingXhr =
        typeof (performance as { getEntriesByType?: unknown }).getEntriesByType === "function" &&
        (performance.getEntriesByType("resource") as PerformanceResourceTiming[]).some(
          (e) => e.initiatorType === "xmlhttprequest" && e.responseEnd === 0
        );

      if (!hasPendingXhr && document.visibilityState !== "hidden") {
        window.location.reload();
      } else {
        // Retry when user returns to the tab and there's no active upload
        const onVisible = () => {
          document.removeEventListener("visibilitychange", onVisible);
          window.location.reload();
        };
        document.addEventListener("visibilitychange", onVisible);
      }
    });
  }, []);

  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  }, [waitingWorker]);

  const dismissUpdate = useCallback(() => {
    setShowUpdate(false);
  }, []);

  return { showUpdate, applyUpdate, dismissUpdate };
}
