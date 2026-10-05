/* CASEBENCH v2 fabrication families. These are geometric designs, not hardware
 * certification. Unsafe offset polygons and unsupported family combinations stop.
 */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.CaseGeometry=factory(root.CaseGeometry,root.CaseSolid,root.CaseModel,root.CaseFeatures,root.CaseChecks);})(globalThis,function(G,S,M,F,K){
'use strict';const E=.025;
const area=p=>p.reduce((s,v,i)=>{let w=p[(i+1)%p.length];return s+v[0]*w[1]-v[1]*w[0];},0)/2;
const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function simple(p){if(p.length<3||Math.abs(area(p))<.001)return false;for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){if(j===i+1||i===0&&j===p.length-1)continue;let a=p[i],b=p[(i+1)%p.length],c=p[j],d=p[(j+1)%p.length],t1=turn(a,b,c),t2=turn(a,b,d),t3=turn(c,d,a),t4=turn(c,d,b);if(t1*t2<1e-10&&t3*t4<1e-10&&Math.max(Math.min(a[0],b[0]),Math.min(c[0],d[0]))<=Math.min(Math.max(a[0],b[0]),Math.max(c[0],d[0]))+1e-8&&Math.max(Math.min(a[1],b[1]),Math.min(c[1],d[1]))<=Math.min(Math.max(a[1],b[1]),Math.max(c[1],d[1]))+1e-8)return false;}return true;}
function offset(points,distance){const L=typeof module==='object'&&module.exports?require('../vendor/clipper.js'):globalThis.ClipperLib,scale=100000;let path=points.map(v=>({X:Math.round((Array.isArray(v)?v[0]:v.x)*scale),Y:Math.round((Array.isArray(v)?v[1]:v.y)*scale)}));if(!L.Clipper.Orientation(path))path.reverse();const co=new L.ClipperOffset(2,.002*scale),out=[];co.AddPath(path,L.JoinType.jtMiter,L.EndType.etClosedPolygon);co.Execute(out,distance*scale);if(out.length!==1||out[0].length<3)throw Error('Wall or joint offset splits or removes the outline. Increase space or reduce the wall/lip.');let result=out[0].map(v=>[v.X/scale,v.Y/scale]);if(area(result)<0)result.reverse();return result;}
function hull(points){let p=points.map(v=>Array.isArray(v)?v:[v.x,v.y]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),l=[],u=[];for(const v of p){while(l.length>1&&turn(l.at(-2),l.at(-1),v)<=1e-8)l.pop();l.push(v);}for(const v of p.slice().reverse()){while(u.length>1&&turn(u.at(-2),u.at(-1),v)<=1e-8)u.pop();u.push(v);}return l.slice(0,-1).concat(u.slice(0,-1));}
function outlines(p,a,d){let s=p.settings,f=p.system.shell.family,inner;
 if(['circle','oval'].includes(f))inner=Array.from({length:Math.max(32,s.curveSegments*2)},(_,i)=>{let t=i*2*Math.PI/Math.max(32,s.curveSegments*2);return[d.cx+d.innerWidth/2*Math.cos(t),d.cy+d.innerDepth/2*Math.sin(t)];});
 else if(f==='polygon'){const pp=p.system.shell.points,xs=pp.map(v=>v[0]),ys=pp.map(v=>v[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;inner=pp.map(v=>[v[0]-cx+d.cx,v[1]-cy+d.cy]);if(!simple(inner))throw Error('Custom enclosure polygon must be simple, closed and nonzero.');}
 else if(f==='board-following'){inner=offset(hull(M.planEnvelopePoints(a)),s.margin);}
 else inner=S.rounded(d.innerMinX,d.innerMinY,d.innerWidth,d.innerDepth,Math.max(0,d.radius-s.wall),Math.max(4,Math.round(s.curveSegments/4)));
 const outer=offset(inner,s.wall),skirtOuter=offset(inner,-s.fit),skirtInner=offset(inner,-s.fit-s.lipWall);return{inner,outer,skirtOuter,skirtInner};
}
function cap(d,z){const pad=50;return S.box(d.minX-pad,d.minY-pad,-1000,d.width+2*pad,d.depth+2*pad,z+1000).transform(v=>[v[0],v[1],v[2]+d.slope*(v[1]-d.cy)]);}
function slab(points,z0,z1,d){let q=S.prism(points,z0,z1);return d.slope?q.transform(v=>[v[0],v[1],v[2]+d.slope*(v[1]-d.cy)]):q;}
function lidHeightAt(d,y){return d.height+d.slope*(y-d.cy);}
function retain(p,a,d,base){const r=p.system.retention,s=p.settings,b=a.board.bounds,parts=[];
 if(['rails','cradle'].includes(r.type)){
  const alongX=r.axis==='x';const b0=alongX?b.minX:b.minY,b1=alongX?b.maxX:b.maxY,low=alongX?b.minY:b.minX,high=alongX?b.maxY:b.maxX;
  const box=(u,v,z,w,dep,h)=>alongX?S.box(u,v,z,w,dep,h):S.box(v,u,z,dep,w,h);
  for(const side of [-1,1]){let v=side<0?low-r.clearance-r.width:high+r.clearance,ledge=side<0?low-r.width:high-r.overlap;
   base=base.union(box(b0,v,s.floor-E,b1-b0,r.width,d.boardZ+a.board.thickness+r.clearance+r.width-s.floor));
   base=base.union(box(b0,ledge,d.boardZ-Math.min(r.width,1),b1-b0,r.width+r.overlap,Math.min(r.width,1)));
   if(r.type==='cradle')base=base.union(box(b0,ledge,d.boardZ+a.board.thickness+r.clearance,b1-b0,r.width+r.overlap,r.width));
  }
  if(r.type==='cradle')base=base.union(box(b0-r.clearance-r.width,low-r.width-r.clearance,s.floor-E,r.width,high-low+2*(r.width+r.clearance),d.boardZ+a.board.thickness-s.floor));
 }
 if(r.type==='hold-down'){
  const alongX=r.axis==='x',low=alongX?b.minY:b.minX,high=alongX?b.maxY:b.maxX,u0=(alongX?b.minX:b.minY)-4,u1=(alongX?b.maxX:b.maxY)+4,place=(u,v)=>alongX?[u,v]:[v,u];
  for(let j=0;j<2;j++){const v=j?high-2:low+2,z=d.boardZ+a.board.thickness+r.clearance,bw=Math.max(r.width,s.boltDiameter+2*s.minFeature);let bar=alongX?S.box(u0-3,v-bw/2,z,u1-u0+6,bw,r.barHeight):S.box(v-bw/2,u0-3,z,bw,u1-u0+6,r.barHeight);
   for(const u of [u0,u1]){const [x,y]=place(u,v);base=base.union(S.cylinder(x,y,s.floor-E,3.3,z-s.floor+E,s.curveSegments));base=base.subtract(S.cylinder(x,y,-1,s.boltDiameter/2,z+2,s.curveSegments));base=base.subtract(G.hex(x,y,-1,s.nutFlats,s.nutDepth+1));bar=bar.subtract(S.cylinder(x,y,z-1,s.boltDiameter/2,r.barHeight+2,s.curveSegments));}
   parts.push({id:'hold-down-'+j,name:'Hold-down bar '+(j+1),solid:bar});
  }
 }
 for(const o of a.devices){if(o.mount==='none')continue;const b=o.bounds,z=d.boardZ+b.minZ,rim=2.4;if(z<=s.floor+.2)throw Error(o.name+': raise the object to leave room for its mounting pad.');base=base.union(S.box(b.minX-.8,b.minY-.8,s.floor-E,b.maxX-b.minX+1.6,b.maxY-b.minY+1.6,z-s.floor+E));if(o.mount==='cradle'){for(const x of [b.minX-rim-.3,b.maxX+.3])base=base.union(S.box(x,b.minY-.8,s.floor-E,rim,b.maxY-b.minY+1.6,z-s.floor+Math.min(4,o.height/2)));}}
 return{base,parts};
}
function axisCylinder(x,y,z,length,r,n){return S.cylinder(0,0,0,r,length,n).transform(v=>[x+v[2],y+v[0],z+v[1]]);}
function alternateClosure(p,a,d,q){const s=p.settings,c=p.system.closure,type=c.type,extra=[];let {base,lid}=q;
 if(['sliding','snap','hinge'].includes(type)&&p.system.shell.family!=='rounded')throw Error('This closure currently requires a level rounded rectangular shell.');
 if(type==='sliding'){
  if(d.slope)throw Error('Sliding lids require a level roof.');if(c.engagement>=s.wall-.4)throw Error('Sliding rail engagement must leave at least 0.4 mm of wall.');
  const bottom=d.height-s.roof-s.fit,top=d.height-s.fit;
  base=base.subtract(S.box(d.innerMinX+s.fit,d.innerMinY-c.engagement,-0+bottom-s.fit,d.width+5,d.innerDepth+2*c.engagement,s.roof+2*s.fit));
  // Open only the entry slot; material above it remains connected via the sides.
  lid=S.box(d.innerMinX+2*s.fit,d.innerMinY-c.engagement+s.fit,bottom,d.maxX-d.innerMinX-2*s.fit,d.innerDepth+2*c.engagement-2*s.fit,s.roof);
  lid=lid.union(S.box(d.maxX-1,d.cy-6,bottom,6,12,s.roof));
 }
 if(type==='snap'){
  for(const sign of [-1,1]){const y=sign<0?d.minY:d.maxY,x=d.cx-4,L=d.top+1-s.floor,gap=s.fit+.6,armY=sign<0?y-gap-c.flex:y+gap;
   base=base.union(S.box(x,sign<0?armY:y-.1,0,8,gap+c.flex+.15,s.floor));
   base=base.union(S.box(x,armY,s.floor-E,8,c.flex,L));
   const hookY=sign<0?armY:y-1;const hookDepth=gap+c.flex+1;
   base=base.union(S.box(x,hookY,d.top+s.fit,8,hookDepth,1));
   // Sloped lead-in above the capture tooth. This is undeformed rest geometry.
   const tri=[[0,0],[hookDepth,0],[sign<0?0:hookDepth,1.5]];
   const ramp=S.prism(tri,0,8).transform(v=>[x+v[2],hookY+v[0],d.top+s.fit+1+v[1]]);base=base.union(ramp);
  }
 }
 if(type==='hinge'){
  const r=c.pin/2+1.8,span=c.knuckle*3+s.fit*2,x0=d.cx-span/2,y=d.maxY+r+.5,z=d.height+s.roof/2;
  // No locating skirt for a hinged closure: it would obstruct rotation.
  lid=slab(q.outlines.outer,d.height,d.height+s.roof,d);
  for(let i=0;i<3;i++){const x=x0+i*(c.knuckle+s.fit),isLid=i===1;
   let knuckle=axisCylinder(x,y,z,c.knuckle,r,s.curveSegments).subtract(axisCylinder(x-1,y,z,c.knuckle+2,(c.pin+s.fit)/2,s.curveSegments));
   const zz=isLid?d.height:d.height-r;let bridge=S.box(x,d.maxY-.3,zz,c.knuckle,r+.8,isLid?s.roof:r);
   if(isLid){lid=lid.union(knuckle).union(bridge);base=base.subtract(axisCylinder(x-s.fit/2,y,z,c.knuckle+s.fit,r+s.fit/2,s.curveSegments));}else{base=base.union(knuckle).union(bridge);lid=lid.subtract(axisCylinder(x-s.fit/2,y,z,c.knuckle+s.fit,r+s.fit/2,s.curveSegments));}
  }
  const bore=axisCylinder(x0-2,y,z,span+4,(c.pin+s.fit)/2,s.curveSegments);base=base.subtract(bore);lid=lid.subtract(bore);
  const pin=axisCylinder(x0-.7,y,z,span+1.4,c.pin/2,s.curveSegments).union(axisCylinder(x0-1.4,y,z,.8,c.pin/2+1,s.curveSegments));
  extra.push({id:'hinge-pin',name:'Hinge pin',solid:pin});
 }
 return{base,lid,parts:extra};
}
function createShell(p,a,d,progress){const s=p.settings,o=outlines(p,a,d);progress('Forming '+p.system.shell.family+' shell');
 let base=S.prism(o.outer,0,d.height+Math.abs(d.slope)*d.depth),inner=S.prism(o.inner,s.floor,d.height+Math.abs(d.slope)*d.depth+5);base=base.subtract(inner);if(d.slope)base=base.intersect(cap(d,d.height));
 const mounts=M.mounts(p,a);for(const h of mounts.filter(h=>h.enabled)){let z=d.boardZ+h.z;if(h.outerDiameter<=h.boreDiameter+.4)throw Error('PCB support is too thin around its bore.');if(z<=s.floor)throw Error('A PCB support ends below the floor.');base=base.union(S.cylinder(h.x,h.y,s.floor-E,h.outerDiameter/2,z-s.floor+E,s.curveSegments));if(h.boreDiameter>0){const bottom=p.integration?.supportMode==='blind'?Math.max(s.floor+.4,z-p.integration.boreDepth):-1;base=base.subtract(S.cylinder(h.x,h.y,bottom,h.boreDiameter/2,z-bottom+2,s.curveSegments));if(p.integration?.supportMode!=='blind'&&p.integration?.nutPockets!==false)base=base.subtract(G.hex(h.x,h.y,-1,s.nutFlats,s.nutDepth+1));}}
 let lid=slab(o.outer,d.height,d.height+s.roof,d),parts=[];
 if(s.lipDepth>0&&p.system.shell.family!=='tray'&&!['sliding','hinge'].includes(p.system.closure.type)){let skirt=slab(o.skirtOuter,d.height-s.lipDepth,d.height+E,d).subtract(slab(o.skirtInner,d.height-s.lipDepth-1,d.height+1,d));lid=lid.union(skirt);}
 const closers=M.closures(p,d);for(const c of closers.filter(c=>c.enabled)){
  let h=lidHeightAt(d,c.y);if(c.diameter<=Math.max(c.bore,s.headDiameter)+.4)throw Error('Fastener boss must be larger than the screw recess.');
  let boss=S.cylinder(c.x,c.y,0,c.diameter/2,d.top+1,s.curveSegments);boss=boss.intersect(cap(d,d.height));base=base.union(boss);
  if(c.insert){base=base.subtract(S.cylinder(c.x,c.y,h-p.system.hardware.insertLength,p.system.hardware.insertDiameter/2,p.system.hardware.insertLength+2,s.curveSegments));}
  else{base=base.subtract(S.cylinder(c.x,c.y,-1,c.bore/2,d.top+2,s.curveSegments));base=base.subtract(G.hex(c.x,c.y,-1,s.nutFlats,s.nutDepth+1));}
  if(!c.internal)lid=lid.union(S.cylinder(c.x,c.y,d.height,c.diameter/2,s.roof,s.curveSegments).transform(v=>[v[0],v[1],v[2]+d.slope*(v[1]-d.cy)]));
  else lid=lid.subtract(S.cylinder(c.x,c.y,h-s.lipDepth-1,c.diameter/2+s.fit,s.lipDepth+1+.01,s.curveSegments));
  lid=lid.subtract(S.cylinder(c.x,c.y,h-s.lipDepth-1,c.bore/2,s.roof+s.lipDepth+3,s.curveSegments));
  if(s.headDepth>0)lid=lid.subtract(S.cylinder(c.x,c.y,h+s.roof-s.headDepth,s.headDiameter/2,s.headDepth+3,s.curveSegments));
 }
 const retained=retain(p,a,d,base);base=retained.base;parts.push(...retained.parts);
 const alt=alternateClosure(p,a,d,{base,lid,outlines:o});base=alt.base;lid=alt.lid;parts.push(...alt.parts);
 if(p.system.shell.family==='tray')lid=new S.Solid();
 return{base,lid,mounts,closers,parts,outlines:o};
}
function additionalChecks(p,a,d,solids,parts){const findings=[],add=(severity,code,message,ids=[],evidence='',confidence='geometric')=>findings.push({id:code+':v2:'+findings.length,severity,code,message,objects:ids,evidence,confidence});
 const box=b=>S.box(b.minX,b.minY,b.minZ,b.maxX-b.minX,b.maxY-b.minY,b.maxZ-b.minZ),absolute=b=>({...b,minZ:b.minZ+d.boardZ,maxZ:b.maxZ+d.boardZ});
 for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){const x=parts[i],y=parts[j];if(S.overlap(x.solid.bounds,y.solid.bounds)){const volume=x.solid.intersect(y.solid).volume();if(volume>.001)add('error','printable-part-collision',x.name+' intersects '+y.name+' in the assembled position.',[x.id,y.id],volume.toFixed(3)+' mm³ modeled interference.');}}
 const boreIds=new Set(a.bores.map(h=>h.id));for(const [id,setting]of Object.entries(p.supports))if(setting.enabled!==false&&!boreIds.has(id))add('error','support-anchor','An enabled PCB support lost its mounting-hole anchor. Disable it or choose a current hole explicitly.',[id]);
 const otherParts=parts.filter(x=>x.id!=='base'&&x.id!=='lid');
 for(const b of a.boards){if(b.id==='primary')continue;let slab=S.prism(b.board.outline,d.boardZ+b.z,d.boardZ+b.z+b.board.thickness);for(const c of b.cutouts)slab=slab.subtract(S.prism(c.points,d.boardZ+b.z-1,d.boardZ+b.z+b.board.thickness+1));for(const h of b.bores)slab=slab.subtract(S.prism(h.perimeter,d.boardZ+b.z-1,d.boardZ+b.z+b.board.thickness+1));for(const [name,q]of Object.entries(solids))if(q.polys.length&&q.intersect(slab).volume()>.0001)add('error','assembly-board-collision',b.name+' PCB intersects '+name+'.',[b.id,name]);if(!b.supports)add('warning','assembly-support',b.name+' has no generated floor supports. Define host spacers or a separate mounting method.',[b.id],'A reference stack does not imply board-to-board fasteners.','unverified');}
 const items=[...a.components.filter(c=>c.body).map(c=>({id:c.id,name:c.ref,bounds:absolute(c.bounds),solid:()=>S.prism(c.vertices.slice(0,4),c.bounds.minZ+d.boardZ,c.bounds.maxZ+d.boardZ)})),...a.devices.map(o=>({id:o.id,name:o.name,bounds:absolute(o.bounds),solid:()=>S.prism([o.vertices[0],o.vertices[2],o.vertices[4],o.vertices[6]],o.bounds.minZ+d.boardZ,o.bounds.maxZ+d.boardZ)}))];
 for(const device of a.devices){let b=absolute(device.bounds),q=S.prism([device.vertices[0],device.vertices[2],device.vertices[4],device.vertices[6]],b.minZ,b.maxZ);for(const [name,solid]of Object.entries(solids))if(solid.intersect(q).volume()>.0001)add('error','device-collision',device.name+' intersects '+name+'.',[device.id,name]);for(const c of a.components)if(c.body&&K.over(b,absolute(c.bounds))&&q.intersect(S.prism(c.vertices.slice(0,4),c.bounds.minZ+d.boardZ,c.bounds.maxZ+d.boardZ)).volume()>.0001)add('error','device-component-collision',device.name+' overlaps '+c.ref+'.',[device.id,c.id]);if(device.mount==='none')add('warning','device-retention',device.name+' is a reserved object without a generated mount.',[device.id],'Provide a reviewed mounting method.','unverified');}
 for(let i=0;i<a.boards.length;i++)for(let j=i+1;j<a.boards.length;j++){const b=a.boards[i],c=a.boards[j];if(b.z<c.z+c.board.thickness&&b.z+b.board.thickness>c.z&&S.prism(b.board.outline,b.z,b.z+b.board.thickness).intersect(S.prism(c.board.outline,c.z,c.z+c.board.thickness)).volume()>.0001)add('error','board-stack-overlap',b.name+' and '+c.name+' board substrates overlap.',[b.id,c.id]);}
 for(const c of a.components.filter(c=>c.body))for(const b of a.boards){if(c.boardId===b.id)continue;let bb={...b.board.bounds,minZ:b.z,maxZ:b.z+b.board.thickness};if(K.over(c.bounds,bb)&&S.prism(c.vertices.slice(0,4),c.bounds.minZ,c.bounds.maxZ).intersect(S.prism(b.board.outline,b.z,b.z+b.board.thickness)).volume()>.0001)add('error','component-board-overlap',c.ref+' intersects the '+b.name+' board.',[c.id,b.id]);}
 for(let i=0;i<a.components.length;i++)for(let j=i+1;j<a.components.length;j++){let c=a.components[i],v=a.components[j];if(c.boardId===v.boardId||!c.body||!v.body||!K.over(c.bounds,v.bounds))continue;if(S.prism(c.vertices.slice(0,4),c.bounds.minZ,c.bounds.maxZ).intersect(S.prism(v.vertices.slice(0,4),v.bounds.minZ,v.bounds.maxZ)).volume()>.0001)add('error','stack-component-overlap',c.ref+' overlaps '+v.ref+'.',[c.id,v.id]);}
 for(const part of otherParts){for(const it of items)if(S.overlap(part.solid.bounds,{min:[it.bounds.minX,it.bounds.minY,it.bounds.minZ],max:[it.bounds.maxX,it.bounds.maxY,it.bounds.maxZ]})&&part.solid.intersect(it.solid()).volume()>.0001)add('error','accessory-collision',part.name+' intersects '+it.name+'.',[part.id,it.id]);}
 // User-defined translational sweeps are conservative axis-aligned envelopes.
 for(const st of p.system.steps){let board=a.boards.find(b=>b.id===st.itemId),obj=a.devices.find(o=>o.id===st.itemId),pts=[];if(board){pts=board.board.outline.flatMap(v=>[{...v,z:board.z},{...v,z:board.z+board.board.thickness}]);const owners=new Set();for(const c of a.components.filter(c=>c.boardId===board.id)){owners.add(c.id);pts.push(...c.vertices);}for(const lead of a.projections.filter(q=>owners.has(q.ownerId))){let b=lead.bounds;pts.push({x:b.minX,y:b.minY,z:b.minZ},{x:b.maxX,y:b.maxY,z:b.maxZ});}}else if(obj)pts=obj.vertices;if(!pts.length){add('error','step-anchor',st.name+' refers to a missing assembly item.',[st.id]);continue;}const v=st.direction[0],sign=st.direction[1]==='+'?1:-1,b={minX:Math.min(...pts.map(v=>v.x)),maxX:Math.max(...pts.map(v=>v.x)),minY:Math.min(...pts.map(v=>v.y)),maxY:Math.max(...pts.map(v=>v.y)),minZ:Math.min(...pts.map(v=>v.z))+d.boardZ,maxZ:Math.max(...pts.map(v=>v.z))+d.boardZ};const suffix=v.toUpperCase();b[(sign>0?'max':'min')+suffix]+=sign*st.distance;let vol=solids.base.intersect(box(b)).volume();if(vol>.001)add('warning','defined-insertion',st.name+': the conservative '+st.direction+' sweep intersects the base.',[st.id],vol.toFixed(2)+' mm³. Lid removed; no rotation/flexibility is solved.');const other=[];for(const q of a.boards.filter(q=>q.id!==st.itemId)){const list=q.board.outline.flatMap(v=>[{...v,z:q.z},{...v,z:q.z+q.board.thickness}]);for(const c of a.components.filter(c=>c.boardId===q.id))list.push(...c.vertices);other.push({id:q.id,name:q.name,bounds:Object.fromEntries(['x','y','z'].flatMap(k=>[['min'+k.toUpperCase(),Math.min(...list.map(v=>v[k]))],['max'+k.toUpperCase(),Math.max(...list.map(v=>v[k]))]]))});}for(const q of a.devices.filter(q=>q.id!==st.itemId))other.push(q);for(const q of other){let ob={...q.bounds,minZ:q.bounds.minZ+d.boardZ,maxZ:q.bounds.maxZ+d.boardZ};const overlap=['X','Y','Z'].reduce((v,k)=>v*Math.max(0,Math.min(b['max'+k],ob['max'+k])-Math.max(b['min'+k],ob['min'+k])),1);if(overlap>.001)add('warning','defined-insertion-object',st.name+': the conservative corridor overlaps '+q.name+'.',[st.id,q.id],overlap.toFixed(2)+' mm³ bounding-box overlap. Other assembly items remain installed; step order is not simulated.');}}
 const hw=p.system.hardware;for(const h of M.mounts(p,a).filter(h=>h.enabled&&h.boreDiameter>0)){if(hw.shaft>Math.min(h.boreDiameter,h.diameter)+.001)add('error','hardware-shaft','Selected screw shaft exceeds its PCB or support bore.',[h.id]);const z=d.boardZ+h.z+(a.boards.find(b=>b.id===h.boardId)?.board.thickness||a.board.thickness),r=Math.max(hw.headDiameter,hw.washerDiameter)/2;const head=S.cylinder(h.x,h.y,z,r,hw.headHeight+hw.washerThickness,p.settings.curveSegments);for(const c of a.components.filter(c=>c.body)){if(head.intersect(S.prism(c.vertices.slice(0,4),c.bounds.minZ+d.boardZ,c.bounds.maxZ+d.boardZ)).volume()>.0001)add('error','hardware-head',c.ref+' overlaps the PCB screw-head / washer envelope.',[h.id,c.id]);}if(solids.lid.polys.length&&solids.lid.intersect(head).volume()>.0001)add('error','hardware-lid','PCB screw-head envelope intersects the lid.',[h.id,'lid']);}
 for(const h of M.mounts(p,a).filter(h=>h.enabled&&h.boreDiameter>0)){
  const top=d.boardZ+h.z+(a.boards.find(b=>b.id===h.boardId)?.board.thickness||a.board.thickness)+hw.washerThickness,tip=top-hw.length;
  if(p.integration?.supportMode==='blind'){const bottom=Math.max(p.settings.floor+.4,d.boardZ+h.z-p.integration.boreDepth);if(tip<bottom-.01)add('warning','blind-screw-bottoming','Selected PCB screw extends beyond its blind pilot hole.',[h.id],`Screw tip Z ${tip.toFixed(2)} mm; bore bottom Z ${bottom.toFixed(2)} mm. Choose a shorter screw or a deeper permitted pilot.`);if(tip>d.boardZ+h.z-.5)add('warning','pilot-engagement','Selected PCB screw has less than 0.5 mm modeled pilot engagement.',[h.id]);}
  else if(p.integration?.nutPockets!==false&&tip>p.settings.nutDepth-hw.nutHeight*.5)add('warning','screw-engagement','PCB screw may not reach enough of its nut.',[h.id],`Selected length ${hw.length} mm; end Z ${tip.toFixed(2)} mm.`);
  if(tip<-.5)add('warning','screw-projection','PCB screw projects below the enclosure floor.',[h.id],`Selected screw extends ${(-tip).toFixed(2)} mm below the underside. Select the actual PCB fastener length.`);
  const access=S.cylinder(h.x,h.y,top+hw.headHeight,hw.accessDiameter/2,hw.accessLength,p.settings.curveSegments);
  for(const c of a.components.filter(c=>c.body))if(access.intersect(S.prism(c.vertices.slice(0,4),c.bounds.minZ+d.boardZ,c.bounds.maxZ+d.boardZ)).volume()>.001)add('warning','hardware-tool-access','Driver access to the PCB screw intersects '+c.ref+'.',[h.id,c.id],`Tool diameter ${hw.accessDiameter} mm and reach ${hw.accessLength} mm. Lid removed.`);
 }
 for(const c of M.closures(p,d).filter(c=>c.enabled)){
  if(hw.shaft>c.bore+.001)add('error','lid-shaft','Selected screw shaft exceeds a lid bore.',[c.id]);
  if(hw.headDiameter>p.settings.headDiameter+.001&&p.settings.headDepth>0)add('warning','head-pocket-size','Selected screw head is larger than the modeled lid recess.',[c.id]);
  if(c.insert){if(p.system.hardware.insertDiameter>=c.diameter-p.settings.minFeature*2)add('error','insert-wall','Insert pocket leaves too little radial boss wall.',[c.id]);if(p.system.hardware.insertLength>=d.height-p.settings.floor)add('error','insert-floor','Insert pocket reaches the floor region.',[c.id]);const engagement=hw.length-(p.settings.roof-p.settings.headDepth);if(engagement>hw.insertLength)add('warning','insert-bottoming','Selected lid screw may bottom out in the insert pocket.',[c.id],`Nominal engagement ${engagement.toFixed(2)} mm; insert depth ${hw.insertLength} mm.`);}
  else if(hw.nutFlats>p.settings.nutFlats+.001)add('warning','nut-pocket-size','Selected nut is wider than its modeled hex pocket.',[c.id]);
 }
 for(let i=0;i<a.devices.length;i++){const o=a.devices[i],b=absolute(o.bounds),solid=S.prism(o.vertices.filter((_,k)=>k%2===0),b.minZ,b.maxZ);for(const board of a.boards){let bb=absolute({...board.board.bounds,minZ:board.z,maxZ:board.z+board.board.thickness});if(K.over(b,bb)&&solid.intersect(S.prism(board.board.outline,bb.minZ,bb.maxZ)).volume()>.001)add('error','device-board-collision',o.name+' intersects the '+board.name+' substrate.',[o.id,board.id]);}for(const v of a.devices.slice(i+1)){let bb=absolute(v.bounds);if(K.over(b,bb)&&solid.intersect(S.prism(v.vertices.filter((_,k)=>k%2===0),bb.minZ,bb.maxZ)).volume()>.001)add('error','device-device-collision',o.name+' intersects '+v.name+'.',[o.id,v.id]);}}
 if(p.review.baseline){try{const before=M.revisionPreview(p,p.review.baseline.sourceText);for(const item of before.mechanical.filter(v=>v.overrideNeedsReview))add('warning','revised-envelope',item.ref+': source geometry changed while its mechanical override was retained.',[item.id],item.changed.join(', ')+'. Review the override against the revised hardware.','unverified');}catch(_){}}
 if(hw.evidence==='nominal')add('warning','hardware-evidence','Hardware definition is nominal. Check the actual screw, nut or insert.',[],'The hardware profile is editable; it is not a catalogue certification.','unverified');
 if(['sliding','snap','hinge'].includes(p.system.closure.type))add('warning','closure-fit',p.system.closure.type+' closure geometry is experimental and physically untested.',[],'Use the closure coupon; verify clearance, deflection, assembly and wear.','unverified');
 if(['circle','oval','polygon','board-following'].includes(p.system.shell.family))add('info','planar-tools','Face tools use planar reference frames; artwork does not wrap curved walls.');
 for(const e of p.system.evidence){if(e.fingerprint!==M.geometryFingerprint(p))add('warning','stale-trial','Recorded '+e.kind+' trial no longer matches this design.',[e.id],'Repeat the trial after relevant design or print-profile changes.','unverified');else if(e.result==='fail')add('warning','failed-trial','A current '+e.kind+' trial is recorded as failed.',[e.id],e.notes,'user-recorded');}
 return findings;
}
let shellCache=null,meshCache=new WeakMap();
function build(p,progress=()=>{}){
 p=M.validate(p);const started=Date.now(),a=M.effective(p),d=M.dimensions(p,a),shellKey=JSON.stringify([p.settings,a,d,p.supports,p.closures,p.review.mounting,p.system.shell,p.system.closure,p.system.hardware,p.system.retention,p.integration]),shellReused=shellCache?.key===shellKey;
 const q=shellReused?shellCache.value:createShell(p,a,d,progress);if(shellReused)progress('Reusing unchanged shell and hardware');else shellCache={key:shellKey,value:q};
 const applied=F.apply({base:q.base,lid:q.lid},p,a,d,progress),solids={base:applied.base,lid:applied.lid};
 let functional={parts:[],findings:[],hardware:[]};if(G.functionalGeometry){functional=G.functionalGeometry(p,a,d,solids,progress);solids.base=functional.base;solids.lid=functional.lid;}
 const raw=[{id:'base',name:'Base',solid:solids.base},...(p.system.shell.family==='tray'?[]:[{id:'lid',name:'Lid',solid:solids.lid}]),...q.parts,...(applied.parts||[]),...functional.parts];
 let auditsReused=0;const parts=raw.map(part=>{progress('Auditing '+part.name);let prepared=meshCache.get(part.solid);if(prepared)auditsReused++;else{const mesh=S.mesh(part.solid),audit=S.audit(mesh),readback=S.audit(S.readSTL(S.stl(mesh,part.name)));prepared={mesh,audit,readback};meshCache.set(part.solid,prepared);}const {mesh,audit,readback}=prepared;return{id:part.id,name:part.name,mesh,audit,readback,parentPart:part.parentPart||null,explodeNormal:part.explodeNormal||null,explodeDistance:part.explodeDistance||0,orientation:p.system.orientations[part.id]||(part.id==='lid'?'top':part.id==='hinge-pin'?'left':'bottom')};});
 G.lastSolidBuild={key:M.geometryState(p),solids,raw};
 let findings=[...functional.findings,...applied.findings,...K.run(p,a,d,solids,parts,applied.features,progress),...additionalChecks(p,a,d,solids,raw)];
 if(p.system.shell.family==='tray')findings=findings.filter(f=>!['lid-retention','pcb-height'].includes(f.code));
 if(p.system.closure.type!=='external')findings=findings.filter(f=>f.code!=='lid-retention');
 for(const part of parts)if(!part.readback.valid)findings.push({id:'readback-'+part.id,severity:'error',code:'stl-readback',message:part.name+' failed exported STL topology.',objects:[part.id],confidence:'geometric'});
 const hardware=K.hardware(p,a,d).concat(functional.hardware);
 if(q.parts.some(x=>x.id==='hinge-pin'))hardware.push({item:'Printed hinge pin',quantity:1,note:'Included as a separate printable part; fit untested.'});
 return{version:M.VERSION,cacheStats:{shellReused,auditsReused,...applied.cacheStats},dimensions:d,parts,mounts:q.mounts,closers:q.closers,findings,features:applied.features,hardware,physicalFit:M.proofStatus(p).fit.status,kernel:S.kernel||'CASEBENCH bounded BSP',elapsedMs:Date.now()-started,evidence:M.proofStatus(p),fingerprint:null};
}
function targetedCoupon(p,kind='joint',featureId=null){
 if(kind==='gauge')return G.coupon(p);const s=p.settings;let parts=[],instructions='';
 if(kind==='opening'){const original=p.features.find(f=>f.id===featureId);if(!original)throw Error('Select an opening or lettering feature for a coupon.');let f={...original,u:0,v:0,componentId:null,positioning:'center',rotation:0},ex=F.extents(f),w=Math.max(24,ex.width+12),h=Math.max(20,ex.height+12),frame={origin:[0,0,s.wall],u:[1,0,0],v:[0,1,0],n:[0,0,1],thickness:s.wall,part:'base'};f.frame=frame;let q=S.box(-w/2,-h/2,0,w,h,s.wall),tool=F.tool(f);q=['add','text-raised','art-raised'].includes(f.kind)?q.union(tool):q.subtract(tool);parts=[{id:'feature-coupon',name:'Feature coupon',solid:q}];instructions='Uses selected feature dimensions and current wall thickness. Check the actual connector or lettering in the intended print orientation.';}
 else if(kind==='hardware'){const hw=p.system.hardware,w=Math.max(s.closureDiameter,hw.insertDiameter+5),h=hw.insertLength+3;let q=S.cylinder(0,0,0,w/2,h,s.curveSegments).subtract(S.cylinder(0,0,h-hw.insertLength,hw.insertDiameter/2,hw.insertLength+1,s.curveSegments));let r=S.box(0,0,0,20,20,s.floor+hw.nutHeight).subtract(S.cylinder(10,10,-1,s.boltDiameter/2,s.floor+hw.nutHeight+2,s.curveSegments)).subtract(G.hex(10,10,-1,hw.nutFlats,hw.nutHeight+1));parts=[{id:'insert-coupon',name:'Insert pocket coupon',solid:q},{id:'nut-coupon',name:'Nut and bolt coupon',solid:r}];instructions='Uses current hardware bore, insert depth, nut pocket and bolt clearance. No standard hardware dimensions are inferred.';}
 else{const source={app:'COPPERBENCH',schema:3,version:'1.3.1',id:'coupon-datum',title:'Joint coupon datum (synthetic)',board:{width:24,height:16,thickness:1.6,shape:'rounded',radius:2,points:[]},parts:[],holes:[],traces:[],vias:[],cutouts:[],keepouts:[],nets:[],zones:[],art:[],assets:[]};let q=M.defaults(JSON.stringify(source),'synthetic-coupon-datum.json');q.settings={...s,autoSize:false,innerWidth:30,innerDepth:22,autoHeight:false,height:Math.max(16,p.system.hardware.insertLength+4,s.lipDepth+5),autoSupport:false,supportHeight:3,closure:false};q.system={...M.defaultsSystem(),hardware:clone(p.system.hardware),closure:clone(p.system.closure)};q.system.retention.type='manual';q.system.shell.family='rounded';q.settings.closure=['external','internal','insert'].includes(p.system.closure.type);q.closures={'closure-1':{enabled:false},'closure-3':{enabled:false}};const a=M.effective(q),d=M.dimensions(q,a),g=createShell(q,a,d,()=>{});parts=[{id:'joint-base',name:'Joint sample base',solid:g.base},{id:'joint-lid',name:'Joint sample lid',solid:g.lid},...g.parts];instructions='Miniature '+p.system.closure.type+' joint with current wall/roof and fit settings. Not an automatic proof of full-size strength or fit.';}
 const result={version:M.VERSION,instructions,parts:parts.map(p=>{const mesh=S.mesh(p.solid);return{id:p.id,name:p.name,mesh,audit:S.audit(mesh)};})};if(result.parts.some(p=>!p.audit.valid||p.audit.connectedComponents!==1))throw Error('Coupon is not a closed single solid. Review its feature or profile.');return result;
}
const clone=o=>JSON.parse(JSON.stringify(o));
Object.assign(G,{build,offset,simple,hull,outlines,createShell,additionalChecks,targetedCoupon});return G;
});
