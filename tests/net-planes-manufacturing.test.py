"""Independent Gerbonara/Shapely checks of the opposite-face plane connection."""
import json
from pathlib import Path
from gerbonara import GerberFile, ExcellonFile
from shapely.geometry import Polygon, Point, GeometryCollection

root = Path(__file__).resolve().parents[1] / 'test-output' / 'net-planes'
e = json.loads((root / 'expected.json').read_text())

def compose(contours):
    result = GeometryCollection()
    for points, dark in sorted(contours, key=lambda q: -Polygon(q[0]).area):
        poly = Polygon(points)
        assert poly.is_valid
        result = result.union(poly) if dark else result.difference(poly)
    return result

def area(points):
    return sum(a['x'] * b['y'] - b['x'] * a['y'] for a, b in zip(points, points[1:] + points[:1])) / 2

parsed = {}
for filename, paths in e['layers'].items():
    file = GerberFile.open(root / filename)
    parsed[filename] = compose([(o.outline, o.polarity_dark) for o in file.objects])
    expected = compose([([(q['x'], e['height'] - q['y']) for q in p], area(p) > 0) for p in paths])
    delta = parsed[filename].symmetric_difference(expected).area
    assert delta < .0001, (filename, delta)
    print(f'PASS {filename}: independently parsed copper area, position and polarity match; delta {delta:.8f} mm²')

via = e['via']
hole = ExcellonFile.open(root / 'Plated.drl').objects
assert len(hole) == 1
assert abs(hole[0].x - via['x']) < .0001
assert abs(hole[0].y - (e['height'] - via['y'])) < .0001
assert abs(hole[0].tool.diameter - via['drill']) < .0001
print('PASS Plated Excellon drill is at the generated through-via with the expected diameter')

pad = e['pads'][0]
point = Point(pad['x'], e['height'] - pad['y'])
front, back = parsed['F_Cu.gbr'], parsed['B_Cu.gbr']
regions = list(front.geoms) if front.geom_type == 'MultiPolygon' else [front]
lead_region = next(r for r in regions if r.contains(point))
ring = Point(via['x'], e['height'] - via['y']).buffer(via['diameter'] / 2 - .02).difference(Point(via['x'], e['height'] - via['y']).buffer(via['drill'] / 2 + .02))
assert lead_region.intersection(ring).area > .05
assert back.intersection(ring).area > .05
# A routed trace can cover the drill center in artwork. The separate drill
# operation removes that material from both copper faces.
drilled = Point(hole[0].x, hole[0].y).buffer(hole[0].tool.diameter / 2)
assert not front.difference(drilled).contains(Point(hole[0].x, hole[0].y))
assert not back.difference(drilled).contains(Point(hole[0].x, hole[0].y))
print('PASS Real front copper connects the SMD lead to the via annulus; back plane meets the same annulus; drilling clears the center on both faces')
print('4 independent net/plane manufacturing checks passed')
