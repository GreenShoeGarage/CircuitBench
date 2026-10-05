/* CIRCUITBENCH extensions to the CASEBENCH model. GPL-3.0-only. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else factory(root.CaseModel,root.CaseCore);})(globalThis,function(M,C){'use strict';
const old={...M},clone=C.clone;
function extension(v={}){const num=(n,min,max,key)=>{if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw Error('Invalid enclosure '+key);return n;};
 let o={schema:1,supportMode:v.supportMode||'blind',boreDepth:v.boreDepth??4,nutPockets:v.nutPockets===true,manualSupports:[],migrationNotes:[]};if(v.schema!=null&&v.schema!==1)throw Error('Unsupported enclosure integration schema.');if(!['blind','through','solid'].includes(o.supportMode))throw Error('Unsupported support bore mode.');num(o.boreDepth,.5,100,'blind bore depth');
 if(!Array.isArray(v.manualSupports||[])||(v.manualSupports||[]).length>100)throw Error('Too many manual supports.');const ids=new Set();for(const m of v.manualSupports||[]){if(typeof m.id!=='string'||!/^[-\w]{1,100}$/.test(m.id)||ids.has(m.id))throw Error('Invalid manual support ID');ids.add(m.id);o.manualSupports.push({id:m.id,x:num(m.x,-1000,1000,'support X'),y:num(m.y,-1000,1000,'support Y'),diameter:num(m.diameter,2,30,'support diameter'),bore:num(m.bore,0,20,'support bore'),enabled:m.enabled!==false});}
 if(!Array.isArray(v.migrationNotes||[]))throw Error('Invalid migration notes');o.migrationNotes=(v.migrationNotes||[]).slice(0,20).map(s=>String(s).slice(0,2000));return o;
}
function validate(input){let data=typeof input==='string'?C.parse(input):input,q=old.validate(data);q.integration=extension(data.integration);q.version=M.VERSION;return q;}
function defaults(...args){let q=old.defaults(...args);q.integration=extension();q.version=M.VERSION;return q;}
function mounts(p,a=old.effective(p)){let list=old.mounts(p,a).map(h=>({...h,boreDiameter:p.integration?.supportMode==='solid'?0:h.boreDiameter}));for(const m of p.integration?.manualSupports||[])list.push({...m,manual:true,boardId:'primary',z:0,role:'manual-support',confirmed:true,diameter:m.diameter,outerDiameter:m.diameter,boreDiameter:p.integration.supportMode==='solid'?0:m.bore,perimeter:[]});return list;}
function wrapChange(fn){return function(p,...args){let q=fn(p,...args);q.integration=extension(p.integration);return q;};}
function geometryState(p){return old.geometryState(p)+'\n'+JSON.stringify(extension(p.integration));}
Object.assign(M,{defaults,validate,mounts,geometryState,geometryFingerprint:p=>C.fingerprint(geometryState(p)),applyRevision:wrapChange(old.applyRevision),applyAdditionalRevision:wrapChange(old.applyAdditionalRevision),addBoard:wrapChange(old.addBoard)});
const recipe=old.toRecipe,apply=old.applyRecipe;M.toRecipe=(p,...args)=>({...recipe(p,...args),integration:extension(p.integration)});M.applyRecipe=(p,r,...args)=>{let q=apply(p,r,...args);q.integration=extension(r.integration||p.integration);return q;};

M.correction=function(p,v){let manual=p.integration?.manualSupports.find(m=>m.id===v.targetId);let q;if(v.kind==='bore'&&manual){if(!Number.isFinite(v.delta)||!v.delta||Math.abs(v.delta)>20)throw Error('Enter a correction between -20 and 20 mm.');q=validate(p);q.integration.manualSupports.find(m=>m.id===manual.id).bore+=v.delta;q.workflow.adjustments.push({id:M.uid('fit-adjustment'),targetId:manual.id,kind:v.kind,delta:v.delta,date:new Date().toISOString(),note:v.note||'',before:'',after:''});}else q=old.correction(p,v);if(!manual||v.kind!=='bore')q.integration=extension(p.integration);const record=q.workflow.adjustments.at(-1);record.before=M.geometryFingerprint(p);record.after=M.geometryFingerprint(q);return validate(q);};
M.addEvidence=function(p,kind,v){let q=old.addEvidence(p,kind,v);q.integration=extension(p.integration);q.system.evidence.at(-1).fingerprint=M.geometryFingerprint(p);return validate(q);};
M.proofStatus=function(p){let stamp=M.geometryFingerprint(p),find=kind=>{let rows=p.system.evidence.filter(e=>e.kind===kind),r=rows.filter(e=>e.fingerprint===stamp).at(-1);return r?{status:r.result==='pass'?'recorded-pass':r.result==='fail'?'recorded-fail':'observed',record:r}:rows.length?{status:'stale'}:{status:'untested'};};return {geometryFingerprint:stamp,slicer:find('slicer'),fit:find('fit')};};
M.VERSION='1.7.0';M.provenance='Adapted from CASEBENCH 2.3.1';
return M;
});
