/* CIRCUITBENCH bounded obstacle-aware routing. GPL-3.0-only. */
(function(root){'use strict';const C=typeof module!=='undefined'?require('./kicad.js'):root.CB,G=C.G;
function routeBetween(p,a,b,net,layer,width,grid=.5){
 if(!p.nets.includes(net)||!['F','B'].includes(layer)||!Number.isFinite(width)||width<.05||width>10)throw Error('Choose a valid net, layer and track width.');
 const clearance=C.designRule(p,net,'clearance')+.012,r=width/2,material=G.boardMaterial(p,p.rules.edge+r+.012),obs=[];
 for(let item of C.rawCopper(p)){if((item.layer==='both'||item.layer===layer)&&item.net!==net){let paths=G.offset(item.paths,Math.max(clearance,C.designRule(p,item.net,'clearance')+.012)+r);obs.push({paths,bounds:G.bounds(paths)});}}
 for(let k of C.keepouts?C.keepouts(p):[])if(k.prohibit.tracks&&(k.layers.includes('*.Cu')||k.layers.includes(layer+'.Cu'))){let paths=G.offset([k.points],r);obs.push({paths,bounds:G.bounds(paths)});}
 for(let h of C.holes(p)){let paths=G.offset([G.drillPolygon(h)],clearance+r);obs.push({paths,bounds:G.bounds(paths)});}
 // Zones regenerate around tracks, so their previous fills are not fixed obstacles.
 const pointOK=q=>G.inside(q,material)&&!obs.some(o=>q.x>=o.bounds.minX&&q.x<=o.bounds.maxX&&q.y>=o.bounds.minY&&q.y<=o.bounds.maxY&&G.inside(q,o.paths));
 function lineOK(u,v){if(!pointOK(u)||!pointOK(v))return false;const bb=G.bounds([[u,v]]);for(let paths of [material,...obs.filter(o=>G.boxesNear(o.bounds,bb)).map(o=>o.paths)])for(let poly of paths)for(let i=0;i<poly.length;i++)if(C.segDistance(u,v,poly[i],poly[(i+1)%poly.length])<.00005)return false;return true;}
 if(!pointOK(a)||!pointOK(b))throw Error('A route endpoint lacks clearance. Move the part, change the layer or correct the rule violation first.');
 if(lineOK(a,b))return [{x:a.x,y:a.y},{x:b.x,y:b.y}];
 grid=Math.max(.2,Math.min(2,grid||.5),Math.sqrt(p.board.width*p.board.height/180000));const nx=Math.ceil(p.board.width/grid)+1,ny=Math.ceil(p.board.height/grid)+1,toPoint=i=>({x:C.round((i%nx)*grid),y:C.round(Math.floor(i/nx)*grid)}),valid=new Map();
 function good(i){if(i<0||i>=nx*ny)return false;if(!valid.has(i))valid.set(i,pointOK(toPoint(i)));return valid.get(i);}
 function neighbors(q){let x=Math.round(q.x/grid),y=Math.round(q.y/grid),out=[];for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){let xx=x+dx,yy=y+dy,i=yy*nx+xx;if(xx>=0&&xx<nx&&yy>=0&&yy<ny&&good(i)&&lineOK(q,toPoint(i)))out.push(i);}return out;}
 const starts=neighbors(a),ends=new Set(neighbors(b));if(!starts.length||!ends.size)throw Error('No grid entry near an endpoint. Use a finer grid or manual routing.');
 const costs=new Map(),parents=new Map(),closed=new Set(),heap=[];
 function push(node){heap.push(node);let i=heap.length-1;while(i){let j=(i-1)>>1;if(heap[j].f<=node.f)break;heap[i]=heap[j];i=j;}heap[i]=node;}
 function pop(){let top=heap[0],last=heap.pop();if(heap.length){let i=0;while(true){let j=i*2+1;if(j>=heap.length)break;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return top;}
 for(let i of starts){let g=C.dist(a,toPoint(i));costs.set(i,g);parents.set(i,-1);push({i,g,f:g+C.dist(toPoint(i),b)});}let finish=-1,visits=0;
 while(heap.length&&visits++<180000){let {i,g}=pop();if(closed.has(i))continue;closed.add(i);if(ends.has(i)){finish=i;break;}let u=toPoint(i),x=i%nx,y=Math.floor(i/nx);for(let [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){let xx=x+dx,yy=y+dy,j=yy*nx+xx;if(xx<0||xx>=nx||yy<0||yy>=ny||closed.has(j)||!good(j))continue;let v=toPoint(j),next=g+C.dist(u,v);if(next>=(costs.get(j)??Infinity)||!lineOK(u,v))continue;costs.set(j,next);parents.set(j,i);push({i:j,g:next,f:next+C.dist(v,b)});}}
 if(finish<0)throw Error('No clear route found on this layer within the search limit. Add a via, reposition parts or route manually.');let points=[{x:b.x,y:b.y}];for(let i=finish;i!==-1;i=parents.get(i))points.push(toPoint(i));points.push({x:a.x,y:a.y});points.reverse();let simplified=[points[0]],i=0;while(i<points.length-1){let j=points.length-1;while(j>i+1&&!lineOK(points[i],points[j]))j--;simplified.push(points[j]);i=j;}return simplifyTrack(simplified);
}
function simplifyTrack(points){let out=[];for(let q of points){if(out.length&&C.dist(q,out.at(-1))<.0001)continue;while(out.length>1&&C.pointSegment(out.at(-1),out.at(-2),q)<.0001)out.pop();out.push({x:q.x,y:q.y});}return out;}
Object.assign(C,{routeBetween,simplifyTrack});if(typeof module!=='undefined')module.exports=C;else root.CB=C;
})(typeof globalThis!=='undefined'?globalThis:this);
