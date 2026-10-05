/* CIRCUITBENCH direct PCB view, artwork and boundary tools. GPL-3.0-only. */
(function(){'use strict';
const W=CBWorkbench,F=W.field2,button=(label,action,cls='')=>`<button type="button" data-pcb="${action}" class="${cls}">${label}</button>`;
let artwork=null,outlineDraft=null,corner=0,outlineDrag=null,outlineBox=null,imageLoad=0;
const number=id=>Number($('#'+id).value),angle=n=>((n%360)+360)%360;

function viewLabel(){
 if(view!=='pcb')return;
 $('#canvasEyebrow').textContent=(pcbBackView()?'BACK VIEW · MIRRORED':'FRONT VIEW')+' / '+($('#layer').value==='B'?'BACK COPPER · B.Cu':'FRONT COPPER · F.Cu');
 const b=$('[data-pcb=flip]');if(b){b.textContent=pcbBackView()?'↔ Flip to front':'↔ Flip to back';b.setAttribute('aria-pressed',pcbBackView());}
}
function flipBoard(){
 if(view!=='pcb')return;
 if(drag||pan)endDrag();
 prefs.boardView=pcbBackView()?'F':'B';$('#layer').value=prefs.boardView;prefs.layer=prefs.boardView;
 route=null;wire=null;drag=null;pan=null;savePrefs();render();
 say(pcbBackView()?'Viewing the back of the board. Back copper is active; coordinates remain board coordinates.':'Viewing the front of the board. Front copper is active.');
}
const oldRender=render,oldCanvas=renderCanvas,oldInspector=renderInspector;
render=function(){oldRender();if(!$('#pcbDesignTools'))$('#extendedTools').insertAdjacentHTML('beforebegin',`<div id="pcbDesignTools" class="pcbDesignTools" aria-label="Board design tools">${button('↔ Flip to back','flip')}${button('Text','text')}${button('Image','image')}${button('Edit outline','outline')}${button('Board size','size')}<span id="boardSizeReadout"></span></div>`);$('#pcbDesignTools').hidden=view!=='pcb';$('#boardSizeReadout').textContent=p.board.width+' × '+p.board.height+' mm';viewLabel();};
renderCanvas=function(){oldCanvas();if(pcbBackView()){
 // Keep assembly annotations readable. Fabricated text remains real geometry.
 for(let t of $$('#boardScene text')){let x=Number(t.getAttribute('x')||0);t.setAttribute('transform',`translate(${2*x} 0) scale(-1 1)`);}
 }viewLabel();};
renderInspector=function(){oldInspector();let a=selectedObject();if(a&&p.silk.includes(a)&&['text','image'].includes(a.kind)){
 $('#selectionType').textContent='SILKSCREEN '+a.kind.toUpperCase();
 $('#inspector').innerHTML=`<div class="inspectSection"><h3>${esc(a.kind==='image'?a.name:a.text)}</h3><p>${a.layer==='B'?'Back':'Front'} silkscreen${a.kind==='image'?' · '+CB.round(a.sizeX)+' × '+CB.round(a.sizeY)+' mm':''}</p><div class="row2">${field('X mm','viaX',a.x,'number','step=".1"')}${field('Y mm','viaY',a.y,'number','step=".1"')}</div><div class="buttonrow">${button('Edit '+a.kind,'edit-art')}${button('Rotate 90°','rotate-art')}${W.extra('Delete','delete','danger')}</div><p class="helptext">Drag or use arrow keys to move. Bottom artwork reads correctly in Back view.</p></div>`;
 }};
const oldBoardDialog=boardDialog;
boardDialog=function(kind){if(kind==='image'||(!kind&&selectedObject()?.kind==='image'))return imageDialog(selectedObject());return oldBoardDialog(kind);};
const oldRotate=rotateSelected;
rotateSelected=function(){let a=selectedObject();if(view==='pcb'&&a&&p.silk.includes(a)&&['text','image'].includes(a.kind))return W.safeEdit(()=>a.rotation=(a.rotation+90)%360,'Silkscreen rotated.');oldRotate();};

function boardSizeDialog(){
 dialog('Board dimensions',`<p>Set the finished outer dimensions in millimeters. ${p.board.outline.length?'The custom outline scales to the new size.':'The rectangular boundary resizes.'} Components, routing, holes and artwork keep their physical sizes and positions.</p><div class="row2">${F('Width mm','pcbWidth',p.board.width,'number','min="5" max="500" step=".1"')}${F('Height mm','pcbHeight',p.board.height,'number','min="5" max="500" step=".1"')}${F('Thickness mm','pcbThickness',p.board.thickness,'number','min=".1" max="10" step=".1"')}</div><p class="helptext">Any objects left outside the resized board appear in Review. Undo restores the previous boundary.</p><p id="extraError" role="alert"></p><div class="buttonrow">${button('Apply dimensions','apply-size','primary')}${button('Cancel','cancel')}</div>`);
}
function applySize(){if(W.safeEdit(()=>{CB.resizeBoard(p,number('pcbWidth'),number('pcbHeight'));p.board.thickness=number('pcbThickness');},'Board dimensions updated. Review edge clearances before exporting.')){closeDialog();fit();}}

function imageDialog(existing){
 let a=existing?.kind==='image'?CB.clone(existing):null;
 artwork={existing:a,id:a?.id||CB.uid(),bitmap:null,preview:null,name:a?.name||'Silkscreen image'};
 dialog(a?'Edit silkscreen image':'Add silkscreen image',`<p>Import a PNG, JPEG or WebP logo. Dark pixels become silkscreen ink; light and transparent areas stay clear. The preview shows the artwork as read from its chosen side.</p><label>${a?'Replace image (optional)':'Image file'}<input id="silkImageFile" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"></label><div class="artworkGrid"><div><div id="silkImagePreview" class="silkImagePreview" aria-label="Monochrome silkscreen preview"><p>Choose an image to preview.</p></div><p id="imageSummary" class="helptext" role="status"></p></div><div><div class="row2">${F('Width mm','imageWidth',a?.sizeX??20,'number','min=".1" max="500" step=".1"')}${F('Rotation °','imageRotation',a?.rotation??0,'number','step="15"')}${F('Center X mm','imageX',a?.x??CB.round(p.board.width/2),'number','step=".1"')}${F('Center Y mm','imageY',a?.y??CB.round(p.board.height/2),'number','step=".1"')}</div><label>Silkscreen side<select id="imageLayer">${options([['F','Front'],['B','Back']],a?.layer||$('#layer').value)}</select></label><fieldset id="rasterControls" ${a?'disabled':''}><legend>Image conversion</legend><label>Threshold<input id="imageThreshold" type="range" min="0" max="255" value="128"></label><label>Resolution · longest edge<select id="imageResolution">${options([['64','64 pixels · coarse'],['128','128 pixels · standard'],['256','256 pixels · detailed']],'128')}</select></label><label class="inlinecheck"><input id="imageInvert" type="checkbox"> Invert visible colors</label></fieldset></div></div><p class="helptext">Aspect ratio stays fixed. Import up to 10 MB / 16 megapixels. The converted artwork is embedded in your project and works offline.</p><p id="extraError" role="alert"></p><div class="buttonrow">${button(a?'Update image':'Add image','apply-image','primary')}${button('Cancel','cancel')}</div>`);
 $('[data-pcb=apply-image]').disabled=!a;if(a)updateImagePreview();
}
async function loadImage(file){
 const state=artwork,request=++imageLoad;let bitmap;
 try{
  if(!file)return;if(file.size>10*1024*1024)throw Error('Choose an image under 10 MB.');
  const sig=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const png=sig[0]===137&&sig[1]===80&&sig[2]===78&&sig[3]===71,jpeg=sig[0]===255&&sig[1]===216&&sig[2]===255,webp=String.fromCharCode(...sig.slice(0,4))==='RIFF'&&String.fromCharCode(...sig.slice(8,12))==='WEBP';
  if(!png&&!jpeg&&!webp)throw Error('Use a PNG, JPEG or WebP image.');
  bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>16000000)throw Error('Image exceeds 16 megapixels. Resize it before importing.');
  if(artwork!==state||request!==imageLoad||!$('#silkImagePreview')){bitmap.close();return;}
  state.bitmap?.close();state.bitmap=bitmap;state.name=file.name.slice(0,160);$('#rasterControls').disabled=false;updateImagePreview();
 }catch(e){bitmap?.close();if(artwork===state&&$('#silkImagePreview'))W.showFormError(e);}
}
function updateImagePreview(){
 if(!artwork||!$('#silkImagePreview'))return;
 try{
  let a=artwork.existing?CB.clone(artwork.existing):null;
  if(artwork.bitmap){let source=artwork.bitmap,limit=number('imageResolution'),factor=Math.min(1,limit/Math.max(source.width,source.height)),w=Math.max(1,Math.round(source.width*factor)),h=Math.max(1,Math.round(source.height*factor)),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;let ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,w,h);let runs=CB.rasterRuns(ctx.getImageData(0,0,w,h).data,w,h,number('imageThreshold'),$('#imageInvert').checked);a={pixelWidth:w,pixelHeight:h,runs,sizeX:source.width,sizeY:source.height};}
  if(!a)throw Error('Choose an image first.');let ratio=a.sizeY/a.sizeX,width=number('imageWidth');
  Object.assign(a,{id:artwork.id,kind:'image',name:artwork.name,sizeX:width,sizeY:width*ratio,rotation:angle(number('imageRotation')),x:number('imageX'),y:number('imageY'),layer:$('#imageLayer').value,mirror:$('#imageLayer').value==='B'});
  // Validate this draft in a minimal project before expensive geometry or save.
  let trial=CB.fresh();trial.silk=[a];CB.validate(trial);
  let preview={...a,x:a.sizeX/2,y:a.sizeY/2,rotation:0,mirror:false},paths=CB.silkPaths(preview),margin=Math.max(a.sizeX,a.sizeY)*.06;
  $('#silkImagePreview').innerHTML=`<svg role="img" aria-label="Converted ${esc(a.name)}" viewBox="${-margin} ${-margin} ${a.sizeX+2*margin} ${a.sizeY+2*margin}"><path d="${W.polyPath(paths)}" fill="#f1f3d9" fill-rule="evenodd"/></svg>`;
  let pixel=Math.min(a.sizeX/a.pixelWidth,a.sizeY/a.pixelHeight);
  $('#imageSummary').textContent=`${CB.round(a.sizeX)} × ${CB.round(a.sizeY)} mm · ${a.pixelWidth} × ${a.pixelHeight} pixels · ${pixel.toFixed(3)} mm minimum pixel feature.`+(pixel<p.rules.silkLine?' Fine detail is below the current silkscreen rule; enlarge the image or lower the resolution.':'');
  artwork.preview=a;$('#extraError').textContent='';$('[data-pcb=apply-image]').disabled=false;
 }catch(e){artwork.preview=null;$('[data-pcb=apply-image]').disabled=true;W.showFormError(e);}
}
function applyImage(){updateImagePreview();if(!artwork?.preview)return;let a=CB.clone(artwork.preview);if(W.safeEdit(()=>{let i=p.silk.findIndex(s=>s.id===a.id);if(i>=0)p.silk[i]=a;else p.silk.push(a);selected=a.id;},'Silkscreen image saved. Drag it into place, or edit X/Y in the inspector.'))closeDialog();}

