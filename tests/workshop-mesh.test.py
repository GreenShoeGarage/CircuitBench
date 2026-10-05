"""Independent exported STL/3MF inspection using trimesh and stdlib XML."""
from pathlib import Path
import json,zipfile,xml.etree.ElementTree as ET
import numpy as np
import trimesh
root=Path(__file__).resolve().parents[1]/'test-output/workshop'
manifest=json.loads((root/'manifest.json').read_text());count=0
for case in manifest:
    folder=root/case['name'];world=json.loads((folder/'world.json').read_text())
    expected={p['id']:p for p in world['parts']}
    for part in case['parts']:
        mesh=trimesh.load_mesh(folder/(part+'.stl'),process=True)
        assert mesh.is_watertight and mesh.is_winding_consistent and mesh.volume>0,(case['name'],part)
        assert len(mesh.split())==1,(case['name'],part,'disconnected')
        assert abs(mesh.volume-expected[part]['volume'])<max(.02,mesh.volume*1e-5)
        count+=1
    with zipfile.ZipFile(folder/'enclosure.3mf') as z:
        tree=ET.fromstring(z.read('3D/3dmodel.model'))
    assert tree.attrib['unit']=='millimeter'
    ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
    objects=tree.findall('m:resources/m:object',ns)
    assert len(objects)==len(expected)
    for obj in objects:
        verts=[[float(e.attrib[k]) for k in ['x','y','z']] for e in obj.findall('m:mesh/m:vertices/m:vertex',ns)]
        faces=[[int(e.attrib[k]) for k in ['v1','v2','v3']] for e in obj.findall('m:mesh/m:triangles/m:triangle',ns)]
        m=trimesh.Trimesh(vertices=verts,faces=faces,process=True)
        assert m.is_watertight and m.is_winding_consistent and len(m.split())==1
        assert obj.attrib.get('name')
for mode in ['blind','through','solid']:
    case=json.loads((root/('support-'+mode)/'world.json').read_text());base=next(p for p in case['parts'] if p['id']=='base');m=trimesh.Trimesh(**{'vertices':base['mesh']['vertices'],'faces':base['mesh']['triangles']})
    top=case['dimensions']['boardZ'];floor=2.4
    points=[[10,-20,floor/2],[10,-20,top-.3],[12.5,-20,top-.3]]
    inside=m.contains(points).tolist()
    assert inside==({'blind':[True,False,True],'through':[False,False,True],'solid':[True,True,True]}[mode]),(mode,inside)
print(f'PASS independent trimesh inspection: {count} STL parts and {len(manifest)} named 3MF assemblies; blind/through/solid material probes passed.')
