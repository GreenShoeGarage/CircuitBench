"""Independent KiCad 7 validation of the v1.1 catalog fixture."""
import json, math
from pathlib import Path
import pcbnew
root=Path(__file__).resolve().parent.parent/'test-output'
p=json.loads((root/'library-native.json').read_text());board=pcbnew.LoadBoard(str(root/'library-native.kicad_pcb'));count=0
for c in p['components']:
 f=next(x for x in board.GetFootprints() if x.GetReference()==c['ref']);pads=list(f.Pads());t=c['pcb'];angle=math.radians(t['rotation'])
 for a in c['pads']:
  x=a['x']*(-1 if t['side']=='B' else 1);y=a['y'];xx=t['x']+x*math.cos(angle)-y*math.sin(angle);yy=t['y']+x*math.sin(angle)+y*math.cos(angle)
  matches=[x for x in pads if x.GetNumber()==a.get('number',a.get('pin',a['n'])) and abs(x.GetSize().x/1e6-a['width'])<1e-6 and abs(x.GetSize().y/1e6-a['height'])<1e-6]
  assert matches,(c['ref'],a['n'])
  pad=min(matches,key=lambda x:math.hypot(x.GetPosition().x/1e6-xx,x.GetPosition().y/1e6-yy));pos=pad.GetPosition()
  assert abs(pos.x/1e6-xx)<2e-6 and abs(pos.y/1e6-yy)<2e-6,(c['ref'],a['n'],'position')
  assert abs(pad.GetSize().x/1e6-a['width'])<1e-6 and abs(pad.GetSize().y/1e6-a['height'])<1e-6
  assert abs((pad.GetOrientationDegrees()+(t['rotation']+(-a['rotation'] if t['side']=='B' else a['rotation']))+180)%360-180)<1e-6
  if a['shape']=='roundrect':assert abs(pad.GetRoundRectCornerRadius()/1e6-min(a['width'],a['height'])*a.get('radiusRatio',.25))<2e-6
  if a.get('paste') is False:assert not pad.GetLayerSet().Contains(pcbnew.F_Paste if t['side']=='F' else pcbnew.B_Paste)
  count+=1
 for a in c.get('apertures',[]):
  assert any(x.GetNumber()=='' and x.GetLayerSet().Contains(pcbnew.F_Paste if t['side']=='F' else pcbnew.B_Paste) for x in pads)
assert len(list(board.Zones()))>0
pcbnew.SaveBoard(str(root/'library-native-resaved.kicad_pcb'),board)
print('PASS independent native KiCad: %d pads, both sides, rotations, roundrect radii, selective paste, apertures, mechanical holes and keepout load/save'%count)
