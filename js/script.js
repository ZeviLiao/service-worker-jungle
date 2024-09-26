// 初始化 IndexedDB
let db;
function initDB() {
  const request = indexedDB.open('FormDataDB', 1);

  request.onupgradeneeded = function(event) {
    db = event.target.result;
    const store = db.createObjectStore('formData', { keyPath: 'id', autoIncrement: true });
  };

  request.onsuccess = function(event) {
    db = event.target.result;
    console.log('IndexedDB initialized');
  };

  request.onerror = function(event) {
    console.log('IndexedDB error:', event.target.errorCode);
  };
}

// 將數據存到 IndexedDB
function saveDataToIndexedDB(data) {
  const transaction = db.transaction(["formData"], "readwrite");
  const store = transaction.objectStore("formData");
  store.add(data);
  console.log("Data saved to IndexedDB:", data);
}

// 提交表單
document
  .getElementById("dataForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const inputValue = document.getElementById("inputValue").value;
    const formData = { value: inputValue, timestamp: Date.now() };

    // 嘗試發送數據到 API
    sendDataToAPI(formData);
  });

// 發送數據到 API
function sendDataToAPI(data) {
  fetch("https://httpbin.org/post", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data submitted successfully:", data);
    })
    .catch((error) => {
      console.log("Error submitting data, saving to IndexedDB:", error);
      // 如果發送失敗，則將數據存儲到 IndexedDB
      saveDataToIndexedDB(data);
      // 通知 Service Worker 註冊 sync 事件
      registerSync();
    });
}

// 註冊 sync 事件
function registerSync() {
  navigator.serviceWorker.ready
    .then(function (swRegistration) {
      return swRegistration.sync.register("sync-data");
    })
    .then(function () {
      console.log("Sync registered");
    })
    .catch(function (err) {
      console.log("Sync registration failed", err);
    });
}

// 初始化 IndexedDB
initDB();