function outlineDialog(){
 outlineDraft=CB.clone(CB.G.outline(p));corner=0;outlineDrag=null;outlineBox={x:-p.board.width*.12,y:-p.board.height*.12,w:p.board.width*1.24,h:p.board.height*1.24};
 dialog('Edit board outline',`<p>Drag a corner or click an edge to add a corner. Select a corner and use arrow keys for grid steps; Shift moves ten steps. Coordinates are the front-view board coordinates.</p><svg id="outlineEditor" class="outlineEditor" tabindex="0" role="img" aria-label="Board cut line editor. Use the corner fields for a keyboard alternative."></svg><p id="outlineDimensions" class="helptext" role="status"></p><div class="row3"><label>Corner<select id="outlineCorner"></select></label>${F('X mm','cornerX',0,'number','min="0" max="500" step=".1"')}${F('Y mm','cornerY',0,'number','min="0" max="500" step=".1"')}</div><div class="buttonrow">${button('Add corner after selected','add-corner')}${button('Remove corner','remove-corner')}${button('Reset to rectangle','rectangle')}</div><details><summary>All coordinates / precise polygon input</summary><label>One X,Y pair per line<textarea id="outlinePoints" rows="7"></textarea></label>${button('Preview coordinates','preview-points')}</details><p class="helptext">Keep one corner on X = 0 and one on Y = 0. The path closes automatically. Holes and cutouts retain their positions. Changes are saved only when you apply.</p><p id="extraError" role="alert"></p><div class="buttonrow">${button('Apply outline','apply-outline','primary')}${button('Cancel','cancel')}</div>`);
 renderOutline(true);const editor=$('#outlineEditor');
 editor.addEventListener('pointerdown',e=>{if(e.button!==0)return;let handle=e.target.closest('[data-corner]'),edge=e.target.closest('[data-edge]');if(!handle&&!edge)return;e.preventDefault();if(edge){if(outlineDraft.length>=200)return W.showFormError(Error('The outline supports up to 200 corners.'));corner=Number(edge.dataset.edge)+1;outlineDraft.splice(corner,0,outlinePoint(e));}else corner=Number(handle.dataset.corner);outlineDrag={pointer:e.pointerId,before:CB.clone(outlineDraft)};editor.setPointerCapture(e.pointerId);editor.focus();renderOutline();});
 editor.addEventListener('pointermove',e=>{if(!outlineDrag)return;outlineDraft[corner]=outlinePoint(e);renderOutline();});
 editor.addEventListener('pointerup',()=>{outlineDrag=null;renderOutline(true);});
 editor.addEventListener('pointercancel',()=>{if(outlineDrag)outlineDraft=outlineDrag.before;outlineDrag=null;renderOutline(true);});
 editor.addEventListener('keydown',e=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();let step=Number($('#grid').value)*(e.shiftKey?10:1),q=outlineDraft[corner];q.x=CB.round(Math.max(0,Math.min(500,q.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0))));q.y=CB.round(Math.max(0,Math.min(500,q.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0))));renderOutline(true);});
}
function outlinePoint(e){let q=new DOMPoint(e.clientX,e.clientY).matrixTransform($('#outlineEditor').getScreenCTM().inverse()),grid=Number($('#grid').value);return {x:CB.round(Math.max(0,Math.min(500,Math.round(q.x/grid)*grid))),y:CB.round(Math.max(0,Math.min(500,Math.round(q.y/grid)*grid)))};}
function renderOutline(sync=false){
 let editor=$('#outlineEditor');if(!editor||!outlineDraft)return;let b=CB.G.bounds([outlineDraft]),valid=CB.G.polygonValid(outlineDraft),r=Math.max(outlineBox.w,outlineBox.h)*.011;
 editor.setAttribute('viewBox',`${outlineBox.x} ${outlineBox.y} ${outlineBox.w} ${outlineBox.h}`);
 editor.innerHTML=`<path d="${W.polyPath([outlineDraft])}" fill="#153e35" stroke="${valid?'#7bb79a':'#f08c80'}" stroke-width="${r*.3}"/>`+p.cutouts.map(c=>`<path d="${W.polyPath([c.points])}" fill="var(--field)" stroke="#d29c72" stroke-width="${r*.2}" pointer-events="none"/>`).join('')+p.components.map(c=>`<rect x="${c.pcb.x-c.body[0]/2}" y="${c.pcb.y-c.body[1]/2}" width="${c.body[0]}" height="${c.body[1]}" transform="rotate(${c.pcb.rotation} ${c.pcb.x} ${c.pcb.y})" fill="none" stroke="#77968b" stroke-width="${r*.2}" pointer-events="none"/>`).join('')+outlineDraft.map((q,i)=>line(q,outlineDraft[(i+1)%outlineDraft.length],'transparent',r*2,`data-edge="${i}" style="cursor:copy"`)).join('')+outlineDraft.map((q,i)=>`<circle cx="${q.x}" cy="${q.y}" r="${r}" fill="${i===corner?'#ffc663':'#edf3dd'}" stroke="#254d3d" stroke-width="${r*.25}" data-corner="${i}" style="cursor:move"><title>Corner ${i+1}: ${q.x}, ${q.y} mm</title></circle>`).join('');
 $('#outlineDimensions').textContent=`${CB.round(b.maxX-b.minX)} × ${CB.round(b.maxY-b.minY)} mm · ${outlineDraft.length} corners`+(valid?'':' · Crossing or degenerate edges; adjust before applying.');
 $('#outlineCorner').innerHTML=options(outlineDraft.map((q,i)=>[String(i),'Corner '+(i+1)]),String(corner));$('#cornerX').value=outlineDraft[corner].x;$('#cornerY').value=outlineDraft[corner].y;
 $('[data-pcb=remove-corner]').disabled=outlineDraft.length<=3;
 if(sync)$('#outlinePoints').value=outlineDraft.map(q=>q.x+','+q.y).join('\n');
}
function applyOutline(){if(W.safeEdit(()=>CB.setOutline(p,W.parsePoints($('#outlinePoints').value)),'Board outline updated. Review copper and cutout clearances.')){closeDialog();fit();}}
function resizeOutlinePreview(){let b=CB.G.bounds([outlineDraft]),width=Math.max(p.board.width,b.maxX,5),height=Math.max(p.board.height,b.maxY,5);outlineBox={x:-width*.12,y:-height*.12,w:width*1.24,h:height*1.24};}

