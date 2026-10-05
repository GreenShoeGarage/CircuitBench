/* Local, bounded SVG outline importer. XML is data: no uploaded element is inserted
 * into the page. Active content, external references, strokes and text are rejected.
 */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.CaseArtwork=a;})(globalThis,function(){
'use strict';
const numberPattern=/[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?/g;
function nums(s){const a=String(s||'').match(numberPattern)||[];if(String(s||'').replace(numberPattern,'').replace(/[\s,]+/g,''))throw Error('Invalid SVG numeric list.');return a.map(x=>{let n=Number(x);if(!Number.isFinite(n)||Math.abs(n)>1e6)throw Error('SVG coordinate limit exceeded.');return n;});}
function path(d){
 if(typeof d!=='string'||d.length>60000)throw Error('SVG path exceeds its 60,000-character limit.');
 const re=/[a-zA-Z]|[+-]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][+-]?\d+)?/g,t=d.match(re)||[];
 if(d.replace(re,'').replace(/[\s,]+/g,''))throw Error('Invalid SVG path syntax.');
 let i=0,cmd=null,x=0,y=0,start=[0,0],ring=[],rings=[],cubic=null,quad=null,last='';
 const read=()=>{if(i>=t.length||/^[a-z]$/i.test(t[i]))throw Error('Incomplete SVG path.');const n=Number(t[i++]);if(!Number.isFinite(n)||Math.abs(n)>1e6)throw Error('SVG coordinate exceeds bounds.');return n;};
 const add=(xx,yy)=>{if(ring.length>250)throw Error('An SVG contour exceeds 256 samples. Simplify the artwork.');if(!ring.length||Math.hypot(xx-ring.at(-1)[0],yy-ring.at(-1)[1])>1e-7)ring.push([xx,yy]);};
 const bezier=(a,b,c,end)=>{for(let j=1;j<=12;j++){let q=j/12,r=1-q;add(r*r*r*a[0]+3*r*r*q*b[0]+3*r*q*q*c[0]+q*q*q*end[0],r*r*r*a[1]+3*r*r*q*b[1]+3*r*q*q*c[1]+q*q*q*end[1]);}};
 while(i<t.length){if(/^[a-z]$/i.test(t[i]))cmd=t[i++];if(!cmd)throw Error('SVG path needs an initial move.');let op=cmd.toUpperCase(),relative=cmd!==op,point=()=>{let xx=read(),yy=read();return[xx+(relative?x:0),yy+(relative?y:0)];};
 if(op==='Z'){if(ring.length<3)throw Error('SVG contour is too short.');if(Math.hypot(ring[0][0]-ring.at(-1)[0],ring[0][1]-ring.at(-1)[1])<1e-7)ring.pop();rings.push(ring);if(rings.length>40)throw Error('SVG path has too many contours.');ring=[];[x,y]=start;cmd=null;cubic=quad=null;last=op;continue;}
 if(op==='M'){if(ring.length)throw Error('SVG filled paths must explicitly close with Z.');[x,y]=point();start=[x,y];add(x,y);cmd=relative?'l':'L';}
 else if(op==='L'){[x,y]=point();add(x,y);}
 else if(op==='H'){x=read()+(relative?x:0);add(x,y);}
 else if(op==='V'){y=read()+(relative?y:0);add(x,y);}
 else if(op==='C'||op==='S'){const a=[x,y],b=op==='C'?point():last==='C'||last==='S'?[2*x-cubic[0],2*y-cubic[1]]:[x,y],c=point(),end=point();bezier(a,b,c,end);cubic=c;[x,y]=end;}
 else if(op==='Q'||op==='T'){const a=[x,y],b=op==='Q'?point():last==='Q'||last==='T'?[2*x-quad[0],2*y-quad[1]]:[x,y],end=point();for(let j=1;j<=12;j++){let q=j/12,r=1-q;add(r*r*a[0]+2*r*q*b[0]+q*q*end[0],r*r*a[1]+2*r*q*b[1]+q*q*end[1]);}quad=b;[x,y]=end;}
 else if(op==='A'){
  let rx=Math.abs(read()),ry=Math.abs(read()),angle=read()*Math.PI/180,large=read(),sweep=read(),end=point();if(![0,1].includes(large)||![0,1].includes(sweep))throw Error('Invalid SVG arc flags.');
  if(!rx||!ry||Math.hypot(x-end[0],y-end[1])<1e-8)add(...end);else{
   const co=Math.cos(angle),si=Math.sin(angle),dx=(x-end[0])/2,dy=(y-end[1])/2,xp=co*dx+si*dy,yp=-si*dx+co*dy,k=xp*xp/(rx*rx)+yp*yp/(ry*ry);if(k>1){rx*=Math.sqrt(k);ry*=Math.sqrt(k);}const sign=large===sweep?-1:1,f=sign*Math.sqrt(Math.max(0,(rx*rx*ry*ry-rx*rx*yp*yp-ry*ry*xp*xp)/(rx*rx*yp*yp+ry*ry*xp*xp))),cxp=f*rx*yp/ry,cyp=-f*ry*xp/rx,cx=co*cxp-si*cyp+(x+end[0])/2,cy=si*cxp+co*cyp+(y+end[1])/2;
   let a0=Math.atan2((yp-cyp)/ry,(xp-cxp)/rx),a1=Math.atan2((-yp-cyp)/ry,(-xp-cxp)/rx),da=a1-a0;if(!sweep&&da>0)da-=2*Math.PI;if(sweep&&da<0)da+=2*Math.PI;const n=Math.max(2,Math.ceil(Math.abs(da)/(Math.PI/16)));for(let j=1;j<=n;j++){const a=a0+da*j/n;add(cx+co*rx*Math.cos(a)-si*ry*Math.sin(a),cy+si*rx*Math.cos(a)+co*ry*Math.sin(a));}
  }[x,y]=end;
 }else throw Error('Unsupported SVG path command '+cmd+'.');
 if(!['C','S'].includes(op))cubic=null;if(!['Q','T'].includes(op))quad=null;last=op;
 }
 if(ring.length)throw Error('SVG filled paths must explicitly close with Z.');if(!rings.length)throw Error('SVG path has no closed geometry.');return rings;
}
const identity=()=>[1,0,0,1,0,0],multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function transform(str){let result=identity(),count=0;const re=/(matrix|translate|scale|rotate)\s*\(([^)]*)\)/g;for(const m of String(str||'').matchAll(re)){count++;const v=nums(m[2]);let t;if(m[1]==='matrix'&&v.length===6)t=v;else if(m[1]==='translate'&&[1,2].includes(v.length))t=[1,0,0,1,v[0],v[1]||0];else if(m[1]==='scale'&&[1,2].includes(v.length))t=[v[0],0,0,v[1]??v[0],0,0];else if(m[1]==='rotate'&&[1,3].includes(v.length)){let a=v[0]*Math.PI/180;t=[Math.cos(a),Math.sin(a),-Math.sin(a),Math.cos(a),0,0];if(v.length===3)t=multiply(multiply([1,0,0,1,v[1],v[2]],t),[1,0,0,1,-v[1],-v[2]]);}else throw Error('Unsupported SVG transform arguments.');if(Math.abs(t[0]*t[3]-t[1]*t[2])<1e-10)throw Error('SVG transform collapses the artwork.');result=multiply(result,t);}if(String(str||'').replace(re,'').trim())throw Error('Only matrix, translate, scale and rotate SVG transforms are supported.');return result;}
function parseSVG(text){
 if(typeof DOMParser==='undefined')throw Error('SVG XML import requires the local browser parser.');
 if(typeof text!=='string'||text.length>131072)throw Error('SVG must be smaller than 128 KiB.');
 if(/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|url\s*\(/i.test(text))throw Error('SVG external entities, stylesheets and URL references are not accepted.');
 const doc=new DOMParser().parseFromString(text,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid SVG document.');
 const groups=[];const coord=(el,name,fallback=0)=>{let s=el.getAttribute(name);if(s===null)return fallback;let a=nums(s.replace(/px$/,''));if(a.length!==1)throw Error('SVG '+name+' requires a plain coordinate.');return a[0];};
 function visit(el,parent=identity(),inherit={fill:'black',rule:'nonzero',stroke:'none'}){
  const tag=el.localName;if(tag==='svg'&&el!==doc.documentElement)throw Error('Flatten nested SVG viewports before importing.');if(['title','desc','metadata'].includes(tag))return;
  if(!['svg','g','path','rect','circle','ellipse','polygon'].includes(tag))throw Error('SVG '+tag+' is unsupported. Convert artwork to filled outlines.');
  for(const a of el.attributes)if(/^on/i.test(a.name)||/href|filter|mask|clip-path/i.test(a.name))throw Error('SVG active content, clipping and references are not accepted.');
  const style={...inherit};for(const [k,field]of [['fill','fill'],['fill-rule','rule'],['stroke','stroke']])if(el.hasAttribute(k))style[field]=el.getAttribute(k);
  if(el.hasAttribute('style'))for(const declaration of el.getAttribute('style').split(';').filter(x=>x.trim())){const [k,v]=declaration.split(':').map(x=>x.trim());if(k==='fill')style.fill=v;else if(k==='fill-rule')style.rule=v;else if(k==='stroke')style.stroke=v;else if(['stroke-width','stroke-linejoin','stroke-linecap'].includes(k)&&style.stroke==='none'){}else throw Error('SVG style '+k+' must be converted to plain filled geometry.');}
  if(style.stroke!=='none')throw Error('Outline SVG strokes before importing. Stroke centerlines are not solids.');
  if(!['nonzero','evenodd'].includes(style.rule))throw Error('Unsupported SVG fill rule.');
  for(const name of ['opacity','fill-opacity','stroke-opacity'])if(el.hasAttribute(name)&&Number(el.getAttribute(name))!==1)throw Error('Remove SVG transparency before importing.');for(const name of ['display','visibility'])if(el.hasAttribute(name))throw Error('Remove SVG visibility overrides before importing.');
  const mat=multiply(parent,transform(el.getAttribute('transform')));
  if(tag==='svg'||tag==='g'){for(const child of el.children)visit(child,mat,style);return;}
  if(style.fill==='none')throw Error('An SVG shape has no fill. Remove it or convert it to a filled outline.');
  let contours;if(tag==='path')contours=path(el.getAttribute('d'));
  else if(tag==='polygon'){let v=nums(el.getAttribute('points'));if(v.length%2)throw Error('SVG polygon needs coordinate pairs.');contours=[Array.from({length:v.length/2},(_,i)=>[v[i*2],v[i*2+1]])];}
  else if(tag==='circle'||tag==='ellipse'){let cx=coord(el,'cx'),cy=coord(el,'cy'),rx=coord(el,tag==='circle'?'r':'rx'),ry=tag==='circle'?rx:coord(el,'ry');if(rx<=0||ry<=0)throw Error('SVG ellipse needs positive radii.');contours=[Array.from({length:48},(_,i)=>[cx+rx*Math.cos(i*2*Math.PI/48),cy+ry*Math.sin(i*2*Math.PI/48)])];}
  else{let x=coord(el,'x'),y=coord(el,'y'),w=coord(el,'width'),h=coord(el,'height'),rx=Math.min(w/2,coord(el,'rx',coord(el,'ry'))),ry=Math.min(h/2,coord(el,'ry',rx));if(w<=0||h<=0||rx<0||ry<0)throw Error('SVG rectangle needs positive dimensions and nonnegative radii.');if(rx&&ry){let p=[];for(const [cx,cy,start]of [[x+w-rx,y+ry,-90],[x+w-rx,y+h-ry,0],[x+rx,y+h-ry,90],[x+rx,y+ry,180]])for(let i=0;i<=8;i++){let a=(start+i*90/8)*Math.PI/180;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}contours=[p];}else contours=[[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]];}
  groups.push({rule:style.rule,contours:contours.map(c=>c.map(([x,y])=>[mat[0]*x+mat[2]*y+mat[4],mat[1]*x+mat[3]*y+mat[5]]))});if(groups.length>24)throw Error('SVG exceeds 24 filled shapes. Simplify the artwork.');
 }
 visit(doc.documentElement);const all=groups.flatMap(g=>g.contours.flat());if(!all.length)throw Error('SVG has no supported filled shapes.');const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0])),minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1])),w=maxX-minX,h=maxY-minY;if(w<1e-6||h<1e-6)throw Error('SVG has no area.');
 const out=groups.map(g=>({...g,contours:g.contours.map(c=>c.map(([x,y])=>[(x-(minX+maxX)/2)/w,-(y-(minY+maxY)/2)/h]))}));
 return{artGroups:out,contours:out.flatMap(g=>g.contours),artRule:'nonzero',aspect:w/h,width:30,height:30*h/w,note:'Filled outlines flattened locally; inspect small features after export.'};
}
return{parseSVG,path,transform,multiply};
});
