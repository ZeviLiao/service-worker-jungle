const registerWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/worker.js");

      if (registration.installing) {
        console.log("Service worker installing");
      } else if (registration.waiting) {
        console.log("Service worker installed");
      } else if (registration.active) {
        console.log("Service worker active");
      }

      // 註冊 SyncManager
      if ("SyncManager" in window) {
        console.log("SyncManager is supported");
      } else {
        console.log("SyncManager is not supported");
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};

registerWorker();
