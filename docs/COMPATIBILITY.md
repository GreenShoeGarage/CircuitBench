# v1.2 compatibility contract

## CIRCUITBENCH files

Schema 2 is authoritative. Schema 1 migrates in memory, preserving coordinates, footprints, nets and copper. New fields include pad shapes, sheet membership and assembly defaults; explicit wires are generated from the legacy topology. Legacy net assignments become explicit labels, so deleting migrated wires does not disconnect those labels. Opening files does not overwrite their sources.

The graph uses stable component/pin and junction identities. Logical pins and physical pad IDs are distinct. Multiple pads may share one logical pin; explicit mappings are stored with reusable devices. Symbol units share a single physical footprint. Libraries use `format: circuitbench-library`, `schema: 1` with separate symbol, footprint, device and block collections. Native KiCad symbol/footprint library readers convert the supported subset into this model; see LIBRARY-GUIDE.md.

## KiCad board interchange

Export targets board format `20221018`. Native verification used **KiCad 7.0.11**. This is a two-layer PCB subset, not a complete project round trip. Newer files are accepted only when their geometry fits the supported parser and validator. `.kicad_sch`, `.kicad_pro`, external STEP models and rule files are not imported. Native `.kicad_sym`/`.kicad_mod` library import is a separate workflow from board import.

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

## v1.1 export extensions

Board export additionally writes rounded rectangle pads, repeated pad numbers, selective paste/mask layers, separate paste apertures, component nonplated holes, footprint silkscreen and keepouts. The older board importer remains a bounded subset and can issue blocking diagnostics when reopening these richer exports. Continue those native boards in KiCad or reopen the full CIRCUITBENCH project JSON. Library import and board import have different capability boundaries.


## v1.2 board editing and image extension

The board view preference is stored locally, outside the design. Flipping never mirrors the saved PCB or manufacturing exports. Flip also selects the corresponding active copper layer; changing the copper dropdown independently leaves the viewing orientation intact.

`p.silk` additionally accepts `kind: "image"`: `name`, center `x/y`, physical `sizeX/sizeY`, `rotation`, `layer`, `mirror`, integer `pixelWidth/pixelHeight` and `runs`. Each run is `[pixelX, pixelY, pixelWidth, pixelHeight]`. No original binary image or external URL is stored. Limits: 256 pixels per axis, 6,000 runs per image, 12,000 image runs total, within the existing 300 silk-object / 5 MB project limits. Raster import accepts PNG/JPEG/WebP up to 10 MB and 16 megapixels. Transparent pixels (alpha < 128) are always clear. There is no SVG import or color silk.

Images export as filled geometry on F.SilkS/B.SilkS in Gerber and as filled `gr_poly` rectangles in KiCad. The bounded native board importer does not reconstruct those image objects: it warns about omitted graphics. Reopen the CIRCUITBENCH JSON for a complete editable round trip. KiCad text continues to use native typography, which differs from the app's vector font. v1.1 and earlier reject image-bearing projects; v1.2 continues to read earlier schema 1/2 projects.

Outline editing supports simple closed polygons with 3–200 vertices and no self-intersections. The minimum X and Y remain zero; dimensions are the maximum X/Y. Width/height changes scale only the outer boundary about that origin, independently by axis; components, tracks, vias, holes, cutouts, artwork and zone source boundaries retain their physical dimensions/coordinates. Review reports objects outside the resulting material. Curved outlines are still represented by polygon segments.
