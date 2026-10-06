/* MIT License

Copyright (c) 2026 Green Shoe Garage

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
/* CIRCUITBENCH board shape presets. GPL-3.0-only.
 * Nominal geometry adapted from COPPERBENCH 1.7.1 (MIT, Green Shoe Garage).
 * See docs/BOARD-TEMPLATES.md and vendor/COPPERBENCH-LICENSE.txt.
 */
(function(root){'use strict';
const C=typeof module!=='undefined'?require('./board-editing'):root.CB;
const sourced=typeof module!=='undefined'?require('./board-template-data'):root.CBBoardTemplateData;
const definitions=[
 {id:'uno-r3',name:'Arduino Uno R3',tag:'Shield / carrier',width:68.58,height:53.34,radius:0,
  points:[[0,0],[64.516,0],[66.04,1.524],[66.04,12.954],[68.58,15.494],[68.58,48.26],[66.04,50.8],[66.04,53.34],[0,53.34]],
  holes:[[15.24,2.54],[13.97,50.8],[66.04,17.78],[66.04,45.72]],drill:3.2,
  note:'Uno R3 reference, USB at the left in the unrotated front view. Check your actual Uno or clone before fabrication; this outline does not establish compatibility with Uno R4, Uno Q or Mega.',
  sources:['https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf','https://raw.githubusercontent.com/KiCad/kicad-footprints/master/Module.pretty/Arduino_UNO_R3.kicad_mod']},
 {id:'mkr',name:'Arduino MKR 28-pin',tag:'Shield / carrier',width:61.5,height:25,radius:2,
  holes:[[2.31,2.31],[59.19,2.31],[2.31,22.69],[59.19,22.69]],drill:2.25,
  note:'Nominal WiFi 1010 envelope, USB at the left in the unrotated front view. Body size and these optional mounting-hole offsets need review against your exact MKR variant.',
  sources:['https://docs.arduino.cc/resources/pinouts/ABX00012-full-pinout.pdf','https://docs.arduino.cc/resources/datasheets/ABX00023-datasheet.pdf']},
 {id:'pi40',name:'Raspberry Pi 40-pin',tag:'HAT-layout / carrier',width:65,height:56,radius:3,
  holes:[[3.5,3.5],[61.5,3.5],[3.5,52.5],[61.5,52.5]],drill:2.7,
  note:'65 × 56 mm legacy-style HAT outline, with GPIO along the top in the unrotated front view. This is an add-on board shape, not the 85 mm Pi host PCB, Pico, Compute Module or HAT/HAT+ certification.',
  sources:['https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-mechanical-drawing.pdf','https://datasheets.raspberrypi.com/hat/hat-plus-specification.pdf']}
 ,sourced.gigaR1WiFi
];
const get=id=>{const d=definitions.find(d=>d.id===id);if(!d)throw Error('Choose a supported board template.');return d;};
const same=(a,b)=>Math.abs(a-b)<.00001;
function boardTemplate(id,{rotation=0}={}){
 const d=get(id);if(![0,90,180,270].includes(rotation))throw Error('Template rotation must be 0, 90, 180 or 270 degrees.');
 const transform=([x,y])=>{let q=rotation===0?[x,y]:rotation===90?[d.height-y,x]:rotation===180?[d.width-x,d.height-y]:[y,d.width-x];return {x:C.round(q[0]),y:C.round(q[1])};};
 let points=d.points;
 // Match COPPERBENCH's 16 straight segments per quarter circle. All downstream
 // consumers use this same polygon, avoiding preview-only rounded corners.
 if(!points){points=[];const r=d.radius;for(const [x,y,start] of [[d.width-r,r,-90],[d.width-r,d.height-r,0],[r,d.height-r,90],[r,r,180]])for(let i=0;i<=16;i++){let t=(start+i*90/16)*Math.PI/180;points.push([Math.round((x+Math.cos(t)*r)*10000)/10000,Math.round((y+Math.sin(t)*r)*10000)/10000]);}}
 return {...C.clone(d),rotation,width:rotation%180?d.height:d.width,height:rotation%180?d.width:d.height,outline:points.map(transform),holes:d.holes.map((q,i)=>({...transform(q),drill:d.drill,index:i}))};
}
function unchanged(h){const t=h.boardTemplate;return t&&same(h.x,t.x)&&same(h.y,t.y)&&same(h.drill,t.drill)&&h.slot===0&&!h.plated;}
function applyBoardTemplate(p,id,{rotation=0,holes=true}={}){
 if(typeof holes!=='boolean')throw Error('Mounting holes must be enabled or disabled.');
 const shape=boardTemplate(id,{rotation}),next=C.validate(p),owned=next.holes.filter(unchanged);
 // Only replace untouched holes from a previous preset. Edited holes become
 // ordinary board objects and retain their identity and physical placement.
 next.holes=next.holes.filter(h=>!owned.includes(h));for(const h of next.holes)delete h.boardTemplate;
 C.setOutline(next,shape.outline);
 if(holes)for(const h of shape.holes){
  if(C.holes(next).some(a=>same(a.x,h.x)&&same(a.y,h.y)&&same(a.drill,h.drill)&&!a.slot&&!a.plated))continue;
  let old=owned.find(a=>a.boardTemplate.family===id&&a.boardTemplate.index===h.index);
  next.holes.push({id:old?.id||C.uid(),x:h.x,y:h.y,drill:h.drill,slot:0,rotation:0,plated:false,boardTemplate:{family:id,revision:1,index:h.index,x:h.x,y:h.y,drill:h.drill}});
 }
 next.board.template={family:id,revision:1,rotation,holes};
 const validated=C.validate(next);Object.assign(p,validated);return p;
}
const validate=C.validate;
C.validate=function(input){const p=validate(input),check=t=>{if(!t||typeof t!=='object'||t.revision!==1||!definitions.some(d=>d.id===t.family))throw Error('Invalid board template metadata.');};
 if(p.board.template!==undefined){const t=p.board.template;check(t);if(![0,90,180,270].includes(t.rotation)||typeof t.holes!=='boolean')throw Error('Invalid board template options.');}
 for(const h of p.holes)if(h.boardTemplate!==undefined){const t=h.boardTemplate;check(t);if(!Number.isInteger(t.index)||t.index<0||t.index>=get(t.family).holes.length||![t.x,t.y,t.drill].every(Number.isFinite)||t.x<0||t.y<0||t.x>500||t.y>500||t.drill<.2||t.drill>30)throw Error('Invalid template hole provenance.');}
 return p;
};
Object.assign(C,{boardTemplates:()=>C.clone(definitions),boardTemplate,applyBoardTemplate});
if(typeof module!=='undefined')module.exports=C;else root.CB=C;
})(typeof globalThis!=='undefined'?globalThis:this);
