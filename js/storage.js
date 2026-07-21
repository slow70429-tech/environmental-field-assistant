
const DB_NAME='efa-professional';
const DB_VERSION=1;
let db;
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('projects'))d.createObjectStore('projects',{keyPath:'id'});if(!d.objectStoreNames.contains('photos')){const s=d.createObjectStore('photos',{keyPath:'id'});s.createIndex('pointKey','pointKey')}if(!d.objectStoreNames.contains('settings'))d.createObjectStore('settings',{keyPath:'key'})};r.onsuccess=()=>{db=r.result;resolve(db)};r.onerror=()=>reject(r.error)})}
function store(name,mode='readonly'){return db.transaction(name,mode).objectStore(name)}
function dbPut(name,value){return new Promise((res,rej)=>{const r=store(name,'readwrite').put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
function dbGetAll(name){return new Promise((res,rej)=>{const r=store(name).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function dbGet(name,key){return new Promise((res,rej)=>{const r=store(name).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
function dbDelete(name,key){return new Promise((res,rej)=>{const r=store(name,'readwrite').delete(key);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
