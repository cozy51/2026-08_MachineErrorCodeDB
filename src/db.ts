import type { ErrorCode, SyncMeta } from './types';
const DB='MachineErrorCodeDB', STORE='records', META='meta';
const open=()=>new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(STORE,{keyPath:'id'});r.result.createObjectStore(META)};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
const tx=async(store:string,mode:IDBTransactionMode='readonly')=>(await open()).transaction(store,mode).objectStore(store);
export async function getRecords(){const s=await tx(STORE);return new Promise<ErrorCode[]>((res,rej)=>{const r=s.getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function putRecord(value:ErrorCode){const s=await tx(STORE,'readwrite');return new Promise<void>((res,rej)=>{const r=s.put(value);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function deleteRecord(id:string){const s=await tx(STORE,'readwrite');return new Promise<void>((res,rej)=>{const r=s.delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function replaceRecords(values:ErrorCode[]){const db=await open();return new Promise<void>((res,rej)=>{const t=db.transaction(STORE,'readwrite');const s=t.objectStore(STORE);s.clear();values.forEach(v=>s.put(v));t.oncomplete=()=>res();t.onerror=()=>rej(t.error)})}
export async function getMeta(){const s=await tx(META);return new Promise<SyncMeta>((res)=>{const r=s.get('sync');r.onsuccess=()=>res(r.result||{})})}
export async function setMeta(value:SyncMeta){const s=await tx(META,'readwrite');return new Promise<void>((res,rej)=>{const r=s.put(value,'sync');r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
