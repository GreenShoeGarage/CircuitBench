/* Offline reusable libraries, stored independently of the current project. GPL-3.0-only. */
(function(root){'use strict';const empty=()=>({symbols:[],footprints:[],devices:[],blocks:[]});let dbPromise;
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{let r=indexedDB.open('circuitbench.libraries.v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('entries',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close other CIRCUITBENCH tabs to open the library store.'));});return dbPromise;}
async function read(){let d=await db();return new Promise((resolve,reject)=>{let tx=d.transaction('entries'),r=tx.objectStore('entries').getAll();r.onsuccess=()=>{let lib=empty();for(let a of r.result)lib[a.kind].push(a.entry);resolve(lib);};r.onerror=()=>reject(r.error);});}
async function merge(lib){let valid=CB.validateLibrary(lib),d=await db();await new Promise((resolve,reject)=>{let tx=d.transaction('entries','readwrite'),s=tx.objectStore('entries');for(let kind of Object.keys(valid))for(let entry of valid[kind])s.put({key:kind+':'+entry.id,kind,entry});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Library save aborted'));tx.onerror=()=>reject(tx.error);});return read();}
async function remove(kind,id){let d=await db();await new Promise((resolve,reject)=>{let tx=d.transaction('entries','readwrite');tx.objectStore('entries').delete(kind+':'+id);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});return read();}
root.CBLibraryStore={read,merge,remove};
})(globalThis);
