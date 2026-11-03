let dbPromise;
function database(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('holo-atelier',1);r.onupgradeneeded=()=>r.result.createObjectStore('cards',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});return dbPromise;}
export async function getAll(){const db=await database();return new Promise((resolve,reject)=>{const r=db.transaction('cards').objectStore('cards').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function put(record){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('cards','readwrite');tx.objectStore('cards').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
export async function remove(id){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('cards','readwrite');tx.objectStore('cards').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
