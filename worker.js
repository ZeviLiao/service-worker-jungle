const version = "v1";

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(version);
  await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
  console.log(`${version} installing…`);

  // event.waitUntil(
  //   addResourcesToCache([
  //     "/",
  //     "/index.html",
  //     "/about.html",
  //     "/styles.css",
  //     "/script.js",
  //     "/jungle.png",
  //   ])
  // );
  self.skipWaiting(); // Force the waiting service worker to become active immediately
});

self.addEventListener("activate", (event) => {
  console.log("Activate event");

  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        var promiseArr = cacheNames.map(function (item) {
          if (item !== version) {
            return caches.delete(item);
          }
        });
        return Promise.all(promiseArr);
      })
      .then(() => {
        return clients.claim(); // Immediately take control of the clients
      })
  );
});

const putInCache = async (request, response) => {
  const cache = await caches.open(version);

  if (request.method === "POST") {
    console.log("Cannot cache POST requests");
    return;
  }

  await cache.put(request, response);
};

const cacheFirst = async (request) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const responseFromNetwork = await fetch(request);
  // 排除特定的請求
  const exceptKeywords = ["browser-sync", "chrome-extension:"];
  if (
    !exceptKeywords.some((keyword) => responseFromNetwork.url.includes(keyword))
  ) {
    putInCache(request, responseFromNetwork.clone());
  }
  return responseFromNetwork;
};

self.addEventListener("fetch", (event) => {
  event.respondWith(cacheFirst(event.request));
});

// 初始化 IndexedDB
let db;
function initDB() {
  const request = indexedDB.open("FormDataDB", 1);

  request.onupgradeneeded = function (event) {
    db = event.target.result;
    const store = db.createObjectStore("formData", {
      keyPath: "id",
      autoIncrement: true,
    });
  };

  request.onsuccess = function (event) {
    db = event.target.result;
    console.log("Service Worker IndexedDB initialized");
  };

  request.onerror = function (event) {
    console.log("Service Worker IndexedDB error:", event.target.errorCode);
  };
}

// 從 IndexedDB 中獲取數據
function getDataFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["formData"], "readonly");
    const store = transaction.objectStore("formData");
    const request = store.getAll();

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject(event.target.errorCode);
    };
  });
}

// 刪除已同步的數據
function clearIndexedDB() {
  const transaction = db.transaction(["formData"], "readwrite");
  const store = transaction.objectStore("formData");
  store.clear();
}

// 同步數據到伺服器
self.addEventListener("sync", function (event) {
  if (event.tag === "sync-data") {
    console.log("Sync event triggered");
    event.waitUntil(syncData());
  }
});

async function syncData() {
  const data = await getDataFromIndexedDB();
  if (data.length === 0) {
    console.log("No data to sync");
    return;
  }

  for (const item of data) {
    try {
      const response = await fetch("https://httpbin.org/post", {
        method: "POST",
        body: JSON.stringify(item),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        console.log("Data synced successfully:", item);
      } else {
        console.log("Failed to sync data:", item);
      }
    } catch (error) {
      console.log("Error syncing data:", error);
    }
  }

  // 清除已同步的數據
  clearIndexedDB();
}

// 初始化 IndexedDB
initDB();
