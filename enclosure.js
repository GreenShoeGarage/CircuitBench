/* CIRCUITBENCH board-derived enclosure model. GPL-3.0-only. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./board-editing'):root.CB,priorValidate=C.validate;
const round=C.round,clone=C.clone;
const isMountingPart=c=>/mounting.?hole/i.test([c.kind,c.deviceName,c.footprintName,c.value].join(' '));
function candidates(p){let holes=C.holes(p).filter(h=>!h.plated).map(h=>({...h,name:h.component?(p.components.find(c=>c.id===h.component)?.ref||'Footprint')+' hole':'Board hole'}));
 for(let c of p.components.filter(isMountingPart))for(let a of C.pads({...p,components:[c]}).filter(a=>a.drill))holes.push({...a,id:'pad_'+c.id+'_'+a.n,name:c.ref+' plated mounting hole',rotation:a.angle});
 return holes;
}
function defaults(p){let bottom=Math.max(0,...p.components.filter(c=>c.pcb.side==='B').map(c=>c.height),C.pads(p).some(a=>a.drill)?2:0);return {schema:1,clearance:3,wall:2,floor:2,lid:2,headroom:3,underClearance:1,leadClearance:2,standoffHeight:Math.max(6,bottom+1),standoffDiameter:6,bore:2.6,boreDepth:4,boreMode:'blind',heightMode:'auto',insideHeight:25,lipDepth:2,lipWall:1.2,fit:.25,mounts:candidates(p).map(h=>({id:C.uid(),anchor:h.id,x:h.x,y:h.y,enabled:h.drill>=2,diameter:null,bore:null})),openings:[]};}
function validateConfig(e){
 const fail=m=>{throw Error('Invalid enclosure: '+m);},num=(v,a,b,label)=>{if(typeof v!=='number'||!Number.isFinite(v)||v<a||v>b)fail(label+' must be '+a+'–'+b+' mm.');};
 if(!e||e.schema!==1)fail('unsupported settings version.');
 for(let [key,a,b] of [['clearance',.5,50],['wall',.8,10],['floor',.8,10],['lid',.8,10],['headroom',.5,50],['underClearance',0,20],['leadClearance',0,20],['standoffHeight',1,100],['standoffDiameter',2,30],['bore',0,20],['boreDepth',.5,100],['insideHeight',5,200],['lipDepth',0,10],['lipWall',.8,5],['fit',.05,2]])num(e[key],a,b,key);
 if(!['auto','manual'].includes(e.heightMode)||!['blind','through','solid'].includes(e.boreMode))fail('height or bore mode.');
 if(!Array.isArray(e.mounts)||e.mounts.length>100||!Array.isArray(e.openings)||e.openings.length>80)fail('supports at most 100 standoffs and 80 openings.');
 const ids=new Set();function id(a){if(typeof a.id!=='string'||!/^[-\w]{1,100}$/.test(a.id)||ids.has(a.id))fail('duplicate or malformed object ID.');ids.add(a.id);}
 for(let m of e.mounts){id(m);if(typeof m.anchor!=='string'||m.anchor.length>120||typeof m.enabled!=='boolean')fail('standoff anchor.');num(m.x,-1000,1000,'standoff X');num(m.y,-1000,1000,'standoff Y');for(let k of ['diameter','bore'])if(m[k]!==null)num(m[k],k==='bore'?0:2,k==='bore'?20:30,'standoff '+k);}
 for(let o of e.openings){id(o);if(!['front','back','left','right','lid','floor'].includes(o.face)||!['circle','rect','slot'].includes(o.shape))fail('opening face or shape.');if(typeof o.name!=='string'||o.name.length>100)fail('opening name.');num(o.u,-1000,1000,'opening center U');num(o.v,-1000,1000,'opening center V');num(o.width,1,500,'opening width');num(o.height,1,500,'opening height');if(o.shape==='circle'&&Math.abs(o.width-o.height)>1e-6)fail('circular opening must have equal width and height.');}
 return e;
}
function syncMounts(p,e){let known=new Set(e.mounts.map(m=>m.anchor));for(let h of candidates(p))if(!known.has(h.id))e.mounts.push({id:C.uid(),anchor:h.id,x:h.x,y:h.y,enabled:h.drill>=2,diameter:null,bore:null});return e;}
function bodyPolygon(c){return C.G.rect(c.pcb.x,c.pcb.y,c.body[0],c.body[1],c.pcb.rotation);}
function plan(p,config=p.enclosure||defaults(p)){
 const e=clone(validateConfig(config)),G=C.G,bounds=G.bounds([G.outline(p),...p.components.map(bodyPolygon)]),inner={minX:bounds.minX-e.clearance,minY:bounds.minY-e.clearance,maxX:bounds.maxX+e.clearance,maxY:bounds.maxY+e.clearance};
 const ox=inner.minX-e.wall,oy=inner.minY-e.wall,width=inner.maxX-inner.minX+2*e.wall,depth=inner.maxY-inner.minY+2*e.wall,topHeight=Math.max(0,...p.components.filter(c=>c.pcb.side==='F').map(c=>c.height)),bottomHeight=Math.max(0,...p.components.filter(c=>c.pcb.side==='B').map(c=>c.height)),hasLeads=C.pads(p).some(a=>a.drill),below=Math.max(bottomHeight,hasLeads?e.leadClearance:0),requiredHeight=e.standoffHeight+p.board.thickness+topHeight+e.headroom,insideHeight=e.heightMode==='auto'?Math.max(requiredHeight,e.lipDepth+1,5):e.insideHeight,baseTop=e.floor+insideHeight,pcbBottom=e.floor+e.standoffHeight;
 const issues=[],add=(severity,code,message,target,confidence='High')=>issues.push({severity,code,message,target,confidence}),holes=candidates(p),mounts=[];
 if(width>650||depth>650||insideHeight>250)add('error','SIZE','Enclosure exceeds the supported 650 × 650 × 250 mm size.');
 if(e.standoffHeight<below+e.underClearance-1e-6)add('error','BELOW_BOARD','Raise standoffs to at least '+round(below+e.underClearance)+' mm for back-side components / lead allowance and clearance.');
 if(insideHeight<requiredHeight-.001)add('error','LID_CLEARANCE','Inside height needs at least '+round(requiredHeight)+' mm for the PCB, top components and headroom.');
 if(Math.min(width,depth)-2*e.wall<=2*(e.fit+e.lipWall)+1)add('error','LIP_WIDTH','Reduce lip wall / fit clearance, or increase side clearance.');
 if(insideHeight<=e.lipDepth)add('error','LIP_DEPTH','The locating lip reaches the floor. Reduce lip depth.');
 for(let m of e.mounts){if(!m.enabled)continue;let h=m.anchor?holes.find(h=>h.id===m.anchor):null;if(m.anchor&&!h){add('error','MISSING_HOLE','A linked PCB hole was removed. Remove or disable its standoff.',m.id);continue;}let x=h?.x??m.x,y=h?.y??m.y,diameter=m.diameter??e.standoffDiameter,bore=m.bore??(h?Math.min(e.bore,Math.max(.5,h.drill-.2)):e.bore),r=diameter/2,foot=G.circle(x,y,r,48);
  if(e.boreMode!=='solid'&&bore>diameter-1)add('error','STANDOFF_WALL','A standoff needs at least 0.5 mm of material around its bore.',m.id);
  if(x-r<inner.minX||x+r>inner.maxX||y-r<inner.minY||y+r>inner.maxY)add('error','STANDOFF_OUTSIDE','A standoff extends into or beyond the enclosure wall.',m.id);
  if(!G.inside({x,y},[G.outline(p)])||p.cutouts.some(c=>G.inside({x,y},[c.points])))add('error','STANDOFF_BOARD','A standoff center is outside PCB material.',m.id);
  if(h&&diameter<h.drill+1)add('error','STANDOFF_SUPPORT','Increase standoff diameter to support the PCB around its '+h.drill+' mm hole.',m.id);
  if(!h)add('warning','MANUAL_STANDOFF','Manual support has no linked mounting hole; check its PCB contact area.',m.id);
  if(h?.slot)add('warning','SLOTTED_MOUNT','A circular standoff is centered on a slot; verify screw position and support.',m.id);
  if(h&&e.boreMode!=='solid'&&bore>h.drill)add('warning','BORE_SIZE','Standoff bore is wider than the linked PCB hole.',m.id);
  if(G.difference([foot],G.boardMaterial(p)).length)add('warning','EDGE_SUPPORT','A standoff overlaps the PCB edge or a cutout; verify the support area.',m.id);
  for(let c of p.components.filter(c=>c.pcb.side==='B'&&!isMountingPart(c)))if(G.intersect([foot],[bodyPolygon(c)]).length)add('error','STANDOFF_COMPONENT','A standoff collides with back-side component '+c.ref+'.',m.id);
  mounts.push({...m,x:x-ox,y:y-oy,boardX:x,boardY:y,diameter,bore,holeDiameter:h?.drill||0,name:h?.name||'Manual support'});
 }
 if(!mounts.length)add('warning','NO_STANDOFFS','No standoffs are enabled. Select mounting holes or add a manual support.');
 const shapePaths=o=>o.shape==='circle'?[G.circle(o.u,o.v,o.width/2,64)]:o.shape==='slot'?[G.oval(o.u,o.v,o.width,o.height,0)]:[G.rect(o.u,o.v,o.width,o.height)];
 for(let o of e.openings){let flat=['lid','floor'].includes(o.face),span=['left','right'].includes(o.face)?depth:width,second=flat?depth:insideHeight;
  if(o.u-o.width/2<e.wall+.5||o.u+o.width/2>span-e.wall-.5||o.v-o.height/2<(flat?e.wall+.5:.5)||o.v+o.height/2>second-(flat?e.wall+.5:.5))add('error','OPENING_EDGE','Opening “'+o.name+'” crosses a face edge or leaves less than 0.5 mm of material. Move or shrink it.',o.id);
  if(flat)for(let m of mounts)if(o.face==='floor'&&G.intersect(shapePaths(o),[G.circle(m.x,m.y,m.diameter/2)]).length)add('error','OPENING_STANDOFF','Floor opening “'+o.name+'” cuts through a standoff attachment.',o.id);
  if(o.face==='lid'&&e.lipDepth>0&&(o.u-o.width/2<e.wall+e.fit+e.lipWall||o.u+o.width/2>width-e.wall-e.fit-e.lipWall||o.v-o.height/2<e.wall+e.fit+e.lipWall||o.v+o.height/2>depth-e.wall-e.fit-e.lipWall))add('warning','OPENING_LIP','Lid opening “'+o.name+'” intersects the locating lip.',o.id);
 }
 for(let i=0;i<e.openings.length;i++)for(let j=i+1;j<e.openings.length;j++){let a=e.openings[i],b=e.openings[j];if(a.face===b.face&&G.intersect(shapePaths(a),shapePaths(b)).length)add('warning','OPENINGS_MERGE','Openings “'+a.name+'” and “'+b.name+'” overlap and will merge.',a.id);}
 const components=p.components.map(c=>({id:c.id,ref:c.ref,width:c.body[0],depth:c.body[1],height:c.height,x:c.pcb.x-ox,y:c.pcb.y-oy,rotation:c.pcb.rotation,side:c.pcb.side,bottom:c.pcb.side==='B'?pcbBottom-c.height:pcbBottom+p.board.thickness}));
 for(let c of components)if(c.side==='F'&&c.bottom+c.height>baseTop-e.lipDepth){let b=G.bounds([bodyPolygon(p.components.find(x=>x.id===c.id))]);if(b.minX-ox<e.wall+e.fit+e.lipWall||b.maxX-ox>width-e.wall-e.fit-e.lipWall||b.minY-oy<e.wall+e.fit+e.lipWall||b.maxY-oy>depth-e.wall-e.fit-e.lipWall)add('error','LIP_COMPONENT','The lid lip intersects '+c.ref+'. Increase side clearance or inside height.');}
 if(p.components.length)add('warning','HEIGHT_ESTIMATES','Component bodies use the editable stored heights. Check real parts, connector access and lead lengths before printing.','', 'Medium');
 const convert=q=>({x:q.x-ox,y:q.y-oy});
 return {config:e,width,depth,insideHeight,baseTop,totalHeight:baseTop+e.lid,origin:{x:ox,y:oy},pcbBottom,pcbThickness:p.board.thickness,topHeight,bottomHeight,below,requiredHeight,mounts,components,board:{outline:G.outline(p).map(convert),cutouts:p.cutouts.map(c=>c.points.map(convert)),holes:[...C.holes(p),...C.pads(p).filter(a=>a.drill)].map(h=>G.drillPolygon(h).map(convert))},issues};
}
function validate(input){let p=priorValidate(input);if(p.enclosure!=null)validateConfig(p.enclosure);if(p.baseline?.snapshot?.enclosure!=null)validateConfig(p.baseline.snapshot.enclosure);return p;}
Object.assign(C,{validate,enclosureDefaults:defaults,enclosureCandidates:candidates,enclosureSyncMounts:syncMounts,enclosurePlan:plan,validateEnclosure:validateConfig});
if(typeof module!=='undefined')module.exports=C;else root.CB=C;
})(typeof globalThis!=='undefined'?globalThis:this);
