/* CASEBENCH solid engine. BSP Boolean algorithm adapted from csg.js.
 * Copyright (c) 2011 Evan Wallace, MIT. Adaptation (c) 2026 Green Shoe Garage, MIT.
 * Adds bounded operations, affine frames, deterministic conforming mesh output,
 * mesh topology audit and portable STL read-back. No network or eval is used.
 */
/* MIT license for the adapted BSP algorithm, Copyright (c) 2011 Evan Wallace.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.CaseSolid=a;})(globalThis,function(){'use strict';
const EPS=1e-5, SNAP=1e5, MAX_POLYGONS=70000;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=a=>Math.hypot(...a),unit=a=>mul(a,1/(len(a)||1));
const key=p=>p.map(x=>Math.round(x*SNAP)).join(','),snap=p=>p.map(x=>Math.round(x*SNAP)/SNAP);
class Poly{
 constructor(v,tag=''){this.v=v;this.tag=tag;this.n=null;for(let i=2;i<v.length;i++){let n=cross(sub(v[i-1],v[0]),sub(v[i],v[0]));if(len(n)>1e-10){this.n=unit(n);break;}}if(!this.n)throw Error('Degenerate polygon');this.w=dot(this.n,v[0]);}
 clone(){return new Poly(this.v.map(v=>v.slice()),this.tag);}flip(){this.v.reverse();this.n=mul(this.n,-1);this.w=-this.w;}
}
function clean(v){let o=[];for(const p of v)if(!o.length||len(sub(o.at(-1),p))>EPS/4)o.push(p);if(o.length>1&&len(sub(o[0],o.at(-1)))<EPS/4)o.pop();return o;}
function safePoly(v,tag){v=clean(v);if(v.length<3)return null;try{return new Poly(v,tag);}catch{return null;}}
function split(plane,p,cf,cb,f,b){let type=0,types=p.v.map(v=>{let t=dot(plane.n,v)-plane.w,k=t<-EPS?2:t>EPS?1:0;type|=k;return k;});if(!type){(dot(plane.n,p.n)>0?cf:cb).push(p);return;}if(type===1){f.push(p);return;}if(type===2){b.push(p);return;}let fv=[],bv=[];for(let i=0;i<p.v.length;i++){let j=(i+1)%p.v.length,ti=types[i],tj=types[j],vi=p.v[i],vj=p.v[j];if(ti!==2)fv.push(vi);if(ti!==1)bv.push(vi);if((ti|tj)===3){let t=(plane.w-dot(plane.n,vi))/dot(plane.n,sub(vj,vi)),v=add(vi,mul(sub(vj,vi),t));fv.push(v);bv.push(v);}}let a=safePoly(fv,p.tag),c=safePoly(bv,p.tag);if(a)f.push(a);if(c)b.push(c);}
class Node{
 constructor(polys=[],depth=0){this.plane=null;this.polys=[];this.front=null;this.back=null;this.depth=depth;if(polys.length)this.build(polys);}
 invert(){this.polys.forEach(p=>p.flip());if(this.plane){this.plane.n=mul(this.plane.n,-1);this.plane.w=-this.plane.w;}if(this.front)this.front.invert();if(this.back)this.back.invert();[this.front,this.back]=[this.back,this.front];}
 clip(polys){if(!this.plane)return polys.slice();let f=[],b=[];for(const p of polys)split(this.plane,p,f,b,f,b);if(this.front)f=this.front.clip(f);if(this.back)b=this.back.clip(b);else b=[];return f.concat(b);}
 clipTo(other){this.polys=other.clip(this.polys);if(this.front)this.front.clipTo(other);if(this.back)this.back.clipTo(other);}
 all(){return this.polys.concat(this.front?this.front.all():[],this.back?this.back.all():[]);}
 build(polys){if(!polys.length)return;if(this.depth>700)throw Error('Solid complexity exceeds BSP depth limit. Suppress or simplify the last feature.');if(polys.length>MAX_POLYGONS)throw Error('Solid polygon limit exceeded.');if(!this.plane){
 // Sample a balanced splitter rather than following input order into deep trees.
 // No geometry is rounded or repaired by this choice.
 let best=polys[0],cost=Infinity;
 if(polys.length>48){for(let c=0;c<Math.min(9,polys.length);c++){
  let candidate=polys[Math.floor(c*(polys.length-1)/8)],front=0,back=0,splitCount=0;
  const step=Math.max(1,Math.floor(polys.length/96));
  for(let j=0;j<polys.length;j+=step){let pos=false,neg=false;for(const v of polys[j].v){let t=dot(candidate.n,v)-candidate.w;if(t>EPS)pos=true;if(t<-EPS)neg=true;}if(pos&&neg)splitCount++;else if(pos)front++;else if(neg)back++;}
  let score=splitCount*4+Math.abs(front-back);if(score<cost){cost=score;best=candidate;}
 }}this.plane={n:best.n.slice(),w:best.w};}let f=[],b=[];for(const p of polys)split(this.plane,p,this.polys,this.polys,f,b);if(f.length){if(!this.front)this.front=new Node([],this.depth+1);this.front.build(f);}if(b.length){if(!this.back)this.back=new Node([],this.depth+1);this.back.build(b);}}
}
function bounds(polys){let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const p of polys)for(const v of p.v)for(let i=0;i<3;i++){min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i]);}return{min,max};}
function overlap(a,b,t=EPS){return a.min.every((v,i)=>v<=b.max[i]+t&&a.max[i]+t>=b.min[i]);}
class Solid{
 constructor(polys=[]){this.polys=polys;this._b=null;}get bounds(){return this._b||(this._b=bounds(this.polys));}
 clone(){return new Solid(this.polys.map(p=>p.clone()));}
 transform(frame){return new Solid(this.polys.map(p=>new Poly(p.v.map(v=>frame(v)),p.tag)));}
 translate(v){return this.transform(p=>add(p,v));}
 rotateZ(deg){let a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return this.transform(p=>[c*p[0]-s*p[1],s*p[0]+c*p[1],p[2]]);}
 union(o){if(!this.polys.length)return o.clone();if(!o.polys.length)return this.clone();if(!overlap(this.bounds,o.bounds))return new Solid(this.polys.concat(o.polys));let a=new Node(this.clone().polys),b=new Node(o.clone().polys);a.clipTo(b);b.clipTo(a);b.invert();b.clipTo(a);b.invert();a.build(b.all());return compact(new Solid(a.all()));}
 subtract(o){if(!this.polys.length||!o.polys.length||!overlap(this.bounds,o.bounds))return this.clone();let a=new Node(this.clone().polys),b=new Node(o.clone().polys);a.invert();a.clipTo(b);b.clipTo(a);b.invert();b.clipTo(a);b.invert();a.build(b.all());a.invert();return compact(new Solid(a.all()));}
 intersect(o){if(!this.polys.length||!o.polys.length||!overlap(this.bounds,o.bounds))return new Solid();let a=new Node(this.clone().polys),b=new Node(o.clone().polys);a.invert();b.clipTo(a);b.invert();a.clipTo(b);b.clipTo(a);a.build(b.all());a.invert();return compact(new Solid(a.all()));}
 volume(){let out=0;for(const p of this.polys)for(let i=2;i<p.v.length;i++)out+=dot(p.v[0],cross(p.v[i-1],p.v[i]))/6;return out;}
}
function box(x,y,z,w,d,h,tag=''){if(w<=0||d<=0||h<=0)return new Solid();const v=[[x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]];return new Solid([[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].map(f=>new Poly(f.map(i=>v[i]),tag)));}
function prism(points,z0,z1,tag=''){if(z1<=z0||points.length<3)return new Solid();let pts=points.map(p=>Array.isArray(p)?p.slice(0,2):[p.x,p.y]);pts=pts.filter((p,i)=>!i||Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1])>1e-9);if(pts.length>2&&Math.hypot(pts[0][0]-pts.at(-1)[0],pts[0][1]-pts.at(-1)[1])<1e-9)pts.pop();let area=pts.reduce((s,p,i)=>{let q=pts[(i+1)%pts.length];return s+p[0]*q[1]-p[1]*q[0];},0);if(Math.abs(area)<1e-10)throw Error('Prism outline has zero area.');if(area<0)pts.reverse();const turn=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let caps=[];if(pts.every((p,i)=>turn(p,pts[(i+1)%pts.length],pts[(i+2)%pts.length])>=-1e-10))caps=[pts.map((_,i)=>i)];else{let ids=pts.map((_,i)=>i),guard=0;while(ids.length>3){if(guard++>points.length*points.length)throw Error('Unable to tessellate concave prism outline.');let ear=-1;for(let i=0;i<ids.length;i++){const ia=ids[(i+ids.length-1)%ids.length],ib=ids[i],ic=ids[(i+1)%ids.length],a=pts[ia],b=pts[ib],c=pts[ic];if(turn(a,b,c)<=1e-10)continue;if(ids.some(j=>j!==ia&&j!==ib&&j!==ic&&turn(a,b,pts[j])>=-1e-10&&turn(b,c,pts[j])>=-1e-10&&turn(c,a,pts[j])>=-1e-10))continue;caps.push([ia,ib,ic]);ear=i;break;}if(ear<0){let i=ids.findIndex((j,k)=>Math.abs(turn(pts[ids[(k+ids.length-1)%ids.length]],pts[j],pts[ids[(k+1)%ids.length]]))<1e-10);if(i<0)throw Error('Prism outline is not a supported simple polygon.');ids.splice(i,1);}else ids.splice(ear,1);}caps.push(ids);}
 let bot=pts.map(p=>[...p,z0]),top=pts.map(p=>[...p,z1]),out=[];for(const cap of caps)out.push(new Poly(cap.map(i=>bot[i]).reverse(),tag),new Poly(cap.map(i=>top[i]),tag));for(let i=0;i<pts.length;i++){let j=(i+1)%pts.length;out.push(new Poly([bot[i],bot[j],top[j],top[i]],tag));}return new Solid(out);}

function circle(x,y,r,n=40){return Array.from({length:n},(_,i)=>[x+r*Math.cos(i*2*Math.PI/n),y+r*Math.sin(i*2*Math.PI/n)]);}
function cylinder(x,y,z,r,h,n=40,tag=''){return prism(circle(x,y,r,n),z,z+h,tag);}
function rounded(x,y,w,h,r,n=10){r=Math.max(0,Math.min(r,w/2,h/2));if(r<EPS)return[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];let o=[];for(const [cx,cy,start]of[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let i=0;i<=n;i++){let a=(start+i*90/n)*Math.PI/180;let p=[cx+r*Math.cos(a),cy+r*Math.sin(a)];if(!o.length||len(sub(p,o.at(-1)))>EPS)o.push(p);}if(len(sub(o[0],o.at(-1)))<EPS)o.pop();return o;}
function unionAll(solids){let a=solids.filter(s=>s.polys.length);while(a.length>1){let b=[];for(let i=0;i<a.length;i+=2)b.push(i+1<a.length?a[i].union(a[i+1]):a[i]);a=b;}return a[0]||new Solid();}
// Collapse coplanar BSP fragments when their union is convex. This is a topology-
// preserving optimization, not a mesh repair. Faces around openings remain split.
function compact(solid){
 const groups=new Map();for(const p of solid.polys){let k=p.n.concat(p.w).map(x=>Math.round(x*1e5)).join(',');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
 const polyArea=p=>{let out=[0,0,0];for(let i=0;i<p.v.length;i++)out=add(out,cross(p.v[i],p.v[(i+1)%p.v.length]));return Math.abs(dot(out,p.n))/2;};
 const convex=v=>{let p=safePoly(v);if(!p)return false;for(let i=0;i<v.length;i++)if(dot(cross(sub(v[(i+1)%v.length],v[i]),sub(v[(i+2)%v.length],v[(i+1)%v.length])),p.n)<-1e-7)return false;return p;};
 let out=[];for(const group of groups.values()){
  if(group.length===1){out.push(group[0]);continue;}
  const normal=group[0].n,axis=Math.abs(normal[0])>Math.abs(normal[1])&&Math.abs(normal[0])>Math.abs(normal[2])?0:Math.abs(normal[1])>Math.abs(normal[2])?1:2,axes=[0,1,2].filter(i=>i!==axis);
  let un=new Map();for(const p of group)for(const v of p.v)un.set(key(v),v);let pp=[...un.values()].sort((a,b)=>a[axes[0]]-b[axes[0]]||a[axes[1]]-b[axes[1]]),cr=(a,b,c)=>(b[axes[0]]-a[axes[0]])*(c[axes[1]]-a[axes[1]])-(b[axes[1]]-a[axes[1]])*(c[axes[0]]-a[axes[0]]),low=[],high=[];
  for(const p of pp){while(low.length>=2&&cr(low.at(-2),low.at(-1),p)<=1e-8)low.pop();low.push(p);}for(const p of pp.slice().reverse()){while(high.length>=2&&cr(high.at(-2),high.at(-1),p)<=1e-8)high.pop();high.push(p);}let hp=safePoly(low.slice(0,-1).concat(high.slice(0,-1)),group[0].tag);
  if(hp&&Math.abs(polyArea(hp)-group.reduce((s,p)=>s+polyArea(p),0))<.00005){if(dot(hp.n,normal)<0)hp.flip();out.push(hp);continue;}
  out.push(...group);
 }return new Solid(out);
}
// Conforming tessellation: insert every boundary vertex on a collinear BSP edge.
// Convex polygon center fans preserve inserted collinear vertices (no T-junctions).
function mesh(solid){solid=compact(solid);let points=[],index=new Map(),pv=[];const register=v=>{let p=snap(v),k=key(p);if(!index.has(k)){index.set(k,points.length);points.push(p);}return index.get(k);};for(const p of solid.polys){let ids=p.v.map(register).filter((v,i,a)=>i===0||v!==a[i-1]);if(ids.length>1&&ids[0]===ids.at(-1))ids.pop();if(ids.length>=3)pv.push(ids);}
 const original=points.slice(),sorts=[0,1,2].map(ax=>original.map((p,i)=>[p[ax],i]).sort((a,b)=>a[0]-b[0]));const lower=(a,v)=>{let l=0,r=a.length;while(l<r){let m=(l+r)>>1;if(a[m][0]<v)l=m+1;else r=m;}return l;};let triangles=[];
 for(const ids of pv){let boundary=[];for(let k=0;k<ids.length;k++){let ia=ids[k],ib=ids[(k+1)%ids.length],a=points[ia],b=points[ib],d=sub(b,a),dd=dot(d,d);if(dd<EPS*EPS/16)continue;let ax=Math.abs(d[0])>=Math.abs(d[1])&&Math.abs(d[0])>=Math.abs(d[2])?0:Math.abs(d[1])>=Math.abs(d[2])?1:2,sort=sorts[ax],lo=Math.min(a[ax],b[ax])-EPS,hi=Math.max(a[ax],b[ax])+EPS,candidates=[[0,ia]];for(let j=lower(sort,lo);j<sort.length&&sort[j][0]<=hi;j++){let id=sort[j][1];if(id===ia||id===ib)continue;let p=original[id],t=dot(sub(p,a),d)/dd;if(t<=EPS/Math.sqrt(dd)||t>=1-EPS/Math.sqrt(dd))continue;if(len(sub(p,add(a,mul(d,t))))<EPS*1.8)candidates.push([t,id]);}candidates.sort((a,b)=>a[0]-b[0]);boundary.push(...candidates.map(x=>x[1]));}
 if(boundary.length<3)continue;let center=boundary.reduce((s,i)=>add(s,points[i]),[0,0,0]).map(x=>x/boundary.length),ci=register(center);for(let j=0;j<boundary.length;j++){let a=boundary[j],b=boundary[(j+1)%boundary.length];if(new Set([a,b,ci]).size===3&&len(cross(sub(points[b],points[a]),sub(points[ci],points[a])))>1e-10)triangles.push([ci,a,b]);}}
 // Deduplicate coincident triangles; opposing copies cancel interior faces.
 const seen=new Map();for(const tri of triangles){const k=[...tri].sort((a,b)=>a-b).join(',');if(seen.has(k)){const old=seen.get(k);if(old){const i=old.indexOf(tri[0]);if(old[(i+1)%3]!==tri[1])seen.set(k,null);}}else seen.set(k,tri);}triangles=[...seen.values()].filter(Boolean);
 const used=new Map(),verts=[];for(const t of triangles)for(let j=0;j<3;j++){if(!used.has(t[j])){used.set(t[j],verts.length);verts.push(points[t[j]]);}t[j]=used.get(t[j]);}return{vertices:verts,triangles};
}
function vertexFans(m){
 const links=new Map();for(const t of m.triangles){for(let i=0;i<3;i++){const v=t[i],a=t[(i+1)%3],b=t[(i+2)%3];if(!links.has(v))links.set(v,new Map());let g=links.get(v);if(!g.has(a))g.set(a,[]);if(!g.has(b))g.set(b,[]);g.get(a).push(b);g.get(b).push(a);}}
 let bad=0;for(const g of links.values()){if([...g.values()].some(a=>a.length!==2)){bad++;continue;}const start=g.keys().next().value,seen=new Set([start]),todo=[start];while(todo.length){for(const n of g.get(todo.pop())||[])if(!seen.has(n)){seen.add(n);todo.push(n);}}if(seen.size!==g.size)bad++;}return bad;
}
function audit(m){let edges=new Map(),degenerate=0,sliverTriangles=0,volume=0,parent=m.triangles.map((_,i)=>i),find=x=>{while(parent[x]!==x){parent[x]=parent[parent[x]];x=parent[x];}return x;};let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const v of m.vertices)for(let j=0;j<3;j++){min[j]=Math.min(min[j],v[j]);max[j]=Math.max(max[j],v[j]);}for(let i=0;i<m.triangles.length;i++){let t=m.triangles[i],a=m.vertices[t[0]],b=m.vertices[t[1]],c=m.vertices[t[2]];if(!a||!b||!c||!a.concat(b,c).every(Number.isFinite)){degenerate++;continue;}{const area2=len(cross(sub(b,a),sub(c,a)));if(area2<1e-14)degenerate++;else if(area2<1e-8)sliverTriangles++;}volume+=dot(a,cross(b,c))/6;for(let j=0;j<3;j++){let x=t[j],y=t[(j+1)%3],k=x<y?x+','+y:y+','+x,record=edges.get(k);if(record){record.count++;record.balance+=x<y?1:-1;parent[find(i)]=find(record.tri);}else edges.set(k,{count:1,balance:x<y?1:-1,tri:i});}}
 let boundary=0,nonmanifold=0,winding=0;for(const r of edges.values()){if(r.count===1)boundary++;if(r.count>2)nonmanifold++;if(r.count===2&&r.balance!==0)winding++;}let components=new Set(parent.map((_,i)=>find(i))).size,nonManifoldVertices=vertexFans(m);return{nonManifoldVertices,sliverTriangles,vertices:m.vertices.length,triangles:m.triangles.length,boundaryEdges:boundary,nonManifoldEdges:nonmanifold,windingErrors:winding,degenerateTriangles:degenerate,connectedComponents:components,volumeMm3:volume,bounds:{min,max},size:min.map((x,i)=>max[i]-x),valid:!!m.triangles.length&&!boundary&&!nonmanifold&&!winding&&!degenerate&&!nonManifoldVertices&&volume>0};
}
function transformMesh(m,fn){return{vertices:m.vertices.map(fn),triangles:m.triangles.map(t=>t.slice())};}
function stl(m,name='CASEBENCH mm'){let out=new ArrayBuffer(84+50*m.triangles.length),v=new DataView(out),txt=new TextEncoder().encode((name+' | millimetres').slice(0,79));new Uint8Array(out).set(txt);v.setUint32(80,m.triangles.length,true);let k=84;for(const t of m.triangles){const original=t.map(i=>m.vertices[i]),p=original.map(v=>v.map(Math.fround)),sourceNormal=cross(sub(original[1],original[0]),sub(original[2],original[0])),normal=cross(sub(p[1],p[0]),sub(p[2],p[0]));if(len(normal)<1e-14||dot(sourceNormal,normal)<=0)throw Error('STL float32 precision collapses or reverses a triangle. Simplify the last feature or lower curve resolution.');const n=unit(normal);for(const a of [n,...p])for(const x of a){v.setFloat32(k,x,true);k+=4;}v.setUint16(k,0,true);k+=2;}return out;}
function readSTL(buf){const v=new DataView(buf),n=v.getUint32(80,true);if(n>1000000||v.byteLength!==84+50*n)throw Error('Invalid binary STL length.');let vertices=[],triangles=[],ids=new Map();for(let i=0;i<n;i++){let t=[];for(let j=0;j<3;j++){let k=84+i*50+12+j*12,p=[0,4,8].map(o=>v.getFloat32(k+o,true));if(!p.every(Number.isFinite))throw Error('Nonfinite STL vertex.');let id=p.join(',');if(!ids.has(id)){ids.set(id,vertices.length);vertices.push(p);}t.push(ids.get(id));}triangles.push(t);}return{vertices,triangles};}
return{vertexFans,EPS,Poly,Solid,Node,compact,box,prism,circle,cylinder,rounded,unionAll,mesh,audit,transformMesh,stl,readSTL,vec:{add,sub,mul,dot,cross,len,unit},overlap};
});
