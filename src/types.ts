export const MACHINE_MODELS = { SRC350:['SRC350-M2'], HU300:['HU300-M3'] } as const;
export type MachineSeries = keyof typeof MACHINE_MODELS;
export type MachineModel = (typeof MACHINE_MODELS)[MachineSeries][number];
export type DataScope = 'series'|'model';
export type ErrorCode = { id:string; series:MachineSeries; model:MachineModel; scope:DataScope; code:string; name:string; category:string; type:string; level:string; className:string; description:string; investigation:string; recovery:string; retry:string; updatedAt:string };
export type SyncMeta = { fileId?:string; cloudModifiedTime?:string; lastSyncedAt?:string };
export const emptyRecord = (series:MachineSeries='SRC350',model:MachineModel='SRC350-M2',scope:DataScope='model'): ErrorCode => ({id:crypto.randomUUID(),series,model,scope,code:'',name:'',category:'',type:'',level:'',className:'',description:'',investigation:'',recovery:'',retry:'',updatedAt:new Date().toISOString()});
export const normalizeRecord = (record:Partial<ErrorCode>):ErrorCode => ({...emptyRecord(),...record,series:record.series||'SRC350',model:record.model||'SRC350-M2',scope:record.scope||'model'});
