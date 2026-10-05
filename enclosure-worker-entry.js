/* Worker protocol for bounded enclosure geometry. GPL-3.0-only. */
let enclosureReady=null;
self.onmessage=async event=>{let {id,plan}=event.data;try{
 if(!enclosureReady)enclosureReady=CBManifold.default({wasmBinary:Uint8Array.from(atob(CB_MANIFOLD_WASM),c=>c.charCodeAt(0))}).then(api=>{api.setup();return api;});
 const api=await enclosureReady,result=CBEnclosureSolid.build(plan,api);
 self.postMessage({id,result},[result.base.positions.buffer,result.base.indices.buffer,result.lid.positions.buffer,result.lid.indices.buffer]);
}catch(error){self.postMessage({id,error:error.message||String(error)});}};
