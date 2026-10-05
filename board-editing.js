/* CIRCUITBENCH board editing geometry. GPL-3.0-only. */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./library-engine.js'):root.CB;
// Lossless rectangles of a bounded monochrome raster. Transparent pixels are
// always empty, including when the visible colors are inverted.
function rasterRuns(data,w,h,threshold=128,invert=false){
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>256||h>256||data.length!==w*h*4||!Number.isFinite(threshold)||threshold<0||threshold>255)throw Error('Invalid silkscreen raster.');
 let runs=[],previous=new Map();
 const ink=(x,y)=>{let i=(y*w+x)*4;if(data[i+3]<128)return false;let dark=(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2])<threshold;return invert?!dark:dark;};
 for(let y=0;y<h;y++){let current=new Map();for(let x=0;x<w;){if(!ink(x,y)){x++;continue;}let start=x;while(x<w&&ink(x,y))x++;let key=start+':'+(x-start),r=previous.get(key);if(r)r[3]++;else{r=[start,y,x-start,1];runs.push(r);}current.set(key,r);}previous=current;}
 if(!runs.length)throw Error('No ink remains. Adjust the threshold or invert the image.');
 if(runs.length>6000)throw Error('Image is too detailed. Choose a lower resolution or simplify the artwork.');
 return runs;
}
function imagePolygons(a){return a.runs.map(([x,y,w,h])=>[
 {x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}
 ].map(q=>{let t=C.rotate((a.mirror?-1:1)*(q.x/a.pixelWidth-.5)*a.sizeX,(q.y/a.pixelHeight-.5)*a.sizeY,a.rotation);return {x:a.x+t.x,y:a.y+t.y};}));}
function imagePaths(a){
 // Merge on the exact integer raster first. Rotating adjacent rectangles before
 // union introduces rounding slivers on their shared edges at arbitrary angles.
 let paths=C.G.union(a.runs.map(([x,y,w,h])=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}]));
 return paths.map(poly=>{let result=poly.map(q=>{let t=C.rotate((a.mirror?-1:1)*(q.x/a.pixelWidth-.5)*a.sizeX,(q.y/a.pixelHeight-.5)*a.sizeY,a.rotation);return {x:a.x+t.x,y:a.y+t.y};});return a.mirror?result.reverse():result;});
}
function resizeBoard(p,width,height){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<5||height<5||width>500||height>500)throw Error('Board width and height must be between 5 and 500 mm.');
 if(p.board.outline.length)p.board.outline=p.board.outline.map(q=>({x:C.round(q.x*width/p.board.width),y:C.round(q.y*height/p.board.height)}));
 p.board.width=width;p.board.height=height;return p;
}
function setOutline(p,points){
 if(points.length>200||points.some(q=>!Number.isFinite(q.x)||!Number.isFinite(q.y))||!C.G.polygonValid(points))throw Error('Use 3–200 distinct corners without crossings or zero-length edges.');
 let b=C.G.bounds([points]);if(Math.abs(b.minX)>.001||Math.abs(b.minY)>.001)throw Error('Keep at least one corner on X = 0 and one on Y = 0. Coordinates start at the board’s upper-left origin.');
 if(b.maxX<5||b.maxY<5||b.maxX>500||b.maxY>500)throw Error('Board dimensions must be between 5 and 500 mm.');
 p.board.outline=C.clone(points);p.board.width=C.round(b.maxX);p.board.height=C.round(b.maxY);return p;
}
Object.assign(C,{rasterRuns,imagePolygons,imagePaths,resizeBoard,setOutline});
if(typeof module!=='undefined')module.exports=C;else root.CB=C;
})(typeof globalThis!=='undefined'?globalThis:this);
