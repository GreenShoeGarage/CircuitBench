"""Independent native KiCad geometry verification; no CIRCUITBENCH geometry calls."""
import json, math
from pathlib import Path
import pcbnew
root=Path(__file__).resolve().parent.parent/'test-output'/'board-editing'
p=json.loads((root/'artwork.json').read_text());b=pcbnew.LoadBoard(str(root/'artwork.kicad_pcb'))
expected=[]
for a in p['silk']:
    for x,y,w,h in a['runs']:
        points=[];r=math.radians(a['rotation'])
        for u,v in [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]:
            xx=(u/a['pixelWidth']-.5)*a['sizeX']*(-1 if a['mirror'] else 1);yy=(v/a['pixelHeight']-.5)*a['sizeY']
            points.append((a['x']+xx*math.cos(r)-yy*math.sin(r),a['y']+xx*math.sin(r)+yy*math.cos(r)))
        expected.append((pcbnew.F_SilkS if a['layer']=='F' else pcbnew.B_SilkS,points))
polys=[a for a in b.GetDrawings() if a.GetShape()==pcbnew.SHAPE_T_POLY]
assert len(polys)==len(expected)
for layer,points in expected:
    found=None
    for a in polys:
        if a.GetLayer()!=layer:continue
        q=a.GetPolyShape().COutline(0)
        actual=[(q.CPoint(i).x/1e6,q.CPoint(i).y/1e6) for i in range(q.PointCount())]
        if len(actual)==4 and all(min(math.dist(x,y) for y in actual)<2e-6 for x in points):found=a;break
    assert found is not None,(layer,points)
    assert found.IsFilled()
    polys.remove(found)
assert len([a for a in b.GetDrawings() if a.GetLayer()==pcbnew.Edge_Cuts])==sum(len(poly) for poly in [p['board']['outline']]+[a['points'] for a in p['cutouts']])
pcbnew.SaveBoard(str(root/'artwork-resaved.kicad_pcb'),b)
print('PASS independent native KiCad artwork polygons, front/back placement, rotation, fill, outline and load/save')
