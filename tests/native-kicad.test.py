"""Run with pcbnew from KiCad 7 available to Python; verifies native pad geometry."""
import json,math
from pathlib import Path
import pcbnew
root=Path(__file__).resolve().parent.parent/'test-output'
p=json.loads((root/'native-fixture.json').read_text());b=pcbnew.LoadBoard(str(root/'native-fixture.kicad_pcb'))
for c in p['components']:
    f=next(f for f in b.GetFootprints() if f.GetReference()==c['ref'])
    for a in c['pads']:
        pad=next(x for x in f.Pads() if x.GetNumber()==a['n']);pos=pad.GetPosition();t=c['pcb'];ang=math.radians(t['rotation']);x=a['x']*(-1 if t['side']=='B' else 1);y=a['y']
        xx=t['x']+x*math.cos(ang)-y*math.sin(ang);yy=t['y']+x*math.sin(ang)+y*math.cos(ang)
        assert abs(pos.x/1e6-xx)<2e-6
        assert abs(pos.y/1e6-yy)<2e-6
        assert abs(pad.GetSize().x/1e6-a['width'])<1e-6
        assert abs(pad.GetSize().y/1e6-a['height'])<1e-6
        expected=-(t['rotation']+(-a['rotation'] if t['side']=='B' else a['rotation']))
        assert abs((pad.GetOrientationDegrees()-expected+180)%360-180)<1e-6
        print('PASS native KiCad',c['ref'],a['n'],'position, size and angle')
pcbnew.SaveBoard(str(root/'native-resaved.kicad_pcb'),b)
print('PASS native board load and save')
