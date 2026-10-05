"""Independent Gerbonara/Shapely validation; run manufacturing-fixture.cjs first."""
import json, math
from pathlib import Path
from gerbonara import GerberFile, ExcellonFile
from shapely.geometry import Polygon, GeometryCollection
from shapely.ops import unary_union
ROOT=Path(__file__).resolve().parent.parent/'test-output'/'manufacturing-complex'
e=json.loads((ROOT/'expected.json').read_text())
def signed_area(points):
    return sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(points,points[1:]+points[:1]))/2
def compose(contours):
    result=GeometryCollection()
    for points,dark in sorted(contours,key=lambda a:-Polygon(a[0]).area):
        poly=Polygon(points)
        assert poly.is_valid
        result=result.union(poly) if dark else result.difference(poly)
    return result
for name,paths in e['layers'].items():
    g=GerberFile.open(ROOT/name)
    parsed=compose([(a.outline,a.polarity_dark) for a in g.objects])
    expected=compose([([(q['x'],e['height']-q['y']) for q in poly],signed_area([(q['x'],q['y']) for q in poly])>0) for poly in paths])
    delta=parsed.symmetric_difference(expected).area
    assert delta<.0001,(name,delta)
    print('PASS',name,'independent polygon area/position/polarity; difference',round(delta,8),'mm²')
for name,holes in e['drills'].items():
    g=ExcellonFile.open(ROOT/name)
    assert len(g.objects)==len(holes),(name,len(g.objects),len(holes))
    remaining=list(g.objects)
    for h in holes:
        def center(o):
            return ((o.x1+o.x2)/2,(o.y1+o.y2)/2) if hasattr(o,'x1') else (o.x,o.y)
        o=min(remaining,key=lambda o:math.dist(center(o),(h['x'],h['y'])))
        assert math.dist(center(o),(h['x'],h['y']))<.00015
        assert abs(o.aperture.diameter-h['diameter'])<.0001
        if h['slot']>h['diameter']:
            assert hasattr(o,'x1')
            assert abs(math.hypot(o.x2-o.x1,o.y2-o.y1)+h['diameter']-h['slot'])<.0002
            angle=math.degrees(math.atan2(o.y2-o.y1,o.x2-o.x1))
            assert abs((angle-h['angle']+90)%180-90)<.02
        remaining.remove(o)
    print('PASS',name,'hole counts, positions, diameters, slot lengths and angles')
g=GerberFile.open(ROOT/'Edge_Cuts.gbr')
assert len(g.objects)==sum(len(p) for p in e['outlines'])
print('PASS Edge_Cuts.gbr closed outline and cutout segment counts')
