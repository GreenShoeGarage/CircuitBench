/* Rebuild the checked-in offline solid-modeler assets. GPL-3.0-only. */
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),entry=require.resolve('manifold-3d/manifold.js');
esbuild.buildSync({entryPoints:[entry],bundle:true,minify:true,format:'iife',globalName:'CBManifold',platform:'browser',external:['node:*'],define:{'import.meta.url':JSON.stringify('file:///circuitbench/manifold.js')},outfile:path.join(root,'vendor/manifold.js')});
fs.copyFileSync(path.join(path.dirname(entry),'manifold.wasm'),path.join(root,'vendor/manifold.wasm'));
console.log('Rebuilt Manifold JS and WASM. Run npm run build to embed them in index.html.');
