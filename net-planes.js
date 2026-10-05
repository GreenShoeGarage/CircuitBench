/* CIRCUITBENCH quick nets, managed planes and checked connection proposals.
 * GPL-3.0-only. Workflow adapted from COPPERBENCH (MIT, Green Shoe Garage).
 * Existing polygon fills and physical copper topology remain authoritative.
 */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./board-templates'):root.CB,G=C.G,P=C.Planes={};
const face=l=>l==='F'?'front':'back',opposite=l=>l==='F'?'B':'F';
P.list=p=>p.zones.filter(z=>z.boardPlane===true);
P.get=(p,layer)=>P.list(p).find(z=>z.layer===layer)||null;
P.set=function(p,layer,net,settings={}){
 if(!['F','B'].includes(layer))throw Error('Choose front or back copper.');
 if(net&&!p.nets.includes(net))throw Error('Choose an existing net.');
 const old=P.get(p,layer);if(!net){if(old)p.zones=p.zones.filter(z=>z!==old);return null;}
 const z={id:old?.id||C.uid(),boardPlane:true,points:[],net,layer,clearance:Math.max(.1,p.rules.clearance),thermal:true,thermalGap:.3,spoke:Math.max(.5,C.designRule(p,net,'width')),...old,net};
 for(const k of ['clearance','thermal','thermalGap','spoke'])if(settings[k]!==undefined)z[k]=settings[k];
 if(old)p.zones[p.zones.indexOf(old)]=z;else p.zones.push(z);return z;
};
P.ground=function(p,both=false){let net=p.nets.find(n=>/^(gnd|ground)$/i.test(n))||C.ensureNet(p,'GND');P.set(p,'F',both?net:'');P.set(p,'B',net);return net;};
function ensureNet(p,name){if(typeof name!=='string'||!name.trim()||name.trim().length>60||/[\x00-\x1f\x7f]/.test(name))throw Error('Enter a net name of 1–60 printable characters.');name=name.trim();if(!p.nets.includes(name)){if(p.nets.length>=100)throw Error('The project supports up to 100 nets.');p.nets.push(name);}return name;}
function chosen(p,ids){if(!Array.isArray(ids)||!ids.length||ids.length>128)throw Error('Pick 1–128 component leads.');let all=C.pads(p);return [...new Set(ids)].map(id=>{let a=all.find(a=>a.id===id);if(!a)throw Error('A picked lead no longer exists. Pick it again.');return a;});}
function assign(p,ids,net){
 const pads=chosen(p,ids);if(!p.nets.includes(net))throw Error('Choose a net first.');
 for(const a of pads){if(a.net&&a.net!==net)throw Error(a.label+' belongs to '+a.net+', not '+net+'. Edit circuit intent explicitly; this helper never merges nets.');if(a.nc||a.type==='no_connect')throw Error(a.label+' is marked no-connect. Clear its NC setting before connecting it.');}
 for(const a of pads){const c=p.components.find(c=>c.id===a.component);for(const b of c.pads.filter(b=>(b.pin||b.n)===(a.pin||a.n))){b.labelNet=net;b.net=net;b.nc=false;}}
 C.rebuildNets(p);return p;
}
function assignment(input,ids,net){const p=C.validate(input);assign(p,ids,net);return C.validate(p);}
let statusKey='',statusValue=[];
P.status=function(p,top){
 if(!P.list(p).length)return [];
 const key=JSON.stringify([p.board,p.components,p.tracks,p.vias,p.holes,p.cutouts,p.zones,p.rules,p.netClasses]);if(!top&&key===statusKey)return statusValue;
 top=top||C.topology(p);const indices=new Map(top.items.map((a,i)=>[a.id,i])),pads=C.pads(p);
 const result=P.list(p).map(z=>{const areas=new Map();top.items.forEach((a,i)=>{if(a.zone&&a.owner===z.id){const root=top.u.find(i);areas.set(root,(areas.get(root)||0)+Math.abs(a.paths.reduce((n,q)=>n+G.area(q),0)));}});const roots=[...areas.keys()].sort((a,b)=>areas.get(b)-areas.get(a)),main=roots[0];const rows=pads.filter(a=>a.net===z.net).map(a=>{let root=top.u.find(indices.get(a.id));return {id:a.id,label:a.label,layer:a.layer,state:main===undefined?'empty':root===main?'connected':roots.includes(root)?'isolated':a.layer!=='both'&&a.layer!==z.layer?'needs-via':'unconnected'};});return {id:z.id,layer:z.layer,net:z.net,main,roots,regions:roots.length,area:[...areas.values()].reduce((a,b)=>a+b,0),rows,total:rows.length,connected:rows.filter(r=>r.state==='connected').length,state:!roots.length?'empty':roots.length>1?'split':'filled'};});
 statusKey=key;statusValue=result;return result;
};
const padRoot=(top,id)=>{const index=top.items.findIndex(a=>a.id===id);return index<0?null:top.u.find(index);};
function settings(p,net,o={}){const width=o.width??Math.max(.4,C.designRule(p,net,'width')),drill=o.drill??Math.max(.4,p.rules.drill),diameter=o.diameter??Math.max(.9,drill+2*p.rules.annular+.05);if(!Number.isFinite(width)||width<C.designRule(p,net,'width')||width>10)throw Error('Trace width must meet the net rule and be at most 10 mm.');if(!Number.isFinite(drill)||!Number.isFinite(diameter)||drill<p.rules.drill||drill<=0||diameter>10||(diameter-drill)/2<p.rules.annular-.00001)throw Error('Via drill and annular ring must meet the board rules (diameter at most 10 mm).');if(o.layer!==undefined&&!['F','B'].includes(o.layer))throw Error('Choose front or back copper.');return {width,drill,diameter,layer:o.layer||'F',vias:o.vias!==false};}
function region(paths){return {paths,bounds:G.bounds(paths)};}
function clearCopper(p,items){
 const material=G.boardMaterial(p,p.rules.edge),raw=C.rawCopper(p);
 for(const a of items){if(G.difference(a.paths,material).some(q=>Math.abs(G.area(q))>.0001))throw Error(a.label+' is too close to the board edge.');for(const b of raw){if(a.id===b.id||a.key===b.key||!G.sharedLayer(a,b))continue;const gap=Math.max(C.designRule(p,a.net,'clearance'),C.designRule(p,b.net,'clearance'));if(G.boxesNear(a.bounds,b.bounds,gap)&&G.geometryDistance(a,b,gap+.01)<gap-.002)throw Error(a.label+' has insufficient clearance from '+b.label+'.');}for(const h of C.holes(p)){const hole=region([G.drillPolygon(h)]);if(G.geometryDistance(a,hole,p.rules.clearance+.01)<p.rules.clearance-.002)throw Error(a.label+' is too close to a mechanical hole.');}for(const k of C.keepouts(p)){const type=a.via?'vias':a.pad?'pads':'tracks';if(k.prohibit[type]&&(a.layer==='both'||k.layers.includes('*.Cu')||k.layers.includes(a.layer+'.Cu'))&&G.overlap(a,region([k.points])))throw Error(a.label+' enters a '+type+' keepout.');}}
}
function viaFits(p,v){
 try{const trial={...p,vias:[...p.vias,v]},item=C.rawCopper(trial).find(a=>a.id===v.id);clearCopper(trial,[item]);const drill=region([G.drillPolygon(v)]);
 for(const h of [...C.pads(p).filter(a=>a.drill),...p.vias,...C.holes(p)])if(G.geometryDistance(drill,region([G.drillPolygon(h)]),p.rules.clearance+.01)<p.rules.clearance-.002)return false;
 for(const a of C.pads(p).filter(a=>a.mount==='smd'))if(G.geometryDistance(drill,region([G.padPolygon(a)]),.151)<.15)return false;
 return true;}catch{return false;}
}
function viaCandidates(p,a,s){const c=p.components.find(c=>c.id===a.component),angle=c?Math.atan2(a.y-c.pcb.y,a.x-c.pcb.x):0,start=Math.hypot(a.width||a.diameter,a.height||a.diameter)/2+s.diameter/2+.3,points=[];for(const extra of [0,.8,2,4])for(let i=0;i<8;i++){let t=angle+(i%2?1:-1)*Math.ceil(i/2)*Math.PI/4,r=start+extra;points.push({x:C.round(a.x+Math.cos(t)*r),y:C.round(a.y+Math.sin(t)*r)});}return points;}
function track(p,a,b,net,layer,s){const points=C.routeBetween(p,a,b,net,layer,s.width,.4);if(points.length<2)return;const t={id:C.uid(),net,layer,width:s.width,points};p.tracks.push(t);return t;}
function connectedToPlane(p,id,layer){return P.status(p).find(r=>r.layer===layer)?.rows.find(r=>r.id===id)?.state==='connected';}
function planeTargets(p,z,a){const top=C.topology(p),report=P.status(p,top).find(r=>r.id===z.id),targets=[];top.items.forEach((item,i)=>{if(!item.zone||item.owner!==z.id||top.u.find(i)!==report.main)return;const b=item.bounds;for(let y=Math.max(b.minY,a.y-12);y<=Math.min(b.maxY,a.y+12);y+=.7)for(let x=Math.max(b.minX,a.x-12);x<=Math.min(b.maxX,a.x+12);x+=.7){const q={x:C.round(x),y:C.round(y)};if(G.inside(q,item.paths))targets.push(q);}});return targets.sort((u,v)=>C.dist(u,a)-C.dist(v,a)).filter((q,i,all)=>i===0||C.dist(q,all[i-1])>.2).slice(0,6);}
function planPlane(input,ids,layer,options={},progress=()=>{}){
 let p=C.validate(input);const z=P.get(p,layer);if(!z)throw Error('Assign a net to that face first.');const source=chosen(p,ids),s=settings(p,z.net,{...options,layer});assign(p,ids,z.net);const selected=new Set(ids);clearCopper(p,C.rawCopper(p).filter(a=>a.pad&&selected.has(a.id)));const beforeTracks=new Set(p.tracks.map(t=>t.id)),beforeVias=new Set(p.vias.map(v=>v.id)),steps=[];
 for(let i=0;i<source.length;i++){const a=C.pads(p).find(a=>a.id===source[i].id);let next=null,kind='direct';
  if(connectedToPlane(p,a.id,layer))next=p;
  if(!next){const top=C.topology(p),report=P.status(p,top).find(r=>r.layer===layer);for(const v of p.vias.filter(v=>v.net===z.net&&padRoot(top,v.id)===report.main).sort((u,v)=>C.dist(u,a)-C.dist(v,a)).slice(0,3)){try{const trial=C.clone(p);track(trial,a,v,z.net,a.layer==='both'?layer:a.layer,s);if(connectedToPlane(trial,a.id,layer)){next=trial;kind='existing-via';break;}}catch{}}}
  if(!next&&(a.layer==='both'||a.layer===layer))for(const target of planeTargets(p,P.get(p,layer),a)){try{const trial=C.clone(p);track(trial,a,target,z.net,layer,s);if(connectedToPlane(trial,a.id,layer)){next=trial;kind='stub';break;}}catch{}}
  if(!next&&a.layer!=='both'&&a.layer!==layer&&s.vias){for(const q of viaCandidates(p,a,s)){const v={id:C.uid(),...q,net:z.net,diameter:s.diameter,drill:s.drill};if(!viaFits(p,v))continue;try{const trial=C.clone(p);trial.vias.push(v);track(trial,a,v,z.net,a.layer,s);if(connectedToPlane(trial,a.id,layer)){next=trial;kind='new-via';break;}}catch{}}}
  if(!next)throw Error(a.label+': no clear local path to the main '+face(layer)+' plane. Try a different placement, a manual route or a via. Nothing was changed.');
  p=next;steps.push({id:a.id,kind,message:a.label+': '+({direct:'existing copper contact',stub:'short copper connection','existing-via':'route to an existing via','new-via':'short trace and through via'}[kind])});progress({complete:i+1,total:source.length});
 }
 for(const a of source)if(!connectedToPlane(p,a.id,layer))throw Error('A later connection disconnected an earlier lead. Try the leads individually.');
 return proposal(input,p,beforeTracks,beforeVias,steps,{kind:'plane',net:z.net,layer,ids},s);
}
function routePair(p,a,b,net,s){
 const layers=[s.layer,opposite(s.layer)].filter(l=>(a.layer==='both'||a.layer===l)&&(b.layer==='both'||b.layer===l));
 for(const layer of layers){try{const trial=C.clone(p);track(trial,a,b,net,layer,s);return trial;}catch{}}
 if(!s.vias)return null;
 // A bounded two-face escape with one new via. Existing copper is never moved.
 for(const q of [...viaCandidates(p,a,s),...viaCandidates(p,b,s)].slice(0,48)){let v={id:C.uid(),...q,net,diameter:s.diameter,drill:s.drill};if(!viaFits(p,v))continue;for(const start of a.layer==='both'?[s.layer,opposite(s.layer)]:[a.layer]){const end=opposite(start);if(b.layer!=='both'&&b.layer!==end)continue;try{const trial=C.clone(p);trial.vias.push(v);track(trial,a,v,net,start,s);track(trial,v,b,net,end,s);return trial;}catch{}}}return null;
}
function planWires(input,ids,net,options={},progress=()=>{}){
 let p=C.validate(input),pads=chosen(p,ids);if(pads.length<2||pads.length>64)throw Error('Pick 2–64 leads to wire.');const s=settings(p,net,options);assign(p,ids,net);const selected=new Set(ids);clearCopper(p,C.rawCopper(p).filter(a=>a.pad&&selected.has(a.id)));const beforeTracks=new Set(p.tracks.map(t=>t.id)),beforeVias=new Set(p.vias.map(v=>v.id)),steps=[];
 let pairs=[];for(let i=0;i<pads.length;i++)for(let j=i+1;j<pads.length;j++)pairs.push([pads[i],pads[j]]);pairs.sort(([a,b],[c,d])=>C.dist(a,b)-C.dist(c,d));
 for(const [a,b] of pairs){const top=C.topology(p);if(padRoot(top,a.id)===padRoot(top,b.id))continue;const trial=routePair(p,a,b,net,s);if(!trial)continue;p=trial;steps.push({id:a.id,kind:'wire',message:a.label+' → '+b.label});progress({complete:steps.length,total:pads.length-1});}
 const top=C.topology(p),root=padRoot(top,pads[0].id);if(pads.some(a=>padRoot(top,a.id)!==root))throw Error('No complete route for the picked leads within the search limit. Reposition parts, allow vias or route manually. Nothing was changed.');
 return proposal(input,p,beforeTracks,beforeVias,steps,{kind:'wires',net,ids},s);
}
function proposal(input,p,oldTracks,oldVias,steps,info,s){const tracks=p.tracks.filter(t=>!oldTracks.has(t.id)),vias=p.vias.filter(v=>!oldVias.has(v.id)),owners=new Set([...tracks,...vias].map(a=>a.id));clearCopper(p,C.rawCopper(p).filter(a=>owners.has(a.owner)));return {...info,document:C.validate(p),tracks,vias,steps,assigned:chosen(input,info.ids).filter(a=>!a.net).map(a=>a.id),width:s.width};}
const beforeValidate=C.validate;C.validate=function(input){const p=beforeValidate(input),layers=new Set();for(const z of p.zones){if(z.boardPlane!==undefined&&typeof z.boardPlane!=='boolean')throw Error('Invalid managed-plane flag.');if(z.boardPlane){if(layers.has(z.layer)||z.points.length)throw Error('Use one board-following plane per face, with no custom boundary.');layers.add(z.layer);}}return p;};
const beforeChecks=C.checks;C.checks=function(p){let out=beforeChecks(p);if(!P.list(p).length)return out;out=out.filter(f=>!(f.code==='ZONE_ISLANDS'&&P.list(p).some(z=>z.id===f.target)));for(const r of P.status(p)){if(r.regions>1)out.push({severity:'error',code:'PLANE_SPLIT',message:face(r.layer)+' '+r.net+' plane has '+r.regions+' electrically separate regions. Matching names do not connect them.',target:r.id,confidence:'High'});for(const row of r.rows.filter(a=>a.state!=='connected'))out.push({severity:'warning',code:'PLANE_DISCONNECTED',message:row.label+' has no path to the main '+face(r.layer)+' '+r.net+' plane'+(row.state==='needs-via'?' (opposite-face SMD needs a via).':'.'),target:row.id.split(':')[0],confidence:'High'});}return out;};
Object.assign(C,{ensureNet,assignPinsToNet:assignment,planPlaneConnections:planPlane,planNetWires:planWires});
if(typeof module!=='undefined')module.exports=C;else root.CB=C;
})(typeof globalThis!=='undefined'?globalThis:this);
