/* CIRCUITBENCH enclosure solid generation / STL. GPL-3.0-only. */
(function(root){'use strict';
function build(plan,api){
 const M=api.Manifold,e=plan.config,w=plan.width,d=plan.depth,z=plan.baseTop,held=[];
 const hold=a=>{held.push(a);return a;},move=(a,x,y,z)=>hold(a.translate([x,y,z])),box=(x,y,z,dx,dy,dz)=>move(hold(M.cube([dx,dy,dz])),x,y,z),subtract=(a,b)=>hold(a.subtract(b)),unite=a=>hold(M.union(a));
 function cylinder(x,y,z,r,h){return move(hold(M.cylinder(h,r,r,64)),x,y,z);}
 function profile(o){let pts=[];if(o.shape==='rect')return [[-o.width/2,-o.height/2],[o.width/2,-o.height/2],[o.width/2,o.height/2],[-o.width/2,o.height/2]];
  if(o.shape==='circle'){for(let i=0;i<64;i++)pts.push([o.width/2*Math.cos(i*Math.PI/32),o.width/2*Math.sin(i*Math.PI/32)]);return pts;}
  const horizontal=o.width>=o.height,r=Math.min(o.width,o.height)/2,span=(Math.max(o.width,o.height)-2*r)/2;
  for(let i=0;i<=32;i++){let a=-Math.PI/2+i*Math.PI/32;pts.push([span+r*Math.cos(a),r*Math.sin(a)]);}for(let i=0;i<=32;i++){let a=Math.PI/2+i*Math.PI/32;pts.push([-span+r*Math.cos(a),r*Math.sin(a)]);}return horizontal?pts:pts.map(([x,y])=>[-y,x]);
 }
 function cutter(o){let flat=o.face==='lid'||o.face==='floor',length=flat?(o.face==='lid'?e.lid+e.lipDepth+2:e.floor+2):e.wall+2,part=hold(M.extrude([profile(o)],length));
  if(flat)return move(part,o.u,o.face==='lid'?d-o.v:o.v,-1);
  if(o.face==='front'||o.face==='back')return move(hold(part.rotate([90,0,0])),o.u,o.face==='front'?e.wall+1:d+1,e.floor+o.v);
  return move(hold(part.rotate([90,0,90])),o.face==='left'?-1:w-e.wall-1,o.u,e.floor+o.v);
 }
 function mesh(s){let status=s.status();if(status!=='NoError'||s.isEmpty())throw Error('Enclosure geometry could not be built: '+status);let parts=s.decompose();parts.forEach(hold);let m=s.getMesh(),positions=new Float32Array(m.numVert*3);for(let i=0;i<m.numVert;i++)positions.set(m.vertProperties.subarray(i*m.numProp,i*m.numProp+3),i*3);return {positions,indices:new Uint32Array(m.triVerts),volume:s.volume(),parts:parts.length};}
 try{
  let base=subtract(box(0,0,0,w,d,z),box(e.wall,e.wall,e.floor,w-2*e.wall,d-2*e.wall,z+1));
  if(plan.mounts.length)base=unite([base,...plan.mounts.map(m=>cylinder(m.x,m.y,e.floor-.01,m.diameter/2,e.standoffHeight+.01))]);
  const bores=[];if(e.boreMode!=='solid')for(let m of plan.mounts)if(m.bore>0){let top=e.floor+e.standoffHeight,bottom=e.boreMode==='through'?-.5:Math.max(e.floor+.4,top-e.boreDepth);if(bottom<top)bores.push(cylinder(m.x,m.y,bottom,m.bore/2,top-bottom+1));}
  let baseCuts=e.openings.filter(o=>o.face!=='lid').map(cutter).concat(bores);if(baseCuts.length)base=subtract(base,unite(baseCuts));
  let lid=box(0,0,0,w,d,e.lid);if(e.lipDepth>0){let inset=e.wall+e.fit,lip=subtract(box(inset,inset,e.lid-.01,w-2*inset,d-2*inset,e.lipDepth+.01),box(inset+e.lipWall,inset+e.lipWall,e.lid-.1,w-2*(inset+e.lipWall),d-2*(inset+e.lipWall),e.lipDepth+1));lid=unite([lid,lip]);}
  let lidCuts=e.openings.filter(o=>o.face==='lid').map(cutter);if(lidCuts.length)lid=subtract(lid,unite(lidCuts));
  return {base:mesh(base),lid:mesh(lid)};
 }finally{for(let a of held.reverse())a.delete();}
}
function stl(mesh){
 const n=mesh.indices.length/3,buffer=new ArrayBuffer(84+n*50),v=new DataView(buffer),header=new TextEncoder().encode('CIRCUITBENCH enclosure | millimeters | '+n+' triangles');new Uint8Array(buffer).set(header.subarray(0,80));v.setUint32(80,n,true);
 const point=i=>Array.from(mesh.positions.subarray(i*3,i*3+3));
 for(let i=0;i<n;i++){let a=point(mesh.indices[i*3]),b=point(mesh.indices[i*3+1]),c=point(mesh.indices[i*3+2]),u=b.map((x,j)=>x-a[j]),w=c.map((x,j)=>x-a[j]),normal=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],length=Math.hypot(...normal),values=[...normal.map(x=>length?x/length:0),...a,...b,...c];values.forEach((x,j)=>v.setFloat32(84+i*50+j*4,x,true));}
 return new Uint8Array(buffer);
}
const result={build,stl};if(typeof module!=='undefined')module.exports=result;else root.CBEnclosureSolid=result;
})(typeof globalThis!=='undefined'?globalThis:this);
