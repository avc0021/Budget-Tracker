let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_tracker', { autoIncrement: true });
  };

// upon a successful 
request.onsuccess = function(event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;
  
    // check if app is online, if yes run uploadTracker() function to send all local db data to api
    if (navigator.onLine) {
      // we haven't created this yet, but we will soon, so let's comment it out for now
      // uploadPizza();
    }
  };
  
request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
  };

// This function will be executed if we attempt to submit a new budget tracker and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_tracker'], 'readwrite');
  
    // access the object store for `new_tracker`
    const trackerObjectStore = transaction.objectStore('new_tracker');
  
    // add record to your store with add method
    trackerObjectStore.add(record);
  }

function uploadTracker() {
    // open a transaction on your db
    const transaction = db.transaction(['new_tracker'], 'readwrite');
  
    // access your object store
    const trackerObjectStore = transaction.objectStore('new_tracker');
  
    // get all records from store and set to a variable
    const getAll = trackerObjectStore.getAll();
  
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
    
              const transaction = db.transaction(['new_tracker'], 'readwrite');
              const trackerObjectStore = transaction.objectStore('new_tracker');
              // clear all items in your store
              trackerObjectStore.clear();
            })
            .catch(err => {
              // set reference to redirect back here
              console.log(err);
            });
        }
      };
    }
    
    // listen for app coming back online
    window.addEventListener('online', uploadTracker);
  