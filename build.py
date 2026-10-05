from pathlib import Path
import json
p=Path(__file__).parent
html=(p/'index.src.html').read_text()
for token,name in [('STYLE','style.css'),('CORE','core.js'),('APP','app.js')]:
    value=(p/name).read_text()
    if token=='CORE':
        value='\n'.join((p/n).read_text() for n in ['vendor/clipper.js','core.js','model.js','geometry.js','eda.js','kicad.js','routing.js','blocks.js','hardening.js','library-engine.js','board-editing.js','catalog.js','vendor/jszip.js','vendor/viewer.js'])
    if token=='APP':
        worker='\n'.join((p/n).read_text() for n in ['vendor/clipper.js','core.js','model.js','geometry.js','eda.js','kicad.js','routing.js','blocks.js','hardening.js','library-engine.js','board-editing.js','library-worker-entry.js'])
        value+='\nconst CB_LIBRARY_WORKER_SOURCE='+json.dumps(worker).replace('</','<\\/')+';\n'
        value+='\n'+'\n'.join((p/n).read_text() for n in ['workbench.js','board-tools.js','advanced-ui.js','release-ui.js','library-render.js','library-store.js','library-ui.js','pcb-ui.js'])
    html=html.replace('/*'+token+'*/',value)
(p/'index.html').write_text(html)
print('Built self-contained index.html')
