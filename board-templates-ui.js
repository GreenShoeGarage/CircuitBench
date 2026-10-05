/* CIRCUITBENCH board-template picker. GPL-3.0-only. */
(function(){'use strict';
const W=CBWorkbench;
function open(){
 const previous=p.board.template;
 dialog('Board templates',`<p>Start with a familiar board shape from COPPERBENCH’s HATs, shields &amp; carriers collection.</p><div class="templateLayout"><div><label>Board family<select id="boardTemplateFamily">${options(CB.boardTemplates().map(d=>[d.id,d.name]),previous?.family||'uno-r3')}</select></label><label>Clockwise rotation<select id="boardTemplateRotation">${options([['0','0° · reference orientation'],['90','90°'],['180','180°'],['270','270°']],String(previous?.rotation||0))}</select></label><label class="inlinecheck"><input type="checkbox" id="boardTemplateHoles" ${previous?.holes===false?'':'checked'}> Include mounting holes</label><p id="boardTemplateDimensions" class="templateDimensions" role="status"></p><p id="boardTemplateNote" class="helptext"></p></div><div><svg id="boardTemplatePreview" role="img" aria-label="Board outline and mounting-hole preview"></svg><p class="helptext">Front view · millimeters · dashed arrow marks the reference top edge.</p></div></div><p class="notice">Applying replaces the outer cut line and any untouched holes added by an earlier template. Your components, routing, artwork, thickness, manual holes and edited template holes keep their sizes and positions. Undo restores the previous board.</p><p class="helptext">These presets provide board outlines and mounting holes. Add your mating connectors from the component library. Check part placement and edge clearances in Review after applying.</p><details><summary>Dimensions &amp; sources</summary><div id="boardTemplateSources"></div></details><p id="extraError" role="alert"></p><div class="buttonrow"><button type="button" class="primary" data-template="apply">Apply board template</button><button type="button" data-action="closeDialog">Cancel</button></div>`);
 preview();
}
function preview(){
 try{
 const s=CB.boardTemplate($('#boardTemplateFamily').value,{rotation:Number($('#boardTemplateRotation').value)}),holes=$('#boardTemplateHoles').checked,svg=$('#boardTemplatePreview'),pad=7;
 svg.setAttribute('viewBox',`${-pad} ${-pad} ${s.width+2*pad} ${s.height+2*pad}`);
 svg.innerHTML=`<path d="${W.polyPath([s.outline])}" class="templateBoard"/>`+(holes?s.holes.map(h=>`<circle cx="${h.x}" cy="${h.y}" r="${h.drill/2}" class="templateHole"><title>Hole ${h.index+1}: ${h.x}, ${h.y} mm · Ø${h.drill} mm</title></circle>`).join(''):'')+`<g transform="translate(${s.width/2} ${s.height/2}) rotate(${s.rotation})"><path d="M0 3 V-3 M-1.5 -1.5 L0 -3 L1.5 -1.5" class="templateArrow"/></g>`;
 $('#boardTemplateDimensions').textContent=`${s.width} × ${s.height} mm · ${holes?'4 × Ø'+s.drill+' mm holes':'outline only'}`;
 $('#boardTemplateNote').textContent=s.note;
 $('#boardTemplateSources').innerHTML=`<p>Nominal geometry matches COPPERBENCH v1.7.1. Rounded corners use 16 segments per quarter circle. Templates stay editable with Board size and Edit outline.</p><table><thead><tr><th>Hole</th><th>X mm</th><th>Y mm</th><th>Diameter mm</th></tr></thead><tbody>${s.holes.map(h=>`<tr><td>${h.index+1}</td><td>${h.x}</td><td>${h.y}</td><td>${h.drill}</td></tr>`).join('')}</tbody></table><p>Reference links open online; template geometry is included for offline use.</p><ul><li><a href="https://greenshoegarage.com/projects/copperbench/" target="_blank" rel="noopener noreferrer">COPPERBENCH · source presets</a></li>${s.sources.map((url,i)=>`<li><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} · reference ${i+1}</a></li>`).join('')}</ul>`;
 }catch(e){W.showFormError(e);}
}
document.addEventListener('click',e=>{
 if(e.target.closest('[data-pcb=templates]'))open();
 if(e.target.closest('[data-template=apply]')){const id=$('#boardTemplateFamily').value,rotation=Number($('#boardTemplateRotation').value),holes=$('#boardTemplateHoles').checked;
  if(W.safeEdit(()=>{CB.applyBoardTemplate(p,id,{rotation,holes});selected=null;route=null;wire=null;},'Board template applied. Review component and edge clearances.')){closeDialog();fit();}
 }
});
document.addEventListener('change',e=>{if(['boardTemplateFamily','boardTemplateRotation','boardTemplateHoles'].includes(e.target.id))preview();});
Circuitbench.boardTools.templates=open;
})();
