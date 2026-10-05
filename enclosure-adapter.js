/* CIRCUITBENCH to enclosure workshop: explicit millimeter geometry, no electrical-model edits. GPL-3.0-only. */
(function(root){'use strict';
const node=typeof module!=='undefined',C=node?require('./enclosure'):root.CB,M=node?require('./enclosure-workshop/model'):root.CaseModel;
const previous=C.validate;
function mechanical(p){
 const holes=C.holes(p),mountOwners={};for(const h of holes)if(h.component)mountOwners[h.id]=h.component;
 const isMount=c=>/mounting.?hole/i.test([c.kind,c.deviceName,c.footprintName,c.value].join(' '));
 for(const c of p.components.filter(isMount))for(const a of C.pads({...p,components:[c]}).filter(a=>a.drill)){const id='pad_'+c.id+'_'+a.n;holes.push({...a,id,rotation:a.angle,plated:false});mountOwners[id]=c.id;}
 return {app:'CIRCUITBENCH_MECHANICAL',schema:1,units:'mm',coordinateSystem:'top-left-x-right-y-down-pcb-underside-z0',producer:{app:'CIRCUITBENCH',version:C.VERSION},source:{app:'CIRCUITBENCH',schema:2,version:C.VERSION,id:p.id||'circuitbench-board',title:p.title},requiredExtensions:[],
  board:{color:C.boardAppearance(p.board).color,width:p.board.width,height:p.board.height,thickness:p.board.thickness,shape:'polygon',points:C.G.outline(p)},
  components:p.components.map(c=>({id:c.id,ref:c.ref,name:c.deviceName||c.kind,value:c.value,category:c.category||'',placement:{x:c.pcb.x,y:c.pcb.y,rotation:c.pcb.rotation,side:c.pcb.side==='B'?'bottom':'top'},envelope:{width:c.body[0],depth:c.body[1],height:c.height,kind:c.kind,evidence:'representative'},pads:c.pads.map(a=>({number:a.n,x:a.x,y:a.y,w:a.width||a.diameter,h:a.height||a.diameter,drill:a.drill||0,slot:Math.max(0,(a.slot||0)-(a.drill||0)),rotation:a.rotation||0,shape:['rect','circle','oval'].includes(a.shape)?a.shape:'rect',layers:a.mount==='tht'?'both':c.pcb.side==='B'?'bottom':'top'})),mountingHoles:[],references:{},sourceNote:'CIRCUITBENCH placed footprint and editable body envelope',footprintVerified:false})),
  holes:holes.map(h=>({id:h.id,x:h.x,y:h.y,drill:h.drill,slot:Math.max(0,(h.slot||0)-h.drill),rotation:h.rotation||0,plated:h.plated===true})),mountOwners,
  vias:p.vias.map(v=>({id:v.id,x:v.x,y:v.y,drill:v.drill})),cutouts:C.clone(p.cutouts),assumptions:[p.assumptions||'Body dimensions need mechanical review.'],evidence:[p.evidence||'No physical fit evidence recorded.']};
}
function create(p){const source=JSON.stringify(mechanical(p)),q=M.defaults(source,p.title+'.circuitbench-mechanical.json');q.title=p.title+' enclosure';q.view.scene='exploded';q.settings.supportDiameter=6;q.settings.supportBore=2.6;q.settings.supportHeight=6;q.settings.autoSupport=true;q.settings.margin=3;q.settings.radius=4;q.settings.closure=false;q.system.closure.type='none';Object.assign(q.system.hardware,{name:'Editable small PCB screw envelope',shaft:2,length:6,headDiameter:4,headHeight:2,washerDiameter:4,washerThickness:.2,accessDiameter:6,accessLength:15});q.integration={schema:1,supportMode:'blind',boreDepth:4,nutPockets:false,manualSupports:[],migrationNotes:[]};
 for(const h of M.effective(q).bores.filter(h=>h.role==='mounting-candidate')){q.supports[h.id]={enabled:!h.ownerId&&!h.slot&&h.diameter>=2,bore:Math.min(2.6,Math.max(.5,h.diameter-.2))};}
 return M.validate(q);
}
function migrate(p){let q=create(p);if(!p.enclosure)return q;const e=p.enclosure,plan=C.enclosurePlan(p),s=q.settings;
 Object.assign(s,{margin:e.clearance,wall:e.wall,floor:e.floor,roof:e.lid,topClearance:e.headroom,bottomClearance:e.underClearance,leadAllowance:e.leadClearance,supportHeight:e.standoffHeight,autoSupport:false,supportDiameter:e.standoffDiameter,supportBore:e.bore,autoHeight:e.heightMode==='auto',height:e.floor+e.insideHeight,lipDepth:e.lipDepth,lipWall:e.lipWall,fit:e.fit,radius:0,autoSize:false,innerWidth:plan.width-2*e.wall,innerDepth:plan.depth-2*e.wall});
 let a=M.effective(q),d=M.dimensions(q,a);s.offsetX+=plan.origin.x+plan.width/2-d.cx;s.offsetY+=plan.origin.y+plan.depth/2+d.cy;
 q.integration.supportMode=e.boreMode;q.integration.boreDepth=e.boreDepth;
 for(const h of a.bores.filter(h=>h.role==='mounting-candidate'))q.supports[h.id]={enabled:false};
 for(const m of e.mounts){const values={enabled:m.enabled,diameter:m.diameter??e.standoffDiameter,bore:e.boreMode==='solid'?0:m.bore??Math.min(e.bore,Math.max(.5,(a.bores.find(h=>h.id===m.anchor)?.diameter||e.bore+.2)-.2))};if(m.anchor)q.supports[m.anchor]=values;else q.integration.manualSupports.push({id:m.id,x:m.x,y:-m.y,...values});}
 a=M.effective(q);d=M.dimensions(q,a);
 for(const o of e.openings){const face={front:'back',back:'front',left:'left',right:'right',lid:'lid',floor:'floor'}[o.face],f=M.feature('cutout',face),flat=['lid','floor'].includes(face);let pt=flat?[plan.origin.x+o.u,-(plan.origin.y+o.v),face==='lid'?d.top:0]:['front','back'].includes(o.face)?[plan.origin.x+o.u,o.face==='front'?-(plan.origin.y):-(plan.origin.y+plan.depth),e.floor+o.v]:[o.face==='left'?plan.origin.x:plan.origin.x+plan.width,-(plan.origin.y+o.u),e.floor+o.v];const xy=M.project(M.frame(face,d,s),pt);Object.assign(f,{id:o.id,name:o.name,shape:o.shape,u:xy[0],v:xy[1],width:o.width,height:o.height,through:true});q.features.push(f);}
 q.integration.migrationNotes=['Migrated v1.3 dimensions, supports and six-face openings. The original v1.3 settings remain in the PCB project as a backup.'];return M.validate(q);
}
function sync(p){let q=p.enclosureWorkshop?M.validate(p.enclosureWorkshop):migrate(p),source=JSON.stringify(mechanical(p));if(q.source.text!==source){const comparison=M.revisionPreview(q,source);q=M.applyRevision(q,source,p.title+'.circuitbench-mechanical.json');q.generated=false;q.integration.migrationNotes=['PCB updated: '+comparison.changes.length+' geometry/source changes. Linked features follow stable IDs; review dimensions and fit evidence.'];}return q;}
function validate(input){let p=previous(input);if(p.enclosureWorkshop)p.enclosureWorkshop=M.validate(p.enclosureWorkshop);if(p.baseline?.snapshot?.enclosureWorkshop)p.baseline.snapshot.enclosureWorkshop=M.validate(p.baseline.snapshot.enclosureWorkshop);return p;}
Object.assign(C,{validate,enclosureMechanical:mechanical,enclosureWorkshopCreate:create,enclosureWorkshopMigrate:migrate,enclosureWorkshopSync:sync});if(node)module.exports=C;
})(globalThis);
