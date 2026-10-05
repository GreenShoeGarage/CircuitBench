"""Independent Gerbonara/Shapely checks of artwork and edited boundary exports."""
import json, math
from pathlib import Path
from gerbonara import GerberFile
from shapely.geometry import Polygon, GeometryCollection, LineString
from shapely.ops import unary_union
root=Path(__file__).resolve().parent.parent/'test-output'/'board-editing'
p=json.loads((root/'artwork.json').read_text())
def artwork(a,gerber=False):
    paths=[];r=math.radians(a['rotation'])
    for x,y,w,h in a['runs']:
        points=[]
        for u,v in [(x,y),(x+w,y),(x+w,y+h),(x,y+h)]:
            xx=(u/a['pixelWidth']-.5)*a['sizeX']*(-1 if a['mirror'] else 1)
            yy=(v/a['pixelHeight']-.5)*a['sizeY']
            qx=a['x']+xx*math.cos(r)-yy*math.sin(r)
            qy=a['y']+xx*math.sin(r)+yy*math.cos(r)
            points.append((qx,p['board']['height']-qy if gerber else qy))
        paths.append(Polygon(points))
    return unary_union(paths)
for side in ['F','B']:
    result=GeometryCollection()
    g=GerberFile.open(root/(side+'_SilkS.gbr'))
    for obj in g.objects:
        polygon=Polygon(obj.outline)
        assert polygon.is_valid,'Self-touching region in artwork'
        result=result.union(polygon) if obj.polarity_dark else result.difference(polygon)
    expected=unary_union([artwork(a,True) for a in p['silk'] if a['layer']==side])
    delta=result.symmetric_difference(expected).area
    assert delta<.004,(side,delta)
    if side=='F':
        assert abs(result.area-128)<.0001
        assert sum(len(poly.interiors) for poly in result.geoms)==2
    print('PASS independent Gerber '+side+' artwork: area, holes, islands, rotation and handedness; delta %.6f mm²'%delta)
g=GerberFile.open(root/'Edge_Cuts.gbr')
actual=[LineString([(a.x1,a.y1),(a.x2,a.y2)]) for a in g.objects]
expected=[]
for poly in [p['board']['outline']]+[c['points'] for c in p['cutouts']]:
    for a,b in zip(poly,poly[1:]+poly[:1]):
        expected.append(LineString([(a['x'],p['board']['height']-a['y']),(b['x'],p['board']['height']-b['y'])]))
assert len(actual)==len(expected)
assert unary_union(actual).hausdorff_distance(unary_union(expected))<1e-6
print('PASS independent Gerber edited outer boundary and retained cutout positions')