document.addEventListener('click',e=>{let a=e.target.closest('[data-pcb]')?.dataset.pcb;if(!a)return;
 const actions={flip:flipBoard,text:()=>{selected=null;boardDialog('text');},image:()=>imageDialog(),size:boardSizeDialog,outline:outlineDialog,'apply-size':applySize,'apply-image':applyImage,'apply-outline':applyOutline,cancel:closeDialog,'edit-art':()=>boardDialog(selectedObject()?.kind),'rotate-art':rotateSelected,
 'add-corner':()=>{if(outlineDraft.length>=200)return W.showFormError(Error('The outline supports up to 200 corners.'));let a=outlineDraft[corner],b=outlineDraft[(corner+1)%outlineDraft.length];outlineDraft.splice(++corner,0,{x:CB.round((a.x+b.x)/2),y:CB.round((a.y+b.y)/2)});renderOutline(true);},
 'remove-corner':()=>{if(outlineDraft.length<=3)return;outlineDraft.splice(corner,1);corner=Math.min(corner,outlineDraft.length-1);renderOutline(true);},
 rectangle:()=>{outlineDraft=[{x:0,y:0},{x:p.board.width,y:0},{x:p.board.width,y:p.board.height},{x:0,y:p.board.height}];corner=0;renderOutline(true);},
 'preview-points':()=>{try{let pts=W.parsePoints($('#outlinePoints').value);CB.setOutline(CB.clone(p),pts);outlineDraft=pts;corner=0;resizeOutlinePreview();renderOutline(true);$('#extraError').textContent='';}catch(err){W.showFormError(err);}}};
 actions[a]?.();
});
document.addEventListener('change',e=>{let id=e.target.id;
 if(id==='silkImageFile')loadImage(e.target.files[0]);
 if(['imageWidth','imageRotation','imageX','imageY','imageLayer','imageResolution','imageInvert'].includes(id))updateImagePreview();
 if(id==='outlineCorner'){corner=Number(e.target.value);renderOutline();}
 if(['cornerX','cornerY'].includes(id)){let value=Number(e.target.value);if(!Number.isFinite(value)||value<0||value>500){W.showFormError(Error('Corner coordinates must be 0–500 mm.'));return;}outlineDraft[corner][id==='cornerX'?'x':'y']=value;resizeOutlinePreview();renderOutline(true);}
});
document.addEventListener('input',e=>{if(e.target.id==='imageThreshold')updateImagePreview();});
document.addEventListener('keydown',e=>{if(!$('#dialog').open&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&e.key.toLowerCase()==='b')flipBoard();});
$('#dialog').addEventListener('close',()=>{artwork?.bitmap?.close();artwork=null;imageLoad++;outlineDraft=null;outlineDrag=null;});
const oldHelp=helpDialog;helpDialog=function(){oldHelp();$('#dialogBody').insertAdjacentHTML('afterbegin',`<div class="notice"><strong>PCB tools · v1.2</strong><p>Use Flip to back (B) to view the underside. Text and Image add manufacturing silkscreen to the active side. Edit outline opens the corner editor; Board size adjusts width, height and thickness. Artwork, boundaries and dimensions are saved with the project and included in fabrication exports.</p></div>`);};
window.Circuitbench.boardTools={flip:flipBoard,dimensions:boardSizeDialog,outline:outlineDialog,image:imageDialog};
render();
})();
