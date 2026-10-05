/* Offline Manifold backend for the reused enclosure feature model. GPL-3.0-only. */
(function(root){'use strict';
function install(S,api){const original={...S},M=api.Manifold,empty=()=>({vertices:[],triangles:[]});
 function toManifold(mesh){if(!mesh.triangles.length)return new M();let m=new api.Mesh({numProp:3,vertProperties:new Float32Array(mesh.vertices.flat()),triVerts:new Uint32Array(mesh.triangles.flat())});return new M(m);}
 function fromManifold(m){if(m.status()!=='NoError')throw Error('Solid operation failed: '+m.status());const x=m.getMesh(),vertices=[],triangles=[];for(let i=0;i<x.numVert;i++)vertices.push(Array.from(x.vertProperties.subarray(i*x.numProp,i*x.numProp+3)));for(let i=0;i<x.triVerts.length;i+=3)triangles.push(Array.from(x.triVerts.subarray(i,i+3)));return new Solid({vertices,triangles});}
 class Solid{
  constructor(mesh=empty()){this.data=mesh;this.polys={length:mesh.triangles.length};}
  get bounds(){if(!this._bounds){let min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const v of this.data.vertices)for(let i=0;i<3;i++){min[i]=Math.min(min[i],v[i]);max[i]=Math.max(max[i],v[i]);}this._bounds={min,max};}return this._bounds;}
  clone(){return this;}
  transform(fn){return new Solid({vertices:this.data.vertices.map(fn),triangles:this.data.triangles});}
  translate(v){return this.transform(p=>p.map((x,i)=>x+v[i]));}
  rotateZ(angle){let a=angle*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return this.transform(v=>[v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]]);}
  op(other,kind){if(!this.polys.length)return kind==='union'?other:new Solid();if(!other.polys.length)return kind==='intersect'?new Solid():this;let a,b,c;try{a=toManifold(this.data);b=toManifold(other.data);c=kind==='union'?a.add(b):kind==='subtract'?a.subtract(b):a.intersect(b);return fromManifold(c);}finally{c?.delete();b?.delete();a?.delete();}}
  union(b){return this.op(b,'union');} subtract(b){return this.op(b,'subtract');} intersect(b){return this.op(b,'intersect');}
  volume(){let total=0;for(const t of this.data.triangles){const [a,b,c]=t.map(i=>this.data.vertices[i]);total+=a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]);}return total/6;}
 }
 function stableMesh(s){if(!s.polys.length)return s.data;let raw,clean;try{raw=toManifold(s.data);clean=raw.simplify(.0001);return fromManifold(clean).data;}finally{clean?.delete();raw?.delete();}}
 const convert=f=>(...a)=>new Solid(original.mesh(f(...a)));
 Object.assign(S,{Solid,box:convert(original.box),prism:convert(original.prism),cylinder:convert(original.cylinder),mesh:stableMesh,unionAll:solids=>solids.reduce((a,b)=>a.union(b),new Solid())});
 S.kernel='Manifold 3.5.4';return S;
}
if(typeof module==='object'&&module.exports)module.exports=install;else root.CBInstallManifold=install;
})(globalThis);
