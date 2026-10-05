from pathlib import Path
import json, base64
from build_enclosure_workshop import build as build_workshop
p=Path(__file__).parent
html=(p/'index.src.html').read_text()
for token,name in [('STYLE','style.css'),('CORE','core.js'),('APP','app.js')]:
    value=(p/name).read_text()
    if token=='CORE':
        value='\n'.join((p/n).read_text() for n in ['vendor/clipper.js','core.js','model.js','geometry.js','eda.js','kicad.js','routing.js','blocks.js','hardening.js','library-engine.js','board-editing.js','board-templates.js','enclosure.js','enclosure-solid.js','enclosure-workshop/core.js','enclosure-workshop/model.js','enclosure-workshop/system.js','enclosure-workshop/workflow.js','enclosure-workshop/integration-model.js','enclosure-adapter.js','catalog.js','vendor/jszip.js','vendor/viewer.js'])
    if token=='APP':
        worker='\n'.join((p/n).read_text() for n in ['vendor/clipper.js','core.js','model.js','geometry.js','eda.js','kicad.js','routing.js','blocks.js','hardening.js','library-engine.js','board-editing.js','board-templates.js','enclosure.js','library-worker-entry.js'])
        value+='\nconst CB_LIBRARY_WORKER_SOURCE='+json.dumps(worker).replace('</','<\\/')+';\n'
        enclosure_worker=(p/'vendor/manifold.js').read_text()+'\nconst CB_MANIFOLD_WASM='+json.dumps(base64.b64encode((p/'vendor/manifold.wasm').read_bytes()).decode())+';\n'+(p/'enclosure-solid.js').read_text()+'\n'+(p/'enclosure-worker-entry.js').read_text()
        value+='\nconst CB_ENCLOSURE_WORKER_SOURCE='+json.dumps(enclosure_worker).replace('</','<\\/')+';\n'
        value+='\nconst CB_ENCLOSURE_WORKSHOP_HTML='+json.dumps(build_workshop(p)).replace('<','\\u003c')+';\n'
        value+='\n'+'\n'.join((p/n).read_text() for n in ['workbench.js','board-tools.js','advanced-ui.js','release-ui.js','library-render.js','library-store.js','library-ui.js','pcb-ui.js','board-templates-ui.js','enclosure-ui.js','enclosure-workshop-ui.js'])
    html=html.replace('/*'+token+'*/',value)
(p/'index.html').write_text(html)
print('Built self-contained index.html')
