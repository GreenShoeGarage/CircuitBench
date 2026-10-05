/* Full-scale fit skeletons and functional enclosure groups. Geometry remains
 * measured intent, not stress, optical, electrical or physical fit certification. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else factory(root.CaseGeometry,root.CaseSolid,root.CaseModel,root.CaseFeatures);})(globalThis,function(G,S,M,F){'use strict';
 const E=.025;
 function placed(solid,f){return solid.rotateZ(f.rotation||0).translate([f.u,f.v,0]).transform(v=>M.toWorld(f.frame,v));}
 function issue(g,severity,code,message,evidence=''){return{id:code+':'+g.id,severity,code,message:g.name+': '+message,objects:[g.id],evidence,confidence:'geometric / user-defined dimensions'};}
 let functionalCache=null;
 function functionalGeometry(p,a,d,solids,progress=()=>{}){
  const key=JSON.stringify([p.workflow.interfaces,a,d,p.settings.minFeature]);
  if(functionalCache&&functionalCache.key===key&&functionalCache.base===solids.base&&functionalCache.lid===solids.lid)return functionalCache.result;
  let base=solids.base,lid=solids.lid,parts=[],findings=[],hardware=[];
  for(const g of p.workflow.interfaces){if(!g.enabled)continue;progress('Functional interface · '+g.name);try{
   const f=M.resolvedFeature({...M.feature('cutout',g.face,g.componentId),u:g.u,v:g.v,rotation:g.rotation,anchorLocal:{x:g.localX,y:g.localY,z:g.localZ}},p,a,d);
   if(f.unresolved){findings.push(issue(g,'error','interface-anchor','component or polygon-face anchor is unresolved.'));continue;}
   if(!g.reviewed)findings.push(issue(g,'warning','interface-review','confirm the installed interface dimensions and access direction.','No dimensions were inferred from the component name.'));
   const target=f.frame.part,t=f.frame.thickness,shapeTarget=()=>target==='lid'?lid:base,setTarget=s=>{if(target==='lid')lid=s;else base=s;};
   if(!shapeTarget()?.polys.length){findings.push(issue(g,'error','interface-target','target part does not exist.'));continue;}
   if(g.face.startsWith('inside-')||g.face==='floor'){findings.push(issue(g,'error','interface-direction','functional groups require an exterior wall or lid face.'));continue;}
   if(g.type==='connector'){
    if(g.plugWidth<g.width||g.plugHeight<g.height)findings.push(issue(g,'warning','plug-envelope','plug envelope is smaller than the opening definition.'));
    const plug=placed(S.box(-g.plugWidth/2,-g.plugHeight/2,-g.recess,g.plugWidth,g.plugHeight,g.plugReach+g.recess),f);
    if(plug.intersect(base).volume()+plug.intersect(lid).volume()>.001)findings.push(issue(g,'warning','plug-corridor','the defined plug approach overlaps case material.','Review recess depth, plug envelope and the case seam; final connector mating is not simulated.'));
   }
   if(g.type==='connector'&&g.cableTies){
    const span=g.rim*2+g.tiePassage,reach=g.rim*2+g.tiePassage,spacing=(Math.max(g.width,g.plugWidth)/2)+g.rim+span/2;
    for(const x of [-spacing,spacing]){const block=S.box(x-span/2,-span/2,-t-reach,span,span,reach+E),passage=S.box(x-span/2-1,-g.tiePassage/2,-t-reach+g.rim,span+2,g.tiePassage,g.tiePassage);setTarget(shapeTarget().union(placed(block.subtract(passage),f)));}
    findings.push(issue(g,'warning','tie-anchor-review','cable-tie bridges are geometric anchors only; review tie size, routing, loads and installation access.'));
   }
   if(g.type==='led'){
    const radius=g.width/2+g.clearance,outer=radius+g.rim;
    const sleeve=S.cylinder(0,0,-t-g.guide,outer,t+g.guide+E,32).subtract(S.cylinder(0,0,-t-g.guide-1,radius,t+g.guide+2,32));
    let guide=sleeve;if(g.retainingLip>0){if(radius-g.retainingLip<.5)throw Error(g.name+': retaining lip closes the guide aperture.');const lip=S.cylinder(0,0,-t-g.guide,outer,Math.min(g.rim,g.guide),32).subtract(S.cylinder(0,0,-t-g.guide-1,radius-g.retainingLip,Math.min(g.rim,g.guide)+2,32));guide=guide.union(lip);}setTarget(shapeTarget().union(placed(guide,f)));
    findings.push(issue(g,'warning','optical-fit','bezel and guide are modeled; LED retention, light-pipe material and optical performance require review.'));
   }
   if(g.type==='display'){
    if(g.windowSeat>=g.depth-.1||g.windowLip>=g.rim-.1)throw Object.assign(Error(g.name+': the window seat must leave at least 0.1 mm of bezel material underneath and outside.'),{featureId:g.id,stage:'functional interface'});
    const seat=S.box(-g.width/2-g.windowLip,-g.height/2-g.windowLip,g.depth-g.windowSeat,g.width+2*g.windowLip,g.height+2*g.windowLip,g.windowSeat+E);
    setTarget(shapeTarget().subtract(placed(seat,f)));
    if(g.displayRetainer){
     if(g.deviceWidth<g.width+2*g.rim||g.deviceHeight<g.height+2*g.rim)throw Object.assign(Error(g.name+': the device envelope must extend beyond the opening and retaining ledge.'),{featureId:g.id,stage:'functional interface'});
     const pr=g.fastenerBore/2+g.rim,px=g.deviceWidth/2+pr,py=g.deviceHeight/2+pr,zt=-t-g.deviceDepth-g.clearance,zb=zt-g.retainerThickness;
     let ring=S.prism(S.rounded(-px-pr,-py-pr,2*(px+pr),2*(py+pr),pr,6),zb,zt).subtract(S.box(-g.deviceWidth/2+g.rim,-g.deviceHeight/2+g.rim,zb-1,g.deviceWidth-2*g.rim,g.deviceHeight-2*g.rim,g.retainerThickness+2));
     for(const x of [-px,px])for(const y of [-py,py]){const bore=S.cylinder(x,y,zb-1,g.fastenerBore/2,-zb+g.depth+3,24),post=S.cylinder(x,y,zt,pr,-t+E-zt,24).subtract(bore);ring=ring.subtract(bore);setTarget(shapeTarget().subtract(placed(bore,f)).union(placed(post,f)));}
     parts.push({id:g.id+'-display-retainer',name:g.name+' retaining frame',parentPart:target,explodeNormal:f.frame.n,explodeDistance:target==='lid'?-14:25,solid:placed(ring,f)});hardware.push({item:g.name+' retaining-frame fasteners',quantity:4,bore:g.fastenerBore,note:'Through-bores; select actual screws, nuts, head seating and tool clearance. No threads or preload are inferred.'});
    }
    findings.push(issue(g,'warning','display-fit','window seat and viewing aperture are modeled; review window dimensions, adhesive or restraint, display clearance and optional retaining-frame hardware.'));
   }
   if(g.type==='button'){
    const rs=g.width/2,clear=g.clearance,ri=rs+clear,ro=ri+g.rim,guideBottom=-t-g.guide,
      flangeTop=guideBottom-clear,flangeBottom=flangeTop-g.flange,retainerTop=flangeBottom-g.travel-clear,
      retainerBottom=retainerTop-g.retainerThickness,pitch=ro+g.fastenerBore/2+g.rim+.6,postRadius=g.fastenerBore/2+g.rim;
    if(g.flange<.6||g.rim<p.settings.minFeature)findings.push(issue(g,'warning','button-thin','flange or guide wall is below the selected minimum feature threshold.'));
    let support=S.cylinder(0,0,guideBottom,ro,t+g.guide+E,32).subtract(S.cylinder(0,0,guideBottom-1,ri,t+g.guide+2,32));
    let keeper=S.prism(S.rounded(-pitch-postRadius,-ro,2*(pitch+postRadius),2*ro,2,6),retainerBottom,retainerTop).subtract(S.cylinder(0,0,retainerBottom-1,ri,g.retainerThickness+2,32));
    for(const x of [-pitch,pitch]){
     const post=S.cylinder(x,0,retainerTop,postRadius,-t+E-retainerTop,24);
     support=support.union(post);const bore=S.cylinder(x,0,retainerBottom-1,g.fastenerBore/2,-retainerBottom+g.depth+3,24);
     support=support.subtract(bore);keeper=keeper.subtract(bore);setTarget(shapeTarget().subtract(placed(bore,f)));
    }
    setTarget(shapeTarget().union(placed(support,f)));
    const tailBottom=retainerBottom-g.stem,shaft=S.cylinder(0,0,tailBottom,rs,g.depth-tailBottom,32),flange=S.cylinder(0,0,flangeBottom,ro,g.flange,32),plunger=placed(shaft.union(flange),f),retainer=placed(keeper,f);
    parts.push({id:g.id+'-plunger',name:g.name+' plunger',parentPart:target,explodeNormal:f.frame.n,explodeDistance:14,solid:plunger},{id:g.id+'-retainer',name:g.name+' removable retainer',parentPart:target,explodeNormal:f.frame.n,explodeDistance:target==='lid'?-16:30,solid:retainer});
    hardware.push({item:g.name+' retainer fasteners',quantity:2,bore:g.fastenerBore,note:'Through-bores only; select screws, nuts, seating and tool access. No printed thread or rated retention is implied.'});
    findings.push(issue(g,'warning','button-travel','review the switch contact, '+g.travel+' mm travel, tail length and assembly order.','Insert plunger from inside; fit the separate retainer and external through-fasteners. Physical fit, actuation force and wear are untested.'));
    for(const part of parts.slice(-2)){
     const abs=(b,z)=>({lo:b.minZ+z,hi:b.maxZ+z});
     for(const board of a.boards){const q=abs(board.board.bounds,d.boardZ);if(part.solid.intersect(S.prism(board.board.outline,q.lo,q.hi)).volume()>.001)findings.push(issue(g,'error','interface-board-collision',part.name+' intersects '+board.name+' substrate.','Shorten the tail, alter board height, or relocate the interface.'));}
     for(const c of a.components.filter(c=>c.body))if(part.solid.intersect(S.prism(c.vertices.slice(0,4),c.bounds.minZ+d.boardZ,c.bounds.maxZ+d.boardZ)).volume()>.001)findings.push(issue(g,c.id===g.componentId?'warning':'error','interface-part-collision',part.name+' intersects '+c.ref+'.',c.id===g.componentId?'Selected actuator contact must be reviewed in rest and pressed positions.':'Move or resize the functional assembly.'));
    }
   }
   }catch(err){if(!err.featureId)err.featureId=g.id;if(!err.stage)err.stage='functional interface';functionalCache=null;throw err;}
  }
  const result={base,lid,parts,findings,hardware};functionalCache={key,base:solids.base,lid:solids.lid,result};return result;
 }
 function fitFrame(input,progress=()=>{}){
  const p=M.validate(input),full=G.build(p,progress),a=M.effective(p),d=M.dimensions(p,a),s=p.settings,w=p.workflow.fitFrame.web,band=p.workflow.fitFrame.band,outline=G.outlines(p,a,d),q=G.lastSolidBuild;
  if(q.key!==M.geometryState(p))throw Error('Fit-frame source is stale. Regenerate the case.');
  if(d.innerWidth<=2*w+1||d.innerDepth<=2*w+1)throw Error('Fit-frame web is too wide for this enclosure.');
  if(d.slope||!['external','internal','insert','none'].includes(p.system.closure.type))throw Error('Fit frames currently support level shells with screw or no closure; hinged, snap, sliding and sloped mechanisms need their dedicated joint sample.');
  if(full.parts.some(x=>!x.audit.valid||x.audit.connectedComponents!==1))throw Error('Repair the enclosure topology before deriving a fit frame.');
  progress('Keeping actual mounting centers, wall interfaces and lid joint');
  const bounds=S.prism(outline.outer,0,1).bounds,min=bounds.min,max=bounds.max;
  const solidBox=(x,y,z,ww,dd,hh)=>S.box(x,y,z,Math.max(.01,ww),Math.max(.01,dd),Math.max(.01,hh));
  let innerVoid;const family=p.system.shell.family;if(d.innerWidth<=2*w+1||d.innerDepth<=2*w+1)throw Error('Fit-frame web is too wide for this enclosure.');if(['rounded','tray'].includes(family))innerVoid=S.rounded(d.innerMinX+w,d.innerMinY+w,d.innerWidth-2*w,d.innerDepth-2*w,Math.max(0,d.radius-s.wall-w),8);else if(['circle','oval'].includes(family))innerVoid=Array.from({length:64},(_,i)=>{const t=i*Math.PI/32;return[d.cx+(d.innerWidth/2-w)*Math.cos(t),d.cy+(d.innerDepth/2-w)*Math.sin(t)];});else innerVoid=G.offset(outline.inner,-w);const wide=S.prism(outline.outer,-2,d.top+20),innerRing=S.prism(innerVoid,-3,d.top+21),ring=wide.subtract(innerRing);
  let baseMask=ring.intersect(solidBox(min[0]-1,min[1]-1,-1,max[0]-min[0]+2,max[1]-min[1]+2,s.floor+1.1));
  baseMask=baseMask.union(ring.intersect(solidBox(min[0]-1,min[1]-1,d.height-band,max[0]-min[0]+2,max[1]-min[1]+2,band+3)));
  let lidMask=ring;
  const strip=(x,y,ww,dd,z=-1,h=d.top+20)=>solidBox(x-ww/2,y-dd/2,z,ww,dd,h);
  // Spokes join all mounting pads to the full-scale perimeter datum.
  for(const h of full.mounts.filter(h=>h.enabled)){
   baseMask=baseMask.union(S.cylinder(h.x,h.y,-1,h.outerDiameter/2+.1,d.boardZ+(h.z||0)+2,32));
   baseMask=baseMask.union(strip(d.cx,h.y,d.width+40,w,-1,s.floor+1.1));
   baseMask=baseMask.union(strip(h.x,d.cy,w,d.depth+40,-1,s.floor+1.1));
  }
  for(const c of full.closers.filter(c=>c.enabled)){const column=S.cylinder(c.x,c.y,-1,c.diameter/2+.1,d.top+4,32);baseMask=baseMask.union(column);lidMask=lidMask.union(column);}
  // Four upright datum webs preserve the actual top joint height.
  if(p.workflow.fitFrame.heightRefs){baseMask=baseMask.union(strip(d.cx,d.cy,w,d.depth+40));baseMask=baseMask.union(strip(d.cx,d.cy,d.width+40,w));}
  else { // Still keep two webs: a disconnected top rim is not a fit fixture.
   baseMask=baseMask.union(strip(d.cx,d.cy,w,d.depth+40));
  }
  if(p.workflow.fitFrame.keepFeatures){
   for(const original of p.features.concat(M.interfaceFeatures(p))){if(!original.enabled)continue;const f=M.resolvedFeature(original,p,a,d);if(f.unresolved)throw Error('Resolve feature anchors before generating a fit frame.');const b=M.featureBounds(f),part=f.frame.part;
    if(['lid','inside-lid'].includes(f.face)){
     const local=S.box(f.u+b.minU-w,f.v+b.minV-w,-s.lipDepth-s.roof-10,b.width+2*w,b.height+2*w,s.lipDepth+s.roof+40).transform(v=>M.toWorld(f.frame,v));lidMask=lidMask.union(local);
     const center=M.toWorld(f.frame,[f.u,f.v,0]);lidMask=lidMask.union(strip(d.cx,center[1],d.width+40,w)).union(strip(center[0],d.cy,w,d.depth+40));
    }else{
     const kept=S.box(f.u+b.minU-w,-f.frame.height/2-3,-s.wall-3,b.width+2*w,f.frame.height+6,s.wall+40).transform(v=>M.toWorld(f.frame,v));baseMask=baseMask.union(kept);
    }
   }
  }
  const raw=[{id:'fit-frame-base',name:'Full-scale fit frame · base',solid:q.solids.base.intersect(baseMask),orientation:'bottom'}];
  if(q.solids.lid.polys.length)raw.push({id:'fit-frame-lid',name:'Full-scale fit frame · lid',solid:q.solids.lid.intersect(lidMask),orientation:'top'});
  const parts=raw.map(x=>{progress('Auditing '+x.name);const mesh=S.mesh(x.solid),audit=S.audit(mesh);if(!audit.valid||audit.connectedComponents!==1)throw Error(x.name+' became disconnected. Increase web width or retain all feature regions.');return{id:x.id,name:x.name,mesh,audit,orientation:x.orientation};});
  const originals=full.parts.filter(p=>['base','lid'].includes(p.id)).reduce((sum,p)=>sum+p.audit.volumeMm3,0),volume=parts.reduce((sum,p)=>sum+p.audit.volumeMm3,0);
  return{version:M.VERSION,parts,hardware:[],instructions:'FULL-SCALE FIT TEST ONLY — not the finished enclosure. PCB hole centers, selected wall interfaces and the lid-joint datum retain their original relative positions and 1:1 millimetre scale. Large panels are removed, changing stiffness. Printed fit-frame success does not certify the full case. Use the same material/settings; record local corrections, not a global scale factor.',sourceFingerprint:M.geometryFingerprint(p),fitFrame:true,volumeReductionPercent:Math.round((1-volume/originals)*1000)/10,originalVolumeMm3:originals,frameVolumeMm3:volume,findings:full.findings};
 }
 Object.assign(G,{functionalGeometry,fitFrame});return G;
});
