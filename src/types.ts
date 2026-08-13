export type ErrorCode = { id:string; code:string; name:string; category:string; type:string; level:string; className:string; description:string; investigation:string; recovery:string; retry:string; updatedAt:string };
export type SyncMeta = { fileId?:string; cloudModifiedTime?:string; lastSyncedAt?:string };
export const emptyRecord = (): ErrorCode => ({id:crypto.randomUUID(),code:'',name:'',category:'',type:'',level:'',className:'',description:'',investigation:'',recovery:'',retry:'',updatedAt:new Date().toISOString()});
