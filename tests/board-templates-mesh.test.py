"""Independent checks of STL exports produced by board-templates.test.cjs."""
from pathlib import Path
import trimesh

root = Path(__file__).resolve().parents[1] / 'test-output' / 'board-templates'
count = 0
for family in ('uno-r3', 'mkr', 'pi40'):
    for part in ('base', 'lid'):
        path = root / f'{family}-{part}.stl'
        mesh = trimesh.load(path, force='mesh')
        assert mesh.is_watertight, path
        assert mesh.is_winding_consistent, path
        assert mesh.volume > 0, path
        assert len(mesh.split()) == 1, path
        count += 1
        print(f'PASS {path.name}: watertight, consistent winding, positive volume, one body')
assert count == 6
print('6 independent template-enclosure STL checks passed')
