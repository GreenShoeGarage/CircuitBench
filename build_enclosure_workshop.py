"""Embed the adapted enclosure editor and offline Manifold worker."""
from pathlib import Path
import json,base64
def build(root):
    p=root/'enclosure-workshop'
    s=(p/'shell.html').read_text()
    s=s.replace('<head>','<head><!--\n'+(p/'CASEBENCH-LICENSE.txt').read_text()+'\n-->')
    modules=[('STYLE','style.css'),('CORE','core.js'),('ARCHIVE','archive.js'),('MODEL','model.js'),('SYSTEM','system.js'),('WORKFLOW','workflow.js'),('SOLID','solid.js'),('MARKINGS','markings.js'),('FEATURES','features.js'),('CHECKS','checks.js'),('GEOMETRY','geometry.js'),('SYSTEM_GEOMETRY','system-geometry.js'),('WORKFLOW_GEOMETRY','workflow-geometry.js'),('EXPORT','export.js'),('VIEWER','viewer.js'),('ARTWORK','artwork.js'),('APP','app.js')]
    for label,name in modules:
        text=(p/name).read_text()
        if label=='CORE':text=(root/'vendor/clipper.js').read_text()+'\n'+text
        if label=='WORKFLOW':text+='\n'+(p/'integration-model.js').read_text()
        if label=='APP':
            for label2,name2 in [('DESIGNER','designer.js'),('SYSTEM_UI','system-ui.js'),('WORKFLOW_UI','workflow-ui.js'),('EMBEDDED_UI','embedded-ui.js')]:text=text.replace('/*'+label2+'*/',(p/name2).read_text())
        s=s.replace('/*'+label+'*/',text.replace('</script','<\\/script') if label!='STYLE' else text)
    worker=(root/'vendor/clipper.js').read_text()+'\n'+'\n'.join((p/name).read_text() for name in ['core.js','model.js','system.js','workflow.js','integration-model.js','solid.js','markings.js','features.js','checks.js','geometry.js','system-geometry.js','workflow-geometry.js','manifold-kernel.js'])
    worker+='\n'+(root/'vendor/manifold.js').read_text()
    worker+='\nconst wasm64='+json.dumps(base64.b64encode((root/'vendor/manifold.wasm').read_bytes()).decode())+';'
    worker+='''
let kernelReady=null;
self.onmessage=async function(e){let id=e.data.id;try{
 if(!kernelReady)kernelReady=CBManifold.default({wasmBinary:Uint8Array.from(atob(wasm64),c=>c.charCodeAt(0))}).then(api=>{api.setup();CBInstallManifold(CaseSolid,api);});await kernelReady;
 let progress=message=>self.postMessage({id,type:'progress',message});
 let result=e.data.kind==='fit-frame'?CaseGeometry.fitFrame(e.data.project,progress):e.data.kind==='coupon'?CaseGeometry.coupon(e.data.project):e.data.kind.startsWith('target|')?CaseGeometry.targetedCoupon(e.data.project,...e.data.kind.split('|').slice(1)):CaseGeometry.build(e.data.project,progress);
 result.kernel='Manifold 3.5.4';self.postMessage({id,type:'result',result});
}catch(err){self.postMessage({id,type:'error',message:err.message,featureId:err.featureId||null,stage:err.stage||null});}};
'''
    s=s.replace('/*WORKER*/','window.CaseWorkerSource='+json.dumps(worker).replace('<','\\u003c')+';')
    s=s.replace('/*EXAMPLES*/','window.CaseExamples=[];').replace('/*DEMOS*/','window.CaseDemos=[];')
    s=s.replace('<h1>CASEBENCH</h1>','<h1>Enclosure</h1>').replace('<span class="version">v2.3.1</span>','<span class="version">CIRCUITBENCH</span>')
    s=s.replace('CASEBENCH · Copperbench mechanical workbench','CIRCUITBENCH · Enclosure workshop')
    s=s.replace('/*HOST_STYLE*/','')
    s=s.replace('</style>','\n.topbar .scope,.topbar .brand small{display:none}.topbar{min-height:62px}.brand h1{font-size:20px}.topbar .version{font-size:10px}.drawer-bottom #localNote{font-size:11px}@media(max-width:680px){.topbar .brand{display:none}.topbar .version{display:none}.topbar .actions{width:100%;justify-content:space-between}.topbar{padding:8px}.topbar button{padding:8px}.topbar .save-indicator{max-width:90px;font-size:10px}}\n</style>',1)
    return s
