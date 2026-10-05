"""Independent printable STL verification using trimesh; no app geometry calls."""
import json, zipfile
from pathlib import Path
import numpy as np
import trimesh
root=Path(__file__).resolve().parent.parent/'test-output'/'enclosure'
p=json.loads((root/'reference-project.json').read_text());q=json.loads((root/'reference-plan.json').read_text());e=p['enclosure']
meshes={name:trimesh.load(root/(name+'.stl'),force='mesh') for name in ['base','lid','through','solid-posts','raised']}
for name,m in meshes.items():
    assert m.is_watertight and m.is_winding_consistent,(name,'open or inconsistent mesh')
    assert m.volume>0 and len(m.split())==1,(name,'disconnected mesh')
    assert abs(m.bounds[0][2])<1e-6,(name,'not flat on print bed')
    assert np.allclose(m.extents[:2],[70,50],atol=1e-5)
    print('PASS independent STL',name,'watertight, positive-volume, one solid, flat bed, XY dimensions')
assert abs(meshes['base'].extents[2]-24.6)<1e-5
assert abs(meshes['lid'].extents[2]-4)<1e-5
assert abs(meshes['raised'].extents[2]-32.6)<1e-5
# Test actual material at wall/floor opening centers and adjacent solid areas.
base=meshes['base']
voids=[[35,1,12],[40,49,14],[1,25,14],[69,25,14],[35,35,1]]
assert not base.contains(voids).any(), 'A punchout does not pass through its face'
material=[[20,1,12],[20,49,14],[1,8,14],[69,8,14],[25,35,1]]
assert base.contains(material).all(), 'Unexpected missing wall / floor'
assert not meshes['lid'].contains([[35,25,1]]).any()
assert meshes['lid'].contains([[15,25,1]]).all()
print('PASS independent STL all six face openings cut through in the expected positions')
for m in q['mounts']:
    x,y=m['x'],m['y']
    assert base.contains([[x,y,1],[x+2,y,5]]).all()
    assert not base.contains([[x,y,5]]).any()
    assert not meshes['through'].contains([[x,y,1],[x,y,5]]).any()
    assert meshes['solid-posts'].contains([[x,y,1],[x,y,5]]).all()
print('PASS independent STL four mounting-hole centers, fused standoffs and blind / through / solid bore styles')
# Assembled lid's locating lip fits inside the base cavity with the configured gap.
inset=e['wall']+e['fit'];lip_z=e['lid']+e['lipDepth']/2
assert meshes['lid'].contains([[inset+e['lipWall']/2,25,lip_z]]).all()
assert not meshes['lid'].contains([[inset-.05,25,lip_z],[inset+e['lipWall']+.05,25,lip_z]]).any()
print('PASS independent STL lid locating lip and per-side clearance')
with zipfile.ZipFile(root/'binary-test.zip') as z:
    assert z.read('base.stl')==(root/'base.stl').read_bytes()
    assert z.testzip() is None
print('PASS independent ZIP binary STL bytes and CRC')
