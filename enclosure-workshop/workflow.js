/* CASEBENCH 2.1–2.3: review, full-scale fit testing and functional interfaces.
 * Schema 4: stable polygon faces and parametric groups must not be lost by v2.0.
 * User geometry and observations are data, never executable code.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory;
 else factory(root.CaseModel,root.CaseCore);
})(globalThis,function(M,C){'use strict';
 if(M.SCHEMA===4&&M.workflowRevision===1)return M;
 const old={...M},clone=C.clone,VERSION='2.3.1';
 const nums=(v,k,lo=-1000,hi=1000)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<lo||v>hi)throw Error(k+' must be '+lo+'–'+hi+'.');return v;};
 const txt=(v,k,n=300)=>{if(typeof v!=='string'||v.length>n)throw Error(k+' must be text (maximum '+n+' characters).');return v;};
 const id=v=>{txt(v,'Stable ID',200);if(!v||['constructor','prototype','__proto__'].includes(v))throw Error('Invalid stable ID.');return v;};
 const choices=(v,a,k)=>{if(!a.includes(v))throw Error('Unsupported '+k+'.');return v;};
 const list=(v,n,k)=>{if(!Array.isArray(v)||v.length>n)throw Error(k+' supports at most '+n+' entries.');return v;};
 const feature=(...args)=>({...old.feature(...args),outwardCut:0,edgeReference:'anchor'});
 function defaultsWorkflow(){return{schema:1,fitFrame:{web:5,band:3,keepFeatures:true,heightRefs:true},adjustments:[],interfaces:[],library:[]};}
 const interfaceTypes=['connector','led','display','button'];
 function interfaceDefinition(type='connector',face='lid',componentId=null){return{
  id:M.uid('interface'),name:({connector:'Connector access',led:'LED bezel',display:'Display bezel',button:'Captive button'})[type]||'Interface',
  type,face,componentId,enabled:true,reviewed:false,evidence:'user-entered',notes:'',u:0,v:0,rotation:0,
  localX:0,localY:0,localZ:0,width:type==='display'?24:type==='led'?5:type==='button'?8:12,
  height:type==='display'?12:type==='led'?5:type==='button'?8:6,clearance:.3,rim:2,depth:1.6,
  recess:0.8,plugWidth:16,plugHeight:9,plugReach:16,label:'',labelSize:3,
  guide:3,travel:1,stem:6,flange:2,retainerThickness:1.6,fastenerBore:2.2,cableTies:false,tiePassage:2,windowSeat:.8,windowLip:1,displayRetainer:false,deviceWidth:38,deviceHeight:26,deviceDepth:5,retainingLip:0
 };}
 function checkedInterface(v){
  const d={...interfaceDefinition(v.type,v.face,v.componentId),...v};id(d.id);txt(d.name,'Interface name');
  choices(d.type,interfaceTypes,'interface type');if(!old.FACES.includes(d.face)&&!/^poly:[A-Za-z0-9_-]+$/.test(d.face))throw Error('Unsupported interface face.');
  d.cableTies=d.cableTies===true;d.displayRetainer=d.displayRetainer===true;for(const k of ['tiePassage','windowSeat','windowLip','deviceDepth'])nums(d[k],k,.1,20);for(const k of ['deviceWidth','deviceHeight'])nums(d[k],k,2,300);nums(d.retainingLip,'Guide end-stop lip',0,3);d.componentId=d.componentId?id(d.componentId):null;d.enabled=d.enabled!==false;d.reviewed=d.reviewed===true;
  choices(d.evidence,['representative','user-entered','datasheet-derived','measured'],'dimension evidence');txt(d.notes,'Interface notes',4000);txt(d.label,'Label',24);
  for(const k of ['u','v','rotation','localX','localY','localZ'])nums(d[k],k,-1000,1000);
  for(const k of ['width','height','plugWidth','plugHeight','plugReach'])nums(d[k],k,.2,300);
  for(const k of ['rim','depth','guide','stem','flange','retainerThickness','fastenerBore'])nums(d[k],k,.2,30);
  nums(d.clearance,'Fit allowance',.05,2);nums(d.recess,'Recess depth',0,8);nums(d.travel,'Button travel',.2,8);nums(d.labelSize,'Label size',.8,20);
  return d;
 }
 function validate(input){
  const raw=typeof input==='string'?C.parse(input):C.parse(JSON.stringify(input));
  if(raw.app!=='CASEBENCH'||![1,2,3,4].includes(raw.schema))throw Error('Unsupported CASEBENCH project schema.');
  const legacy=clone(raw);if(legacy.schema===4)legacy.schema=3;
  for(const f of legacy.features||[])if(typeof f.face==='string'&&f.face.startsWith('poly:'))f.face='front';
  const p=old.validate(legacy);p.schema=4;p.version=VERSION;
  const w={...defaultsWorkflow(),...(raw.workflow||{})};if(w.schema!==1)throw Error('Unsupported workflow schema.');
  w.fitFrame={...defaultsWorkflow().fitFrame,...w.fitFrame};nums(w.fitFrame.web,'Fit-frame web',2,20);nums(w.fitFrame.band,'Fit-frame joint band',1,10);
  w.fitFrame.keepFeatures=w.fitFrame.keepFeatures!==false;w.fitFrame.heightRefs=w.fitFrame.heightRefs!==false;
  const used=new Set(p.features.map(f=>f.id));w.interfaces=list(w.interfaces,12,'Functional interfaces').map(v=>{const d=checkedInterface(v);if(used.has(d.id))throw Error('Duplicate interface ID.');used.add(d.id);return d;});
  w.library=list(w.library,24,'Interface library').map(v=>checkedInterface(v));
  w.adjustments=list(w.adjustments,100,'Fit observations').map(r=>({id:id(r.id),targetId:txt(r.targetId,'Fit target',200),kind:choices(r.kind,['u','v','width','height','fit','bore'],'correction type'),delta:nums(r.delta,'Correction',-20,20),date:txt(r.date,'Observation date',80),note:txt(r.note||'','Fit observation',4000),before:txt(r.before||'','Original fingerprint',100),after:txt(r.after||'','Applied fingerprint',100)}));
  p.workflow=w;
  p.features.forEach((f,i)=>{const o=raw.features[i];if(o.face?.startsWith('poly:')){if(!/^poly:[A-Za-z0-9_-]+$/.test(o.face))throw Error('Invalid polygon face ID.');f.face=o.face;}
   f.outwardCut=nums(o.outwardCut??0,'Outward cut',0,100);
   f.edgeReference=choices(o.edgeReference||'anchor',['anchor','bounds'],'edge reference');
   if(o.anchorLocal){f.anchorLocal={};for(const k of ['x','y','z'])f.anchorLocal[k]=nums(o.anchorLocal[k]??0,'Local anchor '+k);}
  });
  let eid=raw.system?.shell?.edgeIds,n=p.system.shell.points.length;
  if(eid===undefined)eid=Array.from({length:n},(_,i)=>'edge-'+i);
  else {list(eid,64,'Polygon edges');eid=eid.map(id);if(new Set(eid).size!==eid.length)throw Error('Duplicate polygon edge IDs.');}
  // Topology edits get new IDs. Existing attached features then remain unresolved.
  if(eid.length!==n)eid=Array.from({length:n},(_,i)=>'edge-'+C.fingerprint(JSON.stringify(p.system.shell.points))+'-'+i);
  const coords=raw.system?.shell?.edgeCoordinates;
  if(coords!==undefined){list(coords,64,'Previous polygon vertices');for(const v of coords){if(!Array.isArray(v)||v.length!==2)throw Error('Invalid previous polygon vertex.');v.forEach(n=>nums(n,'Previous vertex',-2000,2000));}
   const pts=p.system.shell.points,pt=v=>JSON.stringify(v),edge=(a,b)=>[pt(a),pt(b)].sort().join('|');
   if(coords.length===n&&new Set(coords.map(pt)).size===n&&coords.every(v=>pts.some(q=>pt(q)===pt(v)))){const map=new Map(coords.map((v,i)=>[edge(v,coords[(i+1)%n]),eid[i]]));eid=pts.map((v,i)=>map.get(edge(v,pts[(i+1)%n]))||'edge-'+C.fingerprint(edge(v,pts[(i+1)%n])));}
  }
  p.system.shell.edgeIds=eid;p.system.shell.edgeCoordinates=clone(p.system.shell.points);
  return p;
 }
 function defaults(t,n,e){const p=old.defaults(t,n,e);p.schema=4;p.version=VERSION;p.workflow=defaultsWorkflow();p.system.shell.edgeIds=p.system.shell.points.map((_,i)=>'edge-'+i);p.system.shell.edgeCoordinates=clone(p.system.shell.points);return p;}
 function dimensions(p,a=old.effective(p)){
  const d=old.dimensions(p,a);d.planarFaces={};
  if(p.system.shell.family==='polygon'){
   const pts=p.system.shell.points,n=pts.length,area=pts.reduce((s,v,i)=>s+v[0]*pts[(i+1)%n][1]-v[1]*pts[(i+1)%n][0],0)/2,sg=area>=0?1:-1;
   const cx=(Math.min(...pts.map(v=>v[0]))+Math.max(...pts.map(v=>v[0])))/2,cy=(Math.min(...pts.map(v=>v[1]))+Math.max(...pts.map(v=>v[1])))/2;
   const inner=pts.map(v=>[v[0]-cx+d.cx,v[1]-cy+d.cy]),outer=inner.map((v,i)=>{const a=inner[(i+n-1)%n],b=inner[(i+1)%n],dx=v[0]-a[0],dy=v[1]-a[1],ex=b[0]-v[0],ey=b[1]-v[1],l=Math.hypot(dx,dy),m=Math.hypot(ex,ey),nx=sg*dy/l,ny=-sg*dx/l,qx=sg*ey/m,qy=-sg*ex/m,den=1+nx*qx+ny*qy;return[v[0]+p.settings.wall*(nx+qx)/den,v[1]+p.settings.wall*(ny+qy)/den];});
   for(let i=0;i<n;i++){let a=outer[i],b=outer[(i+1)%n],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(!Number.isFinite(len)||len<.001)continue;const ux=sg*(b[0]-a[0])/len,uy=sg*(b[1]-a[1])/len,key='poly:'+p.system.shell.edgeIds[i];
    d.planarFaces[key]={origin:[(a[0]+b[0])/2,(a[1]+b[1])/2,d.height/2],u:[ux,uy,0],v:[0,0,1],n:[uy,-ux,0],width:len,height:d.height,thickness:p.settings.wall,part:'base',label:'Polygon side '+(i+1),edgeId:p.system.shell.edgeIds[i]};
   }
  }return d;
 }
 function frame(face,d,s){if(face.startsWith('poly:')){const f=d.planarFaces?.[face];if(!f)throw Error('Polygon face no longer exists. Reattach the feature explicitly.');return f;}return old.frame(face,d,s);}
 function localAnchor(c,offset,p){
  let ax=c.transform?.localX||{x:1,y:0},ay=c.transform?.localY||{x:0,y:-1};
  const board=p.system.boards.find(b=>b.id===c.boardId);if(board){const r=board.rotation*Math.PI/180,rot=v=>({x:v.x*Math.cos(r)-v.y*Math.sin(r),y:v.x*Math.sin(r)+v.y*Math.cos(r)});ax=rot(ax);ay=rot(ay);}
  const center=c.envelopeCenter||c.position;
  return{x:center.x+ax.x*offset.x+ay.x*offset.y,y:center.y+ax.y*offset.x+ay.y*offset.y,z:center.z+(c.side==='bottom'?-1:1)*offset.z};
 }
 function featureBounds(f){
  const E=globalThis.CaseFeatures;let ex=E?E.extents(f):null;
  if(!ex&&typeof require==='function')ex=require('./features.js').extents(f);
  ex=ex||{width:f.width,height:f.height,offsetX:0};const r=f.rotation*Math.PI/180,co=Math.cos(r),si=Math.sin(r),dx=co*(ex.offsetX||0),dy=si*(ex.offsetX||0),w=Math.abs(co)*ex.width+Math.abs(si)*ex.height,h=Math.abs(si)*ex.width+Math.abs(co)*ex.height;
  return{minU:dx-w/2,maxU:dx+w/2,minV:dy-h/2,maxV:dy+h/2,width:w,height:h};
 }
 function resolvedFeature(f,p,a=old.effective(p),d=dimensions(p,a)){
  if(f.face.startsWith('poly:')&&!d.planarFaces?.[f.face])return{...f,frame:old.frame('front',d,p.settings),unresolved:true,unresolvedSurface:true};
  const fr=frame(f.face,d,p.settings);let u=f.u,v=f.v,unresolved=false;
  if(f.positioning==='edges'&&!f.componentId){const b=f.edgeReference==='bounds'?featureBounds(f):{minU:0,maxU:0,minV:0,maxV:0};u=f.edgeX==='left'?-fr.width/2+f.edgeU-b.minU:f.edgeX==='right'?fr.width/2-f.edgeU-b.maxU:f.edgeU;v=f.edgeY==='bottom'?-fr.height/2+f.edgeV-b.minV:f.edgeY==='top'?fr.height/2-f.edgeV-b.maxV:f.edgeV;}
  if(f.componentId){const c=a.components.find(c=>c.id===f.componentId);if(!c)unresolved=true;else{const pt=localAnchor(c,f.anchorLocal||{x:0,y:0,z:0},p),uv=M.project(fr,[pt.x,pt.y,pt.z+d.boardZ]);u+=uv[0];v+=uv[1];}}
  return{...f,u,v,frame:fr,unresolved};
 }
 function faceCatalog(p,a=old.effective(p)){const d=dimensions(p,a);return [...old.FACES.map(id=>({id,label:({lid:'Lid · outside',front:'Front wall',back:'Back wall',left:'Left wall',right:'Right wall',floor:'Base · outside floor','inside-floor':'Base · inside floor','inside-lid':'Lid · inside'})[id]})),...Object.entries(d.planarFaces).map(([id,f])=>({id,label:f.label+' · '+f.width.toFixed(1)+' mm'}))];}
 function interfaceFeatures(p){const features=[];
  for(const g of p.workflow?.interfaces||[]){if(!g.enabled)continue;const basic={...M.feature('cutout',g.face,g.componentId),u:g.u,v:g.v,rotation:g.rotation,anchorLocal:{x:g.localX,y:g.localY,z:g.localZ},groupId:g.id,enabled:true};
   const add=(suffix,kind,props={})=>features.push({...basic,id:g.id+'--'+suffix,name:g.name+' · '+suffix,kind,...props});
   if(g.type==='connector'){
    add('opening','cutout',{width:g.width+2*g.clearance,height:g.height+2*g.clearance,radius:Math.min(1,g.height/4),shape:'rounded'});
    if(g.recess>0)add('plug-seat','pocket',{width:Math.max(g.plugWidth,g.width+2*g.clearance+2*g.rim),height:Math.max(g.plugHeight,g.height+2*g.clearance+2*g.rim),depth:g.recess,through:false,shape:'rounded',radius:1});
   }else if(g.type==='led'){
    add('bezel','add',{width:g.width+2*g.clearance+2*g.rim,height:g.width+2*g.clearance+2*g.rim,depth:g.depth,shape:'circle'});
    add('light-aperture','cutout',{width:g.width+2*g.clearance,height:g.width+2*g.clearance,shape:'circle',depth:40,through:false,outwardCut:g.depth+.1});
   }else if(g.type==='display'){
    add('bezel','add',{width:g.width+2*g.rim,height:g.height+2*g.rim,depth:g.depth,shape:'rounded',radius:1});
    add('view','cutout',{width:g.width,height:g.height,shape:'rect',depth:40,through:false,outwardCut:g.depth+.1});
   }else{
    // Guide and plunger assembly are manufactured by workflow-geometry.js.
    add('button-bore','cutout',{width:g.width+2*g.clearance,height:g.width+2*g.clearance,shape:'circle'});
   }
   if(g.label){const offset=g.height/2+g.rim+g.labelSize,angle=g.rotation*Math.PI/180;add('label','text-raised',{text:g.label,size:g.labelSize,depth:.5,u:g.u-Math.sin(angle)*offset,v:g.v+Math.cos(angle)*offset,shape:'rect'});}
  }return features;
 }
 function reviewTasks(p,a=old.effective(p)){
  const top=a.components.filter(c=>c.body).sort((x,y)=>y.bounds.maxZ-x.bounds.maxZ),bottom=[...a.components.filter(c=>c.body&&c.bounds.minZ<0).map(c=>({id:c.id,ref:c.ref,z:c.bounds.minZ})),...a.projections.map(e=>({id:e.ownerId,ref:a.components.find(c=>c.id===e.ownerId)?.ref||e.ownerId,z:e.bounds.minZ,assumed:!e.known}))].sort((x,y)=>x.z-y.z),uniq=rows=>rows.filter((r,i)=>rows.findIndex(x=>x.id===r.id)===i);
  return{height:top.slice(0,3).map(c=>({id:c.id,ref:c.ref,z:c.bounds.maxZ,evidence:c.geometryStatus})),underside:uniq(bottom).slice(0,3),missing:a.components.filter(c=>!c.body||!c.body.height).map(c=>({id:c.id,ref:c.ref})),mounts:M.mounts(p,a).filter(h=>!h.confirmed&&p.review.mounting[h.id]!=='exclude').map(h=>({id:h.id,x:h.x,y:h.y,ref:(h.ownerId?'Linked hole':'Board hole')+(h.slot>0?' · slot':'')+(h.enabled?'':' · support off')})),access:a.components.filter(c=>['Connectors','Switches'].includes(c.category)&&!p.workflow.interfaces.some(g=>g.enabled&&g.componentId===c.id)).map(c=>({id:c.id,ref:c.ref})),assumedLeads:a.summary.assumedProjections===true};
 }
 function geometryState(p){const w=clone(p.workflow||{});delete w.adjustments;delete w.library;delete w.fitFrame;return old.geometryState(p)+'\n'+JSON.stringify(w);}
 function geometryFingerprint(p){return C.fingerprint(geometryState(p));}
 function proofStatus(p){const stamp=geometryFingerprint(p),find=kind=>{let all=p.system.evidence.filter(e=>e.kind===kind),r=all.filter(e=>e.fingerprint===stamp).at(-1);return r?{status:r.result==='pass'?'recorded-pass':r.result==='fail'?'recorded-fail':'observed',record:r}:all.length?{status:'stale'}:{status:'untested'};};return{geometryFingerprint:stamp,slicer:find('slicer'),fit:find('fit')};}
 function addEvidence(p,kind,v){const q=clone(p);q.system.evidence.push({id:M.uid('trial'),kind,date:new Date().toISOString(),fingerprint:geometryFingerprint(p),name:v.name,result:v.result,notes:v.notes||''});return validate(q);}
 function correction(p,values){let q=clone(p),target=q.features.find(f=>f.id===values.targetId)||q.workflow.interfaces.find(f=>f.id===values.targetId),delta=nums(values.delta,'Correction',-20,20),kind=choices(values.kind,['u','v','width','height','fit','bore'],'correction');if(!delta)throw Error('Enter a nonzero measured correction.');
  if(kind==='fit')q.settings.fit+=delta;else if(kind==='bore'){const h=M.mounts(p).find(h=>h.id===values.targetId);if(!h)throw Error('Select a mounting support for a bore correction.');q.supports[h.id]={...q.supports[h.id],bore:h.boreDiameter+delta};}else{if(!target)throw Error('Select an editable feature or interface.');if(kind==='u'||kind==='v')M.shiftFeature(target,kind==='u'?delta:0,kind==='v'?delta:0);else target[kind]+=delta;}
  q=validate(q);q.workflow.adjustments.push({id:M.uid('fit-adjustment'),targetId:values.targetId||'joint',kind,delta,date:new Date().toISOString(),note:values.note||'',before:geometryFingerprint(p),after:geometryFingerprint(q)});return validate(q);
 }
 function toRecipe(p,name){const r=old.toRecipe(p,name);r.schema=2;r.interfaces=clone(p.workflow.interfaces);for(const g of r.interfaces)if(g.componentId&&!r.anchors.some(a=>a.id===g.componentId)){const c=old.effective(p).components.find(c=>c.id===g.componentId);r.anchors.push({id:g.componentId,label:c?.ref||'Missing component'});}return r;}
 function applyRecipe(p,r,mapping={}){if(![1,2].includes(r.schema))throw Error('Unsupported recipe schema.');const before=clone(p),legacy=clone(p);legacy.schema=3;for(const f of legacy.features)if(f.face.startsWith('poly:'))f.face='front';const incoming=clone(r),faces=new Map(incoming.features.map((f,i)=>[i,f.face]));for(const f of incoming.features)if(f.face.startsWith('poly:'))f.face='front';const q=old.applyRecipe(legacy,{...incoming,schema:1},mapping);q.features.forEach((f,i)=>f.face=faces.get(i));q.workflow=defaultsWorkflow();q.workflow.interfaces=(r.interfaces||[]).map(g=>({...clone(g),id:M.uid('interface'),componentId:g.componentId?(mapping[g.componentId]||'recipe-unmapped:'+g.componentId):null,reviewed:false}));return validate(q);}
 function clearChangedInterfaceReview(q,oldText,newText,prefix=''){const before=new Map(C.normalize(oldText).components.map(c=>[prefix+c.id,c])),after=new Map(C.normalize(newText).components.map(c=>[prefix+c.id,c]));for(const g of q.workflow.interfaces){const a=before.get(g.componentId),b=after.get(g.componentId);if(a&&(!b||JSON.stringify(a)!==JSON.stringify(b)))g.reviewed=false;}}
 function revisionPreview(p,t){const v=old.revisionPreview(p,t),ids=new Set(v.next.components.map(c=>c.id)),primary=new Set(v.old.components.map(c=>c.id));v.missingInterfaceLinks=p.workflow.interfaces.filter(g=>g.componentId&&primary.has(g.componentId)&&!ids.has(g.componentId)).map(g=>g.id);v.missingLinks=[...new Set(v.missingLinks.concat(v.missingInterfaceLinks))];return v;}
 const applyRevision=(p,t,n)=>{const preview=revisionPreview(p,t),q=clone(p),date=new Date().toISOString();clearChangedInterfaceReview(q,p.source.text,t);q.review.baseline={sourceText:p.source.text,date};q.revisions.push({date,from:p.source.fingerprint.value,to:C.fingerprint(t),changes:preview.changes});q.revisions=q.revisions.slice(-10);q.source={text:t,filename:n||'Copperbench.json',fingerprint:{algorithm:'FNV-1a-32 UTF-16 (change hint)',value:C.fingerprint(t)},isExample:false};q.updated=date;M.initializeMountSuggestions(q,t,'',preview.old.bores.map(h=>h.id));return validate(q);};
 function applyAdditionalRevision(p,boardId,t,n){const q=clone(p),b=q.system.boards.find(b=>b.id===boardId);if(!b)throw Error('Select the additional board to revise.');C.normalize(t);const oldIds=C.normalize(b.source.text).bores.map(h=>h.id);clearChangedInterfaceReview(q,b.source.text,t,boardId+'::');b.baseline={...b.source,date:new Date().toISOString()};b.source={text:t,filename:n||'board.json'};M.initializeMountSuggestions(q,t,boardId+'::',oldIds);return validate(q);}

 const addBoard=(p,t,n)=>{const q=clone(p),a=C.normalize(t);q.system.boards.push({id:M.uid('board-instance'),name:n||a.source.title||'Additional board',source:{text:t,filename:n||'board.json'},x:0,y:0,z:20,rotation:0,enabled:true,supports:false});M.initializeMountSuggestions(q,t,q.system.boards.at(-1).id+'::');return validate(q);};
 Object.assign(M,{VERSION,workflowRevision:1,SCHEMA:4,feature,defaults,validate,dimensions,frame,resolvedFeature,faceCatalog,localAnchor,featureBounds,interfaceDefinition,interfaceFeatures,checkedInterface,interfaceTypes,defaultsWorkflow,reviewTasks,geometryState,geometryFingerprint,proofStatus,addEvidence,correction,toRecipe,applyRecipe,applyRevision,applyAdditionalRevision,revisionPreview,addBoard});
 return M;
});
