export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // Unsupported or blocked — safe no-op
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
