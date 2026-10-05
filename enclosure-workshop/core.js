/* CASEBENCH 2.3.1 — Copperbench schemas 1–5 mechanical import adapter. MIT © 2026 Green Shoe Garage.
 * No display coordinates, camera state or electrical rules affect mechanical dimensions.
 * Source placement semantics checked against Copperbench src/core.js C.world/C.pads,
 * src/geometry.js G.holeEndpoints/G.outline, and src/platforms.js C.mountingHoles.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CaseCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '2.3.1', CONTRACT = 1, SUPPORTED_SCHEMAS = Object.freeze([1,2,3,4,5]), LIMITS = Object.freeze({jsonBytes:8388608, parts:512, pads:8192, holes:1024, cutouts:128, polygon:512, coordinate:10000});
  const clone = x => JSON.parse(JSON.stringify(x));
  const q = x => Math.round(x * 10000) / 10000;
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const obj = x => x && typeof x === 'object' && !Array.isArray(x);
  class ImportError extends Error { constructor(message,path='') {super(path ? path+': '+message : message);this.name='ImportError';this.path=path;} }
  function number(x,path,min=-LIMITS.coordinate,max=LIMITS.coordinate) {if(typeof x!=='number'||!Number.isFinite(x)||x<min||x>max)throw new ImportError('expected a finite number from '+min+' to '+max,path);return x;}
  function text(x,fallback='') {return typeof x==='string'?x:fallback;}
  function array(x,path,max,required=false) {if(x===undefined&&!required)return[];if(!Array.isArray(x)||x.length>max)throw new ImportError('expected an array with at most '+max+' entries',path);return x;}
  function identifier(x,path){if(typeof x!=='string'||!x||x.length>200||['__proto__','prototype','constructor'].includes(x))throw new ImportError('a nonempty ID of at most 200 characters is required',path);return x;}
  function parse(textValue) {
    if(typeof textValue!=='string'||new TextEncoder().encode(textValue).length>LIMITS.jsonBytes)throw new ImportError('JSON exceeds the 8 MiB import limit.');
    let value;try{value=JSON.parse(textValue.replace(/^\uFEFF/,''));}catch(e){throw new ImportError('Not valid JSON. '+e.message);}
    let nodes=0;
    function guard(x,depth){if(depth>70||++nodes>200000)throw new ImportError('JSON nesting or object count exceeds the safety limit.');if(obj(x))for(const k of Object.keys(x)){if(['__proto__','prototype','constructor'].includes(k))throw new ImportError('Unsafe object key: '+k);guard(x[k],depth+1);}else if(Array.isArray(x))x.forEach(v=>guard(v,depth+1));}
    guard(value,0);return value;
  }
  function area(points){let a=0;for(let i=0;i<points.length;i++){let b=points[(i+1)%points.length];a+=points[i].x*b.y-b.x*points[i].y;}return a/2;}
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function onSegment(p,a,b){return Math.abs(cross(a,b,p))<1e-8&&p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8;}
  function segmentsIntersect(a,b,c,d){let u=cross(a,b,c),v=cross(a,b,d),s=cross(c,d,a),t=cross(c,d,b);return ((u>0&&v<0||u<0&&v>0)&&(s>0&&t<0||s<0&&t>0))||onSegment(c,a,b)||onSegment(d,a,b)||onSegment(a,c,d)||onSegment(b,c,d);}
  function inside(p,poly){let a=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){let u=poly[i],v=poly[j];if(onSegment(p,u,v))return true;if((u.y>p.y)!==(v.y>p.y)&&p.x<(v.x-u.x)*(p.y-u.y)/(v.y-u.y)+u.x)a=!a;}return a;}
  function polygon(input,path){let a=array(input,path,LIMITS.polygon,true).map((p,i)=>{if(!obj(p))throw new ImportError('expected x/y point',path+'.'+i);return{x:number(p.x,path+'.'+i+'.x'),y:number(p.y,path+'.'+i+'.y')};});if(a.length>1&&a[0].x===a.at(-1).x&&a[0].y===a.at(-1).y)a.pop();if(a.length<3||Math.abs(area(a))<1e-8)throw new ImportError('polygon needs at least three points and nonzero area',path);for(let i=0;i<a.length;i++){let b=a[(i+1)%a.length];if(Math.hypot(a[i].x-b.x,a[i].y-b.y)<1e-8)throw new ImportError('repeated adjacent point',path);for(let j=i+1;j<a.length;j++){if(j===i+1||(i===0&&j===a.length-1))continue;if(segmentsIntersect(a[i],b,a[j],a[(j+1)%a.length]))throw new ImportError('polygon intersects itself',path);}}return a;}
  function bounds(points){const b={minX:Infinity,minY:Infinity,minZ:Infinity,maxX:-Infinity,maxY:-Infinity,maxZ:-Infinity};for(const p of points){for(const [k,v] of [['X',p.x],['Y',p.y],['Z',p.z??0]]){b['min'+k]=Math.min(b['min'+k],v);b['max'+k]=Math.max(b['max'+k],v);}}return b;}
  function size(b){return{x:q(b.maxX-b.minX),y:q(b.maxY-b.minY),z:q(b.maxZ-b.minZ)};}
  function roundRect(w,h,r){if(!r)return[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];const out=[];for(const [cx,cy,start]of[[w-r,r,-90],[w-r,h-r,0],[r,h-r,90],[r,r,180]])for(let i=0;i<=16;i++){let a=(start+i*90/16)*Math.PI/180;out.push({x:q(cx+Math.cos(a)*r),y:q(cy+Math.sin(a)*r)});}return out;}
  function ccw(p){return area(p)<0?[...p].reverse():p;}
  // Copperbench: mirror local X for bottom, then rotate clockwise in its Y-down plane.
  function sourceWorld(part,local){let a=part.rotation*Math.PI/180,x=local.x*(part.side==='bottom'?-1:1);return{x:q(part.x+x*Math.cos(a)-local.y*Math.sin(a)),y:q(part.y+x*Math.sin(a)+local.y*Math.cos(a))};}
  function world(part,local,z=0){const p=sourceWorld(part,local);return{x:p.x,y:-p.y,z};}
  function capsule(h,n=20){const ang=h.rotation*Math.PI/180,l=h.slot/2,r=h.diameter/2;const a={x:h.x-Math.cos(ang)*l,y:h.y-Math.sin(ang)*l},b={x:h.x+Math.cos(ang)*l,y:h.y+Math.sin(ang)*l},out=[];for(let i=0;i<=n;i++){let t=ang-Math.PI/2+i*Math.PI/n;out.push({x:b.x+Math.cos(t)*r,y:b.y+Math.sin(t)*r});}for(let i=0;i<=n;i++){let t=ang+Math.PI/2+i*Math.PI/n;out.push({x:a.x+Math.cos(t)*r,y:a.y+Math.sin(t)*r});}return out;}
  function fingerprint(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return ('00000000'+(h>>>0).toString(16)).slice(-8);}
  // Schemas 4/5 add attached planning references and grouping, not a new part transform.
  // These source metadata objects remain local to their owner. No source display flag
  // hides physical geometry and no 2D copper guard becomes an invented 3D keepout.
  function componentReferences(p,path,part,add) {
    const bool=(v,key)=>{if(typeof v!=='boolean')throw new ImportError('expected boolean',key);};
    const pattern=(items,key,max)=>array(items,key,max,true).forEach((h,i)=>{
      if(!obj(h))throw new ImportError('expected reference hole',key+'['+i+']');
      number(h.x,key+'['+i+'].x',-500,500);number(h.y,key+'['+i+'].y',-500,500);number(h.drill,key+'['+i+'].drill',.001,30);
    });
    const unknown=(o,known,key)=>{for(const k of Object.keys(o))if(!known.includes(k))add('warning','unknown-reference-field',part.ref+': uninterpreted reference field '+key+'.'+k,[part.id],'Preserved in source; not applied to mechanical geometry.');};
    if(p.module!=null){
      const m=p.module,key=path+'.module';
      if(!obj(m)||m.schema!==1)throw new ImportError('unsupported module metadata schema; expected 1',key);
      number(m.stackGap,key+'.stackGap',0,50);number(m.componentHeight,key+'.componentHeight',0,50);
      bool(m.showBody,key+'.showBody');bool(m.reviewed,key+'.reviewed');pattern(m.holePattern,key+'.holePattern',20);
      array(m.notes,key+'.notes',30,true).forEach((n,i)=>{if(typeof n!=='string'||n.length>1000)throw new ImportError('expected note of at most 1000 characters',key+'.notes['+i+']');});
      part.module=clone(m);
      add('warning','module-fit-review',part.ref+': review the installed module, stack height and underside/access space.',[part.id],
        'Imported body.z already represents the complete nominal module stack; its gap is not added twice. Source gap '+m.stackGap+' mm; component height '+m.componentHeight+' mm. '+m.notes.join(' '),'unverified');
      if(part.body&&Math.abs(part.body.height-(m.stackGap+1.6+m.componentHeight))>.00011)
        add('warning','module-height-mismatch',part.ref+': stored body height differs from the module planning stack.',[part.id],
          'Using the explicitly stored body.z ('+part.body.height+' mm), not silently replacing it. Copperbench 1.6.1 planning sum: gap + nominal 1.6 mm module PCB + component height = '+q(m.stackGap+1.6+m.componentHeight)+' mm. Review the installed envelope.','unverified');
      unknown(m,['schema','model','product','kind','source','sourceDate','showBody','stackGap','componentHeight','reviewed','geometryStatus','sourceFace','holePattern','notes'],key);
    }
    if(p.carrier!=null){
      const c=p.carrier,key=path+'.carrier';
      if(!obj(c)||c.schema!==1||!obj(p.platform))throw new ImportError('unsupported carrier metadata; expected schema 1 and a platform reference',key);
      number(c.stackGap,key+'.stackGap',0,100);
      for(const k of ['vertical','showClearances','enforceAntenna'])bool(c[k],key+'.'+k);
      const seen=new Set();array(c.regions,key+'.regions',32,true).forEach((g,i)=>{
        const k=key+'.regions['+i+']';if(!obj(g))throw new ImportError('expected rectangle reference',k);
        identifier(g.id,k+'.id');if(seen.has(g.id))throw new ImportError('duplicate reference-region ID',k);seen.add(g.id);
        if(!['antenna','access'].includes(g.kind))throw new ImportError('unsupported reference-region kind',k+'.kind');
        number(g.x,k+'.x',-500,500);number(g.y,k+'.y',-500,500);number(g.w,k+'.w',.1,500);number(g.h,k+'.h',.1,500);
      });
      part.carrier=clone(c);
      add('warning','carrier-reference-review',part.ref+': carrier stack, antenna and connector-access references require mechanical review.',[part.id],
        'Source stack gap '+c.stackGap+' mm is a planning reference, not the installed host height. '+c.regions.length+' owner-local 2D region(s) retained; no Z extent or plug direction is invented. Hiding source overlays does not resolve these requirements.','unverified');
      if(c.regions.some(g=>g.kind==='antenna'))add('warning',c.enforceAntenna?'carrier-antenna-review':'carrier-antenna-disabled',
        part.ref+': '+(c.enforceAntenna?'review the source antenna guard for the enclosure.':'source antenna copper guard is disabled.'),[part.id],
        'Antenna regions are 2D PCB rules, not RF enclosure certification. '+text(c.overrideReason),'unverified');
      unknown(c,['schema','revision','model','source','sourceDate','usbEdge','vertical','wireless','showClearances','enforceAntenna','overrideReason','stackGap','regions'],key);
    }
  }
  function sourceBlockReferences(d,components,add) {
    const instances=array(d.blockInstances,'blockInstances',500),library=array(d.blockLibrary,'blockLibrary',100);
    const placed=new Set([...d.parts,...array(d.traces,'traces',20000),...array(d.vias,'vias',LIMITS.pads)].filter(obj).map(o=>o.id));
    const groups=new Set(),members=new Set();
    for(let i=0;i<instances.length;i++){
      const b=instances[i],key='blockInstances['+i+']';if(!obj(b))throw new ImportError('expected block record',key);
      identifier(b.id,key+'.id');if(groups.has(b.id)||placed.has(b.id))throw new ImportError('duplicate circuit-block ID',key);groups.add(b.id);
      number(b.x,key+'.x');number(b.y,key+'.y');number(b.rotation,key+'.rotation',-36000,36000);
      const ids=array(b.members,key+'.members',1100,true);if(!ids.length)throw new ImportError('block has no members',key);
      for(const id of ids){identifier(id,key+'.members');if(!placed.has(id)||members.has(id))throw new ImportError('block member missing or assigned more than once: '+id,key);members.add(id);const c=components.find(p=>p.id===id);if(c)c.sourceBlockId=b.id;}
      array(b.ports,key+'.ports',100,true);array(b.notes,key+'.notes',30,true);
    }
    for(let i=0;i<library.length;i++){
      const b=library[i],key='blockLibrary['+i+']';
      if(!obj(b)||b.app!=='COPPERBENCH-BLOCK'||b.schema!==1)throw new ImportError('unsupported stored block template; expected COPPERBENCH-BLOCK schema 1',key);
      identifier(b.id,key+'.id');array(b.parts,key+'.parts',100,true);
    }
    if(instances.length||library.length)add('info','block-layout-baked',instances.length+' circuit block(s) and '+library.length+' stored template(s) retained.',[],
      'Placed parts/pads/holes already contain their world placement. Block x/y/rotation/flipped is not applied a second time. Unplaced library templates do not create physical components.');
    return{instances:clone(instances),libraryEntries:library.map(b=>({id:b.id,name:text(b.name),schema:b.schema}))};
  }
  // A versioned, explicit mechanical handoff. Native source semantics are frozen
  // at conversion time; a future native schema cannot be accepted by relabeling it.
  function handoff(input) {
    const d=typeof input==='string'?parse(input):parse(JSON.stringify(input));
    normalize(d); // Reject unsupported native data before making a handoff.
    if(d.app==='COPPERBENCH_MECHANICAL')return clone(d);
    return {app:'COPPERBENCH_MECHANICAL',schema:1,units:'mm',coordinateSystem:'top-left-x-right-y-down-pcb-underside-z0',
      producer:{app:'CASEBENCH',version:VERSION},source:{app:d.app,schema:d.schema,version:d.version,id:d.id,title:d.title,fingerprint:fingerprint(JSON.stringify(d))},
      requiredExtensions:[],board:clone(d.board),components:d.parts.map(p=>({id:p.id,ref:p.ref,name:p.name,value:p.value,category:p.category,placement:{x:p.x,y:p.y,rotation:p.rotation,side:p.side},envelope:p.body?{width:p.body.w,depth:p.body.h,height:p.body.z,kind:p.body.kind,evidence:'representative'}:null,pads:clone(p.pads),mountingHoles:clone(p.mountingHoles||[]),references:Object.fromEntries(['carrier','module','platform'].filter(k=>p[k]).map(k=>[k,clone(p[k])])),sourceNote:p.source||'',footprintVerified:p.verified===true})),
      holes:clone(d.holes||[]),vias:clone(d.vias||[]),cutouts:clone(d.cutouts||[]),assumptions:clone(d.assumptions||[]),evidence:clone(d.evidence||[]),
      notice:'Body envelopes are representative unless separately reviewed. Opposite-face lead/solder and connector access dimensions are not inferred.'};
  }
  function handoffNative(h) {
    if(h.schema!==1||h.units!=='mm'||h.coordinateSystem!=='top-left-x-right-y-down-pcb-underside-z0')throw new ImportError('Unsupported mechanical handoff schema, units or coordinate convention.');
    if(!Array.isArray(h.requiredExtensions)||h.requiredExtensions.length)throw new ImportError('Mechanical handoff requires unsupported extensions.');
    if(!obj(h.source)||!obj(h.board))throw new ImportError('Mechanical handoff lacks source identity or board geometry.');
    const components=array(h.components,'components',LIMITS.parts,true);
    const d={app:'COPPERBENCH',schema:5,version:text(h.source.version),id:text(h.source.id),title:text(h.source.title),units:'mm',board:clone(h.board),parts:components.map((c,i)=>{
      if(!obj(c)||!obj(c.placement))throw new ImportError('Mechanical component placement is missing.','components['+i+']');
      if(c.envelope&&c.envelope.evidence!=='representative')throw new ImportError('Handoff v1 imports representative envelopes only; retain installed measurement evidence in CASEBENCH.');
      const refs=c.references||{};if(Object.keys(refs).some(k=>!['carrier','module','platform'].includes(k)))throw new ImportError('Unsupported mechanical reference.');
      return{id:c.id,ref:c.ref,name:c.name,value:c.value,category:c.category,...clone(c.placement),body:c.envelope?{w:c.envelope.width,h:c.envelope.depth,z:c.envelope.height,kind:c.envelope.kind}:null,pads:clone(c.pads),mountingHoles:clone(c.mountingHoles||[]),...clone(refs),source:c.sourceNote,verified:c.footprintVerified===true};
    }),holes:clone(h.holes||[]),vias:clone(h.vias||[]),cutouts:clone(h.cutouts||[]),assumptions:clone(h.assumptions||[]),evidence:clone(h.evidence||[])};
    return d;
  }

  // This describes validated input, not a version-number bypass or a physical-fit badge.
  function inputContract(d) {
    return {format:'copperbench-native',label:'Copperbench native / CaseBench board export',schema:d.schema,
      producerVersion:text(d.version),units:'mm',unitsExplicit:d.units==='mm',
      testedProducer:'1.7.1',adapterVersion:VERSION};
  }
  function normalize(input) {
    const d=typeof input==='string'?parse(input):parse(JSON.stringify(input));
    if(['COPPERBENCH_MECHANICAL','CIRCUITBENCH_MECHANICAL'].includes(d?.app)){const a=normalize(handoffNative(d));a.source={...a.source,app:d.app,schema:d.schema,nativeSchema:d.source.schema};if(d.app==='CIRCUITBENCH_MECHANICAL'){for(const h of a.bores){const owner=d.mountOwners?.[h.id];if(owner){if(!a.components.some(c=>c.id===owner))throw new ImportError('Unknown mounting-hole component.');h.ownerId=owner;}}a.findings=a.findings.filter(f=>!['units','handoff-contract'].includes(f.code));}a.inputContract={format:d.app==='CIRCUITBENCH_MECHANICAL'?'circuitbench-mechanical':'copperbench-mechanical',label:d.app==='CIRCUITBENCH_MECHANICAL'?'CIRCUITBENCH mechanical handoff':'Mechanical handoff',schema:d.schema,producerVersion:text(d.source.version),nativeSchema:d.source.schema,units:'mm',unitsExplicit:true,adapterVersion:VERSION};a.findings.push({id:'handoff-contract',severity:'info',code:'mechanical-handoff',message:'Explicit mechanical handoff v1; native project schema is provenance, not the input contract.',objects:[],confidence:'contract',evidence:d.coordinateSystem});return a;}
    if(d?.kind==='CASEBENCH-IMPORT-TEST-EXPECTATIONS')throw new ImportError('This is companion expected-geometry test data, not a board. Open copperbench-casebench-example.json or the Copperbench CaseBench board export instead.');
    if(!obj(d)||d.app!=='COPPERBENCH')throw new ImportError('Use a native COPPERBENCH JSON project, not Gerbers, a BOM, or a mesh.');
    if(!SUPPORTED_SCHEMAS.includes(d.schema))throw new ImportError('Unsupported Copperbench schema '+String(d.schema)+'. CASEBENCH '+VERSION+' accepts schemas '+SUPPORTED_SCHEMAS.join(', ')+'. Newer schemas are not silently downgraded.');
    const findings=[],add=(severity,code,message,ids=[],evidence='',confidence='certain')=>findings.push({id:code+':'+findings.length,severity,code,message,objects:ids,evidence,confidence});
    if(d.units!==undefined&&d.units!=='mm')throw new ImportError('Only millimetre Copperbench inputs are supported. Conflicting units are not automatically scaled.','units');
    if(d.schema<3)add('info','legacy-schema','Legacy schema '+d.schema+' imported through the same bounded mechanical adapter.',[],'Mechanical fields validated independently.');
    add('info','units','Millimetres and the Copperbench top-view coordinate convention are applied.',[],d.units?'Explicit source units: mm':'No units field; Copperbench documented contract: mm.');
    if(!obj(d.board))throw new ImportError('board object is missing');
    const b=d.board,w=number(b.width,'board.width',.1,2000),h=number(b.height,'board.height',.1,2000),t=number(b.thickness,'board.thickness',.01,100);
    const shape=b.shape;if(!['rect','rectangle','rounded','circle','polygon'].includes(shape))throw new ImportError('Unsupported outline shape '+shape+'. No rectangle substitution.','board.shape');
    let sourceOutline,radius=0;
    if(shape==='polygon')sourceOutline=polygon(b.points,'board.points');
    else if(shape==='circle')sourceOutline=Array.from({length:128},(_,i)=>({x:q(w/2+Math.cos(i/128*2*Math.PI)*w/2),y:q(h/2+Math.sin(i/128*2*Math.PI)*h/2)}));
    else {radius=shape==='rounded'?number(b.radius,'board.radius',0,Math.min(w,h)/2):0;sourceOutline=roundRect(w,h,radius);}
    const outline=ccw(sourceOutline.map(p=>({x:p.x,y:-p.y}))),board={id:'board',width:w,height:h,thickness:t,shape,radius,sourcePoints:clone(b.points||[]),outline,sourceOutline:clone(sourceOutline),bounds:bounds(outline.flatMap(p=>[{...p,z:0},{...p,z:t}])),geometryStatus:'imported-nominal'};
    if(shape==='polygon'&&(Math.abs(size(board.bounds).x-w)>.001||Math.abs(size(board.bounds).y-h)>.001))add('warning','outline-dimensions','The polygon extent differs from the width/height fields. The polygon controls geometry.',['board'],'Both original dimensions and polygon points are preserved.');
    const ids=new Set(['board']);function unique(id,path){id=identifier(id,path);if(ids.has(id))throw new ImportError('duplicate object ID '+id,path);ids.add(id);return id;}
    const components=[],pads=[],bores=[],cutouts=[];
    function bore(h,path,id,role,owner=null,plated=false){if(!obj(h))throw new ImportError('expected hole object',path);let x=number(h.x,path+'.x'),y=number(h.y,path+'.y'),diameter=number(h.drill,path+'.drill',.001,500),slot=number(h.slot??0,path+'.slot',0,500),rot=number(h.rotation??0,path+'.rotation',-360000,360000);const point=owner?sourceWorld(owner,{x,y}):{x,y};let rotation=owner?-(owner.rotation+rot*(owner.side==='bottom'?-1:1)):-rot;const out={id,sourceId:h.id??null,ownerId:owner?.id??null,role,plated,x:point.x,y:-point.y,z:0,sourceX:point.x,sourceY:point.y,diameter,slot,overallLength:diameter+slot,rotation,sourcePath:path};out.perimeter=ccw(capsule(out));bores.push(out);return out;}
    const sourceParts=array(d.parts,'parts',LIMITS.parts,true);
    for(let i=0;i<sourceParts.length;i++){
      const p=sourceParts[i],path='parts['+i+']';if(!obj(p))throw new ImportError('expected component object',path);const id=unique(p.id,path+'.id'),x=number(p.x,path+'.x'),y=number(p.y,path+'.y'),rotation=number(p.rotation,path+'.rotation',-360000,360000);
      if(!['top','bottom'].includes(p.side))throw new ImportError('explicit top or bottom face is required',path+'.side');
      const ref=text(p.ref,id),part={id,ref,name:text(p.name,'Unnamed component'),value:text(p.value),kind:text(p.body?.kind,'unknown'),category:text(p.category),side:p.side,position:{x,y:-y,z:p.side==='bottom'?0:t},sourcePlacement:{x,y,rotation,side:p.side},rotation:-rotation,mirrored:p.side==='bottom',footprintVerified:p.verified===true,source:text(p.source),geometryStatus:'representative-unverified',sourcePath:path,body:null,vertices:[],padIds:[],mountingHoleIds:[],leadProtrusion:null,accessEnvelope:null,platform:obj(p.platform)?clone(p.platform):null};
      const columns=[world(p,{x:1,y:0}),world(p,{x:0,y:1})];part.transform={origin:clone(part.position),localX:{x:q(columns[0].x-x),y:q(columns[0].y+y),z:0},localY:{x:q(columns[1].x-x),y:q(columns[1].y+y),z:0},outwardZ:p.side==='bottom'?-1:1};
      if(obj(p.body)&&['w','h','z'].every(k=>p.body[k]!==undefined&&p.body[k]!==null)){
        const bw=number(p.body.w,path+'.body.w',.001,2000),bh=number(p.body.h,path+'.body.h',.001,2000),bz=number(p.body.z,path+'.body.z',0,2000);
        const zMin=p.side==='bottom'?-bz:t,zMax=p.side==='bottom'?0:t+bz;part.body={width:bw,depth:bh,height:bz,zMin,zMax,source:clone(p.body)};
        const corners=[{x:-bw/2,y:-bh/2},{x:bw/2,y:-bh/2},{x:bw/2,y:bh/2},{x:-bw/2,y:bh/2}];part.vertices=[...corners.map(a=>world(p,a,zMin)),...corners.map(a=>world(p,a,zMax))];part.bounds=bounds(part.vertices);
        add('warning','body-review',ref+': stored body dimensions need mechanical review.',[id],bw+' × '+bh+' × '+bz+' mm; footprint verification does not verify installed height.','unverified');
        if(bz===0)add('warning','zero-height',ref+': zero stored body height does not establish zero installed height.',[id],path+'.body.z = 0','unverified');
      }else add('error','missing-body',ref+': incomplete body dimensions. No zero-height envelope was invented.',[id],path+'.body needs w, h and z.','certain');
      componentReferences(p,path,part,add);
      if(obj(p.body))for(const key of Object.keys(p.body))if(!['w','h','z','kind'].includes(key))add('warning','unknown-body-field',ref+': uninterpreted body field '+key,[id],'Preserved, not applied to the mechanical envelope.');
      const knownPartFields=new Set(['id','name','category','body','pads','ref','value','source','verified','libraryId','x','y','rotation','side','locked','label','appearance','polaritySilk','mountingHoles','platform','defaultSide','catalog','internalGroups','carrier','module']);for(const key of Object.keys(p))if(!knownPartFields.has(key))add('warning','unknown-part-field',ref+': uninterpreted component field '+key,[id],'Preserved, not applied to mechanical geometry.');
      const rawPads=array(p.pads,path+'.pads',LIMITS.pads,true);
      for(let j=0;j<rawPads.length;j++){
        const a=rawPads[j],pp=path+'.pads['+j+']';if(!obj(a))throw new ImportError('expected pad object',pp);number(a.x,pp+'.x');number(a.y,pp+'.y');const width=number(a.w,pp+'.w',.001,500),height=number(a.h,pp+'.h',.001,500),drill=number(a.drill??0,pp+'.drill',0,500),slot=number(a.slot??0,pp+'.slot',0,500),ar=number(a.rotation??0,pp+'.rotation',-360000,360000),pid=id+':pad:'+j;if(ids.has(pid))throw new ImportError('duplicate generated pad ID',pp);ids.add(pid);
        const loc=sourceWorld(p,a),pad={id:pid,ownerId:id,ref,number:String(a.number??j+1),x:loc.x,y:-loc.y,width,height,drill,slot,shape:text(a.shape,'rect'),rotation:-(rotation+ar*(p.side==='bottom'?-1:1)),side:drill>0?'both':p.side,sourceLayers:a.layers??null,sourcePath:pp};pads.push(pad);part.padIds.push(pid);
        if(drill>0)bore({...a,drill,slot,rotation:ar},pp,unique(pid+':drill',pp),'pin-drill',p,true);
        if(!['rect','circle','oval'].includes(pad.shape))add('warning','pad-shape-uninterpreted',ref+': unsupported pad shape is shown as a conservative rectangle.',[id],pad.shape+'; original pad retained, XY rectangle bound only.');
      }
      if(rawPads.some(p=>p.drill>0))add('warning','lead-protrusion',ref+': lead and solder protrusion on the opposite face is not supplied.',[id],'Unspecified protrusion remains null; it is not included in known-body height.','unverified');
      if(p.side==='bottom'&&rawPads.some(a=>a.layers==='top'&&!a.drill))add('info','bottom-local-pads',ref+': bottom placement follows the component face, not the local pad layer string.',[id],'Copperbench C.pads resolves undrilled pads to part.side; local X is mirrored before rotation.');
      const mounts=array(p.mountingHoles,path+'.mountingHoles',64);
      mounts.forEach((m,j)=>{if(!obj(m))throw new ImportError('expected linked mounting hole object',path);if(m.slot)throw new ImportError('nonzero platform mounting slots are not supported by the observed source contract',path+'.mountingHoles['+j+']');const mid=id+':mount'+j;if(ids.has(mid))throw new ImportError('duplicate linked mount ID');ids.add(mid);let mount=bore({...m,slot:0,rotation:0},path+'.mountingHoles['+j+']',mid,'mounting-candidate',p,false);mount.rotation=0;part.mountingHoleIds.push(mid);});
      if(p.platform||part.kind==='platform')add('error','platform-incomplete',ref+': host illustration is not a complete host-board clearance model.',[id],'Mating pads and enabled linked mounting holes are imported; full host geometry, stacking height and connector access are unresolved.','certain');
      if(['Connectors','Platforms','Modules'].includes(part.category)||['terminal','header','platform','module'].includes(part.kind))add('warning','connector-access',ref+': plug, cable and tool access are unspecified.',[id],'No automatic opening direction is inferred from category, value or rotation.','unverified');
      components.push(part);
      if(pads.length>LIMITS.pads)throw new ImportError('Total pad count exceeds '+LIMITS.pads+'.');
    }
    const sourceBlocks=sourceBlockReferences(d,components,add);
    array(d.holes,'holes',LIMITS.holes).forEach((h,i)=>{const path='holes['+i+']';if(!obj(h))throw new ImportError('expected hole object',path);if(typeof h.plated!=='boolean')add('warning','hole-plating-unknown','A board hole does not declare plating and is not proposed as a mount.',[h.id],path+'.plated missing','unverified');bore(h,path,unique(h.id,path+'.id'),h.plated===false?'mounting-candidate':'board-drill',null,typeof h.plated==='boolean'?h.plated:null);});
    array(d.vias,'vias',LIMITS.pads).forEach((v,i)=>{if(!obj(v))throw new ImportError('expected via object','vias['+i+']');bore({...v,slot:0,rotation:0},'vias['+i+']',unique(v.id,'vias['+i+'].id'),'via',null,true);});
    array(d.cutouts,'cutouts',LIMITS.cutouts).forEach((c,i)=>{if(!obj(c))throw new ImportError('expected cutout object','cutouts['+i+']');let id=unique(c.id,'cutouts['+i+'].id'),sourcePoints=polygon(c.points,'cutouts['+i+'].points'),points=ccw(sourcePoints.map(p=>({x:p.x,y:-p.y})));if(points.some(p=>!inside(p,outline))||points.some((p,j)=>outline.some((a,k)=>segmentsIntersect(p,points[(j+1)%points.length],a,outline[(k+1)%outline.length]))))throw new ImportError('cutout must be wholly inside the board, without touching the outline','cutouts['+i+']');for(const prev of cutouts){if(inside(points[0],prev.points)||inside(prev.points[0],points)||points.some((p,j)=>prev.points.some((a,k)=>segmentsIntersect(p,points[(j+1)%points.length],a,prev.points[(k+1)%prev.points.length]))))throw new ImportError('overlapping or nested cutouts require a future union adapter','cutouts['+i+']');}cutouts.push({id,points,sourcePoints,sourcePath:'cutouts['+i+']'});});
    for(const hole of bores){if(hole.perimeter.some(p=>!inside(p,outline))||cutouts.some(c=>inside({x:hole.x,y:hole.y},c.points)))add('warning','bore-boundary','A drill or slot reaches an outline/cutout boundary; review the source geometry.',[hole.id],hole.sourcePath,'certain');}
    const allPoints=outline.flatMap(p=>[{...p,z:0},{...p,z:t}]);for(const p of components)allPoints.push(...p.vertices);
    // Pad/lead cross-sections may extend beyond representative bodies. Include their XY extent,
    // but never invent their missing vertical protrusions.
    for(const p of pads){const r=p.rotation*Math.PI/180,ex=p.shape==='circle'?Math.max(p.width,p.height)/2:(Math.abs(Math.cos(r))*p.width+Math.abs(Math.sin(r))*p.height)/2,ey=p.shape==='circle'?Math.max(p.width,p.height)/2:(Math.abs(Math.sin(r))*p.width+Math.abs(Math.cos(r))*p.height)/2;allPoints.push({x:p.x-ex,y:p.y-ey,z:0},{x:p.x+ex,y:p.y+ey,z:t});}
    const knownBounds=bounds(allPoints),topHeight=components.filter(p=>p.side==='top'&&p.body).reduce((m,p)=>Math.max(m,p.body.height),0),bottomHeight=components.filter(p=>p.side==='bottom'&&p.body).reduce((m,p)=>Math.max(m,p.body.height),0);
    const reviewedSourceKeys=new Set(['app','schema','version','id','title','created','updated','units','board','parts','nets','traces','vias','holes','cutouts','keepouts','zones','art','assets','profile','settings','assumptions','evidence','baseline','platformTemplate','blockInstances','blockLibrary','customFootprints']);
    for(const key of Object.keys(d))if(!reviewedSourceKeys.has(key))add('warning','unknown-field','Uninterpreted source field: '+key,[],'Preserved in original snapshot, not applied to mechanical geometry.');
    for(const key of Object.keys(b))if(!['width','height','thickness','shape','radius','points','color'].includes(key))add('warning','unknown-board-field','Uninterpreted board field: '+key,['board'],'Preserved, not applied to geometry.');
    if((d.keepouts||[]).length)add('warning','keepouts-not-mechanical','Source keepouts are preserved, but not promoted to mechanical clearances.',[],'Electrical keepout semantics are not assumed to specify 3D space.');
    add('info','electrical-retained','Electrical layout, artwork, assets and manufacturing profiles are retained in the source snapshot, not used as printer settings.',[],'No routing-complete requirement. No source URLs or images are fetched.');
    if(!bores.some(x=>x.role==='mounting-candidate'))add('warning','no-mount-candidates','No explicit unplated board holes or linked mounts were found.',[],'Vias and component drills are not mounting candidates.');
    const duplicateRefs=components.filter((p,i,a)=>a.findIndex(v=>v.ref===p.ref)!==i);if(duplicateRefs.length)add('warning','duplicate-reference','Repeated component references found; stable object IDs remain distinct.',duplicateRefs.map(p=>p.id),'Review reference labels before attaching future enclosure features.');
    const summary={physicalBores:bores.length,platedBores:bores.filter(h=>h.plated===true).length,slottedBores:bores.filter(h=>h.slot>0).length,linkedMountingCandidates:bores.filter(h=>h.role==='mounting-candidate'&&h.ownerId).length,standaloneMountingCandidates:bores.filter(h=>h.role==='mounting-candidate'&&!h.ownerId).length,components:components.length,topComponents:components.filter(p=>p.side==='top').length,bottomComponents:components.filter(p=>p.side==='bottom').length,mountingCandidates:bores.filter(h=>h.role==='mounting-candidate').length,pinDrills:bores.filter(h=>h.role==='pin-drill').length,vias:bores.filter(h=>h.role==='via').length,cutouts:cutouts.length,knownTopBodyHeight:topHeight,knownBottomBodyHeight:bottomHeight,knownBounds,knownSize:size(knownBounds),unknownBodyCount:components.filter(p=>!p.body).length,protrusionComplete:false,fitVerified:false};
    return{app:'CASEBENCH-MECHANICAL',schema:CONTRACT,adapterVersion:VERSION,inputContract:inputContract(d),units:'mm',coordinates:{origin:'Copperbench top-left XY datum, at PCB underside',x:'right in source top view',y:'up (negative source Y)',z:'out of top face',pcbZ:[0,t],sourceRotation:'degrees clockwise in Y-down; bottom local X mirrored first',quantization:0.0001},source:{app:d.app,schema:d.schema,version:text(d.version),id:text(d.id),title:text(d.title,'Untitled board'),created:d.created??null,updated:d.updated??null},board,components,pads,bores,cutouts,summary,findings,sourceBlocks,sourceAssumptions:clone(d.assumptions||[]),sourceEvidence:clone(d.evidence||[])};
  }
  function createProject(sourceText,filename='Copperbench.json',isExample=false){const a=normalize(sourceText);return{app:'CASEBENCH',schema:1,version:VERSION,title:a.source.title,created:new Date().toISOString(),updated:new Date().toISOString(),source:{filename,text:sourceText,fingerprint:{algorithm:'FNV-1a-32 UTF-16 (change hint, not a security digest)',value:fingerprint(sourceText)},isExample},review:{notes:'',objects:{},mounting:{},baseline:null},view:{mode:'easy',theme:'light',preset:'iso',top:true,bottom:true,pads:true,holes:true,labels:true,ghost:false,envelopes:false}};}
  function validateProject(input){if(!obj(input)||input.app!=='CASEBENCH'||input.schema!==1)throw new ImportError('Unsupported CASEBENCH project schema.');if(!obj(input.source)||typeof input.source.text!=='string')throw new ImportError('CASEBENCH project is missing its original Copperbench snapshot.');normalize(input.source.text);let p=createProject(input.source.text,text(input.source.filename,'Copperbench.json'),input.source.isExample===true);p.title=text(input.title,p.title);p.created=text(input.created,p.created);p.updated=text(input.updated,p.updated);const a=normalize(p.source.text),valid=new Set(['board',...a.components.map(x=>x.id),...a.bores.map(x=>x.id)]);if(obj(input.review)){p.review.notes=text(input.review.notes).slice(0,20000);for(const k of ['objects','mounting'])if(obj(input.review[k]))for(const [id,v]of Object.entries(input.review[k])){if(!valid.has(id))continue;if(k==='objects')p.review.objects[id]=text(v).slice(0,10000);else if(a.bores.some(h=>h.id===id&&h.role==='mounting-candidate')&&['candidate','use','exclude'].includes(v))p.review.mounting[id]=v;}if(input.review.baseline!==undefined&&input.review.baseline!==null){const base=input.review.baseline;if(obj(base)&&typeof base.sourceText==='string'){normalize(base.sourceText);p.review.baseline={sourceText:base.sourceText,date:text(base.date)};}}}
      if(obj(input.view)){for(const key of ['top','bottom','pads','holes','labels','ghost','envelopes'])if(typeof input.view[key]==='boolean')p.view[key]=input.view[key];if(['easy','advanced'].includes(input.view.mode))p.view.mode=input.view.mode;if(['light','dark','contrast'].includes(input.view.theme))p.view.theme=input.view.theme;if(['iso','top','bottom','front','right','plan'].includes(input.view.preset))p.view.preset=input.view.preset;}
      return p;
  }
  function compare(a,b){const changes=[];for(const group of ['components','pads','bores','cutouts']){const aa=new Map(a[group].map(p=>[p.id,p])),bb=new Map(b[group].map(p=>[p.id,p]));for(const [id,x]of aa){if(!bb.has(id))changes.push({kind:'added',group,id});else if(JSON.stringify(x)!==JSON.stringify(bb.get(id)))changes.push({kind:'changed',group,id});}for(const id of bb.keys())if(!aa.has(id))changes.push({kind:'removed',group,id});}if(JSON.stringify(a.board)!==JSON.stringify(b.board))changes.push({kind:'changed',group:'board',id:'board'});return changes;}
  function normalizedExport(project){let a=normalize(project.source.text);return{...a,review:clone(project.review),sourceSnapshot:clone(project.source),notice:'Known imported geometry only. Not a printable enclosure or a validated assembly. Unknown lead, solder, plug and cable projections remain unresolved.'};}
  return{handoff,VERSION,CONTRACT,SUPPORTED_SCHEMAS,LIMITS,ImportError,parse,normalize,createProject,validateProject,normalizedExport,compare,sourceWorld,world,bounds,size,area,inside,capsule,ccw,clone,q,fingerprint};
});
