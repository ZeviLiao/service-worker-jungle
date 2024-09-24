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
  //     "/styles.css",
  //     "/script.js",
  //     "/jungle.png",
  //   ])
  // );
});

self.addEventListener("activate", (event) => {
  console.log("Activate event");

  // event.waitUntil(
  //   caches.keys().then(function (cacheNames) {
  //     var promiseArr = cacheNames.map(function (item) {
  //       if (item !== version) {
  //         return caches.delete(item);
  //       }
  //     });
  //     return Promise.all(promiseArr);
  //   })
  //   // clients.claim() // no wait.
  // );

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
  // We need to clone the response because the response stream can only be read once

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
