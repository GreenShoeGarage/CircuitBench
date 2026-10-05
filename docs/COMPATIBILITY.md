# v1.0 compatibility contract

## CIRCUITBENCH files

Schema 2 is authoritative. Schema 1 migrates in memory, preserving coordinates, footprints, nets and copper. New fields include pad shapes, sheet membership and assembly defaults; explicit wires are generated from the legacy topology. Legacy net assignments become explicit labels, so deleting migrated wires does not disconnect those labels. Opening files does not overwrite their sources.

The graph uses stable component/pin and junction identities. Symbols/footprints must have one-to-one matching pin numbers; repeated physical pads with the same number are unsupported. Libraries use `format: circuitbench-library`, `schema: 1` with separate symbol, footprint, device and block collections. This is not a native KiCad or LibrePCB library format.

## KiCad board interchange

Export targets board format `20221018`. Native verification used **KiCad 7.0.11**. This is a two-layer PCB subset, not a complete project round trip. Newer files are accepted only when their geometry fits the supported parser and validator. `.kicad_sch`, `.kicad_pro`, external libraries/models and rule files are not imported.

| Feature | Export | Import |
| --- | --- | --- |
| Front/back footprints and references | Yes | Yes; duplicate references diagnosed |
| Rotation and back-side pad geometry | Yes | Yes, including absolute pad angles |
| Round, rectangular and oval pads | Yes | Yes |
| Plated holes and oval pad slots | Yes | Yes; offset drills unsupported |
| SMD on the placement side | Yes | Yes; unusual layer sets rejected |
| Straight tracks and through vias | Yes | Yes |
| Polygon/rectangular boards and cutouts | Closed Edge.Cuts lines | Closed supported contours; normalized origin |
| Circular outline | Polygonized geometry | 96-segment conversion with diagnostic |
| Board silk text/lines | Native text/lines | Restricted font; typography diagnostic |
| Footprint silk graphics | Assembly metadata only | Omitted with warning; regenerate/inspect |
| Copper zones | Source polygons/rules | Regenerated fill with warning |
| Assembly bodies | Fab/courtyard envelopes, height metadata | Envelopes; no external models |
| Inner layers, blind/micro vias, copper arcs | Unsupported | Blocking diagnostics |
| Roundrect/custom pads, copper graphics, keepouts | Unsupported | Blocking diagnostics |
| Per-pad/footprint manufacturing/rule overrides | Unsupported | Blocking diagnostics |
| Original schematic, symbols and project rules | Not exported | Not reconstructed |

**Refill exported zones in KiCad**, inspect connectivity and run native checks before using KiCad manufacturing output. CIRCUITBENCH's fabrication files use its own calculated fill. Zone priorities/clearances do not reproduce KiCad's full rules. Settings outside the explicitly supported subset are not preserved.

Text changes font, justification/baseline and stroke appearance on import. Pad dimensions/transforms were independently checked in native KiCad; that does not prove every possible input is supported. Generated schematic terminals are footprint pin data, not a reconstruction of the original schematic or verified electrical roles.

Every import has a preview. Warnings remain in the project/report. Blocking diagnostics mean omitted or unrepresentable geometry; such imports are for inspection and cannot export fabrication/native replacement boards. Complete unsupported designs in their original tool. Removing diagnostics does not repair omitted geometry.

## Manufacturing conventions

Gerber X2 uses metric 4.6 coordinates and explicit dark/clear regions. Pad/track curve chord deviation is nominally below 0.002 mm; offset arc tolerance is 0.002 mm; polygon operations use a 0.0001 mm integer grid. Excellon coordinates round to 0.0001 mm; slots use G85. Bottom-left origin, top view, both sides. Do not mirror bottom Gerbers. Vias are untented and mask expansion is uniform per project.

Connectivity includes plated drill voids and separates fill islands. It is a planar geometry check, not a mechanical/process simulation. Placement CSV rotation is CCW viewed from above; match it to the assembler's convention. Native LibrePCB interchange, SPICE, external STEP, arbitrary copper curves and inner layers are outside this release.

## Development sources

- LibrePCB: <https://librepcb.org/>
- KiCad: <https://www.kicad.org/>
- KiCad board format: <https://dev-docs.kicad.org/en/file-formats/sexpr-pcb/>
- KiCad common format: <https://dev-docs.kicad.org/en/file-formats/sexpr-intro/>
- Gerber authority: <https://www.ucamco.com/en/gerber>
- Three.js: <https://threejs.org/docs/>
- JLCPCB capabilities: <https://jlcpcb.com/capabilities/pcb-capabilities>

The conservative JLCPCB example uses 0.25 mm width/clearance, 0.5 mm edge gap, 0.15 mm annular ring, 0.45 mm hole gap, 0.05 mm mask expansion, 0.15 mm mask web/minimum silk feature and 0.2 mm silk-to-mask gap. These include engineering margin and cover only part of the process. The consulted 2-layer/1 oz published width/space minimum was 0.10/0.10 mm; confirm current order-specific requirements.
