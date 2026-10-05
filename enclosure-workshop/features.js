/* Face-anchored features; every displayed operation modifies exported solids. */
(function(root,factory){const node=typeof module==='object'&&module.exports,a=factory(node?require('./solid.js'):root.CaseSolid,node?require('./model.js'):root.CaseModel,node?require('./markings.js'):root.CaseMarkings);if(node)module.exports=a;else root.CaseFeatures=a;})(globalThis,function(S,M,T){'use strict';
const E=.025,additive=f=>['add','text-raised','art-raised'].includes(f.kind);
function extents(f){if(f.kind.startsWith('text')){let l=T.layout(f.text,f.size,f.spacing,f.alignment);return{width:l.width,height:l.height,offsetX:l.start+l.width/2};}return{width:f.kind==='vent'?f.width+(f.columns-1)*f.pitchU:f.kind==='panel'?f.width+16:f.width,height:f.kind==='vent'?f.height+(f.rows-1)*f.pitchV:f.kind==='panel'?f.height+16:f.shape==='circle'?f.width:f.height,offsetX:0};}
function outline(f){let w=f.width,h=f.shape==='circle'?w:f.height;if(f.shape==='circle')return S.circle(0,0,w/2,32);return S.rounded(-w/2,-h/2,w,h,f.shape==='slot'?Math.min(w,h)/2:f.shape==='rounded'?f.radius:0,8);}
function ringArea(p){return p.reduce((v,a,i)=>{let b=p[(i+1)%p.length];return v+a[0]*b[1]-a[1]*b[0];},0)/2;}
function inside(p,poly){let ok=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ok=!ok;}return ok;}
function ringCrossings(a,b,same=false){const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++){if(same&&(i===j||(i+1)%a.length===j||(j+1)%a.length===i))continue;let aa=a[i],ab=a[(i+1)%a.length],ba=b[j],bb=b[(j+1)%b.length];if(cross(aa,ab,ba)*cross(aa,ab,bb)<-1e-10&&cross(ba,bb,aa)*cross(ba,bb,ab)<-1e-10)return true;}return false;}
function artSolid(f,z0,z1){
 const groups=f.artGroups||[{rule:f.artRule||'evenodd',contours:f.contours}],solids=[];
 for(const group of groups){let result=new S.Solid(),rings=group.contours.map(c=>c.map(p=>[p[0]*f.width,p[1]*f.height])).sort((a,b)=>Math.abs(ringArea(b))-Math.abs(ringArea(a))),prior=[];
  for(let i=0;i<rings.length;i++){if(ringCrossings(rings[i],rings[i],true))throw Error('SVG contour self-intersects. Convert it to simple filled outlines.');if(group.rule==='nonzero')for(let j=i+1;j<rings.length;j++)if(ringCrossings(rings[i],rings[j]))throw Error('Nonzero compound SVG contours must be disjoint or nested. Resolve crossing outlines before import.');}
  for(const ring of rings){const prism=S.prism(ring,z0,z1);if(group.rule==='union')result=result.union(prism);
   else if(group.rule==='evenodd'){const both=result.intersect(prism);result=result.union(prism).subtract(both);}
   else{const sign=Math.sign(ringArea(ring)),winding=prior.filter(q=>inside(ring[0],q)).reduce((s,q)=>s+Math.sign(ringArea(q)),0);result=winding+sign===0?result.subtract(prism):result.union(prism);}
   prior.push(ring);
  }solids.push(result);
 }return S.unionAll(solids);
}
function tool(f){let add=additive(f),depth=f.through&&!add&&f.kind!=='text-recessed'&&f.kind!=='art-recessed'&&f.kind!=='pocket'?f.frame.thickness+E:f.depth,z0=add?-E:-depth,z1=add?f.depth:E+(f.outwardCut||0),shapes=[];
 if(f.kind.startsWith('text')){let l=T.layout(f.text,f.size,f.spacing,f.alignment),join=Math.min(.01,l.cell*.025);shapes=l.runs.map(r=>S.box(r.x-join,r.y-join,z0,r.width+2*join,r.height+2*join,z1-z0));}
 else if(f.kind.startsWith('art'))shapes=[artSolid(f,z0,z1)];
 else if(f.kind==='vent'){let pts=outline(f);for(let x=0;x<f.columns;x++)for(let y=0;y<f.rows;y++)shapes.push(S.prism(pts,z0,z1).translate([(x-(f.columns-1)/2)*f.pitchU,(y-(f.rows-1)/2)*f.pitchV,0]));}
 else shapes=[S.prism(outline(f),z0,z1)];
 return S.unionAll(shapes).rotateZ(f.rotation).translate([f.u,f.v,0]).transform(p=>M.toWorld(f.frame,p));
}
function panel(f,base,p){const w=f.width,h=f.height,t=p.settings.wall,depth=f.depth,z=p.settings.fit,pts=outline({...f,width:w+16,height:h+16,radius:Math.min(f.radius+3,5)}),opening=S.prism(outline(f),-t-5,1),ring=S.prism(pts,-t-3,-t+E).subtract(opening),move=q=>q.rotateZ(f.rotation).translate([f.u,f.v,0]).transform(v=>M.toWorld(f.frame,v));let plate=S.prism(pts,z,z+depth),support=ring;for(const x of [-w/2-4,w/2+4])for(const y of [-h/2-4,h/2+4]){const bore=S.cylinder(x,y,-t-5,p.settings.boltDiameter/2,t+depth+8,p.settings.curveSegments);plate=plate.subtract(bore);support=support.subtract(bore);base=base.subtract(move(bore));}base=base.union(move(support)).subtract(move(opening));return{base,part:{id:'panel-'+f.id,name:f.name+' panel',solid:move(plate)}};}
let cache=null;
function apply(parts,p,a,d,progress=()=>{}){
 const originals=p.features.concat(M.interfaceFeatures?M.interfaceFeatures(p):[]);
 if(originals.length>128)throw Error('Combined features and functional interfaces exceed the 128-operation limit.');
 const keys=originals.map(f=>JSON.stringify([f,p.settings.minFeature]));
 const same=cache&&cache.base===parts.base&&cache.lid===parts.lid;
 let reuse=0;if(same)while(reuse<keys.length&&reuse<cache.keys.length&&keys[reuse]===cache.keys[reuse])reuse++;
 let out={...parts},findings=[],features=[],accessories=[],stages=[];
 if(reuse){const r=cache.stages[reuse-1];out={...r.out};findings=r.findings.slice();features=r.features.slice();accessories=r.accessories.slice();stages=cache.stages.slice(0,reuse);progress('Reusing '+reuse+' unchanged feature operation(s)');}
 const next={base:parts.base,lid:parts.lid,keys,stages};
 const add=(severity,code,message,f,evidence='')=>findings.push({id:code+':'+f.id,severity,code,message,objects:[f.groupId||f.id],evidence,confidence:'geometric'});
 for(let i=reuse;i<originals.length;i++){
  const original=originals[i];
  try{
   if(!original.enabled)continue;
   const f=M.resolvedFeature(original,p,a,d);
   if(f.unresolved){add('error',f.unresolvedSurface?'unresolved-surface':'unresolved-link',f.name+(f.unresolvedSurface?': its polygon side was removed. Reattach the face explicitly.':': its linked component is missing. Reassign or detach the anchor.'),f);continue;}
   progress('Feature '+(i+1)+'/'+originals.length+' · '+f.name);
   const targets=f.target==='both'?['base','lid']:f.target&&f.target!=='auto'?[f.target]:[f.frame.part];
   if(targets.some(t=>!out[t]?.polys.length)){add('error','missing-target',f.name+': the selected printable part does not exist.',f);continue;}
   if(f.kind==='panel'){
    if(targets.length!==1||targets[0]!=='base'||['lid','inside-lid'].includes(f.face)){add('error','panel-target','Removable panels must target a base face.',f);continue;}
    const r=panel(f,out.base,p);out.base=r.base;accessories.push(r.part);features.push({id:f.id,name:f.name,kind:f.kind,face:f.face,targets,width:f.width+16,height:f.height+16,u:f.u,v:f.v,rotation:f.rotation,bounds:r.part.solid.bounds});add('warning','panel-hardware',f.name+': panel hardware and inside access require review.',f);continue;
   }
   const ff=f.target==='both'&&!additive(f)?{...f,frame:{...f.frame,thickness:f.frame.thickness+p.settings.fit+p.settings.lipWall+.1}}:f;
   const solid=tool(ff),ext=extents(f),edge=M.featureBounds?M.featureBounds(f):null;
   const angle=f.rotation*Math.PI/180,ew=Math.abs(Math.cos(angle))*ext.width+Math.abs(Math.sin(angle))*ext.height,eh=Math.abs(Math.sin(angle))*ext.width+Math.abs(Math.cos(angle))*ext.height;
   const beyond=edge?(f.u+edge.minU<-f.frame.width/2-.001||f.u+edge.maxU>f.frame.width/2+.001||f.v+edge.minV<-f.frame.height/2-.001||f.v+edge.maxV>f.frame.height/2+.001):Math.abs(f.u+ext.offsetX)+ew/2>f.frame.width/2+.001||Math.abs(f.v)+eh/2>f.frame.height/2+.001;
   if(beyond)add('warning','face-edge',f.name+' extends beyond its face boundary or onto a corner.',f,'Review remaining material and attachment.');
   let delta=0;for(const target of targets){const before=out[target].volume(),after=additive(f)?out[target].union(solid):out[target].subtract(solid);delta+=after.volume()-before;if(additive(f)&&Math.abs(out[target].intersect(solid).volume())<1e-6)add('error','detached-feature',f.name+' is not joined to '+target+'.',f);out[target]=after;}
   if(!additive(f)&&Math.abs(delta)<1e-6)add('warning','missed-cut',f.name+' does not remove material from its target.',f);
   if(['pocket','text-recessed','art-recessed'].includes(f.kind)&&f.depth>f.frame.thickness-p.settings.minFeature)add(f.depth>=f.frame.thickness?'error':'warning','thin-remainder',f.name+' leaves too little material behind the recess.',f,'Depth '+f.depth+' mm; face thickness '+f.frame.thickness+' mm.');
   if(f.kind==='vent'&&(f.pitchU-f.width<p.settings.minFeature&&f.columns>1||f.pitchV-f.height<p.settings.minFeature&&f.rows>1))add('warning','vent-web',f.name+' has overlapping openings or thin webs.',f);
   if(f.kind.startsWith('text')&&f.size/7<p.settings.minFeature)add('warning','text-stroke',f.name+': strokes are below the selected feature limit.',f);
   if(!['lid','floor','inside-floor','inside-lid'].includes(f.face)&&['cutout','vent'].includes(f.kind)&&!targets.includes('lid')&&out.lid.polys.length&&solid.intersect(out.lid).volume()>1e-5)add('warning','skirt-obstruction',f.name+' intersects the lid-skirt region.',f,'Choose Both parts to deliberately cut the base and lid.');
   features.push({id:f.id,groupId:f.groupId,name:f.name,kind:f.kind,face:f.face,targets,u:f.u,v:f.v,rotation:f.rotation,width:ext.width,height:ext.height,offsetX:ext.offsetX,volumeDelta:delta,bounds:solid.bounds});
  }catch(e){e.featureId=original.groupId||original.id;e.stage='feature';e.message=original.name+': '+e.message;cache=null;throw e;}
  finally{stages.push({out:{...out},findings:findings.slice(),features:features.slice(),accessories:accessories.slice()});}
 }
 cache=next;
 return{...out,features,findings,parts:accessories,cacheStats:{featuresReused:reuse,featuresEvaluated:originals.length-reuse}};
}
function clearCache(){cache=null;}
return{extents,outline,tool,apply,artSolid,clearCache};
});
