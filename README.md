# CIRCUITBENCH 1.8.2

**A self-hosted schematic and two-layer PCB workbench.**  
Green Shoe Garage · Field Instrument · GNU GPL v3 only

Place → connect → lay out → route → inspect → export.

CIRCUITBENCH combines an approachable component workflow with linked schematic and board editing in a local-first browser application. It is an original implementation inspired by LibrePCB and KiCad, not a browser port, fork, endorsed product or feature-equivalent replacement for either desktop suite.

**v1.8.2 adds Arduino GIGA R1 WiFi to Board templates**, including its CAD-derived stepped outline, six mounting holes, quarter-turn rotations, and six corresponding enclosure supports. See `docs/GIGA-R1-WIFI-SOURCE.md` for dimensions and source attribution.

**v1.8.1 added PCB board colors.** Open **PCB layout → Board color**, choose a preset or custom color, then **Apply color**. The choice applies to both sides, the 3D assembly, enclosure previews and exported PCB SVGs. It is saved in project JSON and local autosave, supports undo/redo, and keeps older projects green. Labels adjust automatically for light colors. Solder-mask ordering colors must still be selected with your fabricator; Gerber and drill geometry do not change.

**v1.8 adds quick ground, power and signal planes, lead-to-net assignment, and checked wire/plane connection previews inspired by COPPERBENCH.** Open **PCB layout → Nets & planes** to get started. Existing board templates and enclosure tools remain included. No board or enclosure has been physically fabricated or fit-tested for this release.

## Run and self-host

Open **`index.html`** directly in a modern browser. It contains the application, styles, 148 mapped devices, 148 symbols, 190 footprints, geometry libraries, 3D renderer and a worker-based solid modeler. There are no runtime packages, CDN calls, accounts, backend services, telemetry or project uploads.

For self-hosting, put **`index.html` and `sw.js`** together in a static directory such as `/circuitbench/`. Visit it over HTTPS. No build, database or environment variables are needed. The HTML works alone; the service worker enables installed offline reload after an initial HTTPS or localhost visit. Example Nginx and Caddy configurations are in `deploy/`.

For local serving, run `python3 -m http.server 8000` in this directory and open <http://localhost:8000/>. On Windows, `py -m http.server 8000` may be appropriate. Deploy only the two runtime files if you do not want to expose the source/docs directory. This downloadable release has not been deployed to a public server.

To upgrade: export JSON, replace both runtime files together, then reload online. The shell cache is versioned and installation-scoped. Schema 1 projects migrate on load; schema 2 is current. Projects with image artwork require v1.2 or newer. The new enclosure workbench requires v1.6; v1.3 settings migrate on first open and remain as a backup. Retain the same origin to keep browser saves. A custom Content Security Policy must allow the bundled inline scripts/styles and local WebGL, blob workers and WebAssembly compilation; use a tested hash-based policy if required.

## First design

1. First launch opens **Hello, copper**, an intentionally unfinished five-part LED circuit. Use **Project → New empty project** for a blank design. Open `examples/routed-reference.circuitbench.json` for the fully routed software reference.
2. Add parts in **Schematic**. **Connect** follows pin → optional corners → pin, junction or existing wire. **Junction** splits an existing wire. Crossings alone never connect. Endpoints follow their components; authored internal corners stay in place.
3. Select a part and use **Label / power** for named connections. The inspector assigns nets or intentional NC. Matching explicit labels connect across sheets. Deleting unnamed wires recomputes connectivity; matching explicit labels remain connected.
4. **Advanced mode** exposes footprint geometry, pin types, custom symbol positions, body heights and courtyards. **Libraries** saves symbols, footprints and devices. Symbols can have multiple units, and multiple physical pads can map to one logical pin. Create mapped device provides explicit pin-to-pad assignment. Verify actual parts against their datasheets.
5. **Sheets** creates a parent/child sheet tree sharing one PCB. Labels are global; prefix local nets with their sheet name. Child ports explicitly bind an existing local net to a parent/global net. This is a flattened graph with sheet bindings, not native hierarchical schematic interchange.
6. Shift-click parts, or use **Select for block**, then **Blocks** to save a circuit. With no group selected, capture the current sheet. Instances receive unique references and prefixed nets. Explicitly list shared nets. Blocks contain components and internal schematic wires; PCB copper is rerouted after placement.
7. Choose **PCB layout → Board templates** for an Uno R3, MKR, Raspberry Pi HAT-layout or Arduino GIGA R1 WiFi outline and optional mounting holes, or keep a custom board. Then place footprints in **PCB layout** using drag, arrows or numeric properties. Back-side placement mirrors local X coordinates; board-editor rotation is clockwise. Lock settled placements.
8. **Route** begins on an assigned pad/via. Add manual corners and finish on the same net. With assistance enabled, the last segment avoids foreign copper, cutouts and mechanical holes. **Route to pin** searches a whole path. It does not push existing copper. Failure calls for repositioning, another layer or manual routing.
9. To change layers, start a route and click a corner at the intended via. **Via transition** commits that segment, adds a through via and continues on the other layer. **Clean tracks** removes redundant vertices and identical duplicate tracks. Review the result.
10. The PCB toolbar offers **Flip to back** (shortcut **B**), **Text**, **Image**, **Edit outline** and **Board size**. Drag outline corners or enter exact coordinates. Set width, height and thickness; custom outlines scale while components and routing retain their size and position. See `docs/PCB-EDITING.md`. **Board tools** adds cutouts, holes/slots, zones and additional manufacturing silk. **3D assembly** shows board thickness, holes, copper and dimensioned generic bodies, with orbit, top/bottom views, explode and PNG export.
11. **Enclosure** opens a board-derived workbench. Choose the shell and closure, configure standoffs or other retention, add linked punchouts/text/SVG/vents, and review the fit. Access provides connector, LED, display and button assemblies. Print provides fit frames, coupons, STL, 3MF and a complete project ZIP. Advanced mode adds multi-board assemblies and recipes. See `docs/ENCLOSURE-GUIDE.md`. Ready-to-edit sliding, snap and hinge examples are in `examples/enclosure-*.circuitbench.json`.
12. **Review & output** lists findings, BOM, assumptions/evidence and full-object baseline comparison. Export JSON and independently inspect manufacturing files before ordering.

Tracks stay in place when parts move. Displaced connections become airwires; reroute or edit their vertices. Same-layer, same-net copper overlaps connect. Through-hole pads/vias bridge layers; SMD pads exist on their placement side.

## Geometry and manufacturing

Supported: two copper layers; polygon boards/cutouts; round, rectangular and oval pads; straight track segments; through vias; round or slotted plated pad drills; nonplated mechanical holes/slots; polygon zones with solid/thermal pad connections; line, vectorized-text and monochrome-image silkscreen.

Zones regenerate after edits. Earlier zones have priority, same-net vias connect solidly, and separate islands remain separate in connectivity analysis. Nominal pad/track chord deviation is below 0.002 mm; offset arc tolerance is 0.002 mm on a 0.0001 mm integer grid. Clearance comparisons have a 0.002 mm numeric tolerance. Do not design at the edge of fabrication capability.

| File | Contents |
| --- | --- |
| `F_Cu.gbr`, `B_Cu.gbr` | Copper, actual pad outlines and filled zones |
| `F_Mask.gbr`, `B_Mask.gbr` | Positive mask openings around pads and untented vias |
| `F_Paste.gbr`, `B_Paste.gbr` | SMD paste; inset is the smaller of 0.025 mm or 2% of pad width/height |
| `F_SilkS.gbr`, `B_SilkS.gbr` | Explicit text, line and image silk; bottom artwork mirrored for underside reading |
| `Edge_Cuts.gbr` | Closed outer contour and cutouts |
| `Plated.drl`, `Nonplated.drl` | Separate drill files; slots use G85 |
| `BOM.csv`, `Placement.csv`, `Netlist.csv` | Assembly data and pin-level net assignments |
| `project.circuitbench.json`, `checks.json` | Editable source and findings at export |
| `FABRICATION-README.txt` | Dimensions, conventions, assumptions and evidence |

The ZIP has 17 files. Gerbers are X2, metric, 4.6 coordinates. Drills use explicit decimal millimeters. Coordinates use the lower-left board origin. **Do not mirror bottom Gerbers.** Placement rotation is CCW from +X, viewed from the top for both sides; adapt it to your assembler's convention. Body outlines and UI labels are assembly guides; generate manufacturing reference silk deliberately in Board tools.

PNG/JPEG/WebP image import converts dark pixels to ink with a preview, threshold, invert, resolution, physical width, rotation and side controls. The converted image is embedded in project JSON and exported as true geometry to Gerber and KiCad. Transparent pixels stay clear. Image width/position/rotation remain editable after reopening; reimport the original to change threshold/resolution.

Text uses an original vectorized 5 × 7 font: A–Z, digits, spaces and `+ - . / _ :`. Confirm actual footprint dimensions, polarity, pin mapping and rotation conventions. CSV formula-prefix escaping may add an apostrophe; JSON is authoritative.

Schematic/assembly SVG, printable PDF reports, 3D PNG and native `.kicad_pcb` export are separate options. Native interchange is a documented subset; see `docs/COMPATIBILITY.md`.

## Design checks

- Electrical pin roles, NC conflicts, multiple declared signal/power outputs, missing drivers, one-pin nets and child-port direction consistency.
- Actual pad/track/via/zone connectivity, including plated drill voids and separate fill islands.
- Different-net shorts/clearance, net-class track width/clearance and copper-to-board/cutout clearance.
- Annular rings, hole spacing, nonplated-hole copper clearance and holes outside board material.
- Rotated courtyard overlaps, pad/via mask webs, silk-to-mask/edge conflicts and minimum silk feature width.
- Unsupported KiCad import geometry, with blocking diagnostics for incomplete imports.

Generic pins begin passive until their roles are assigned. Courtyards are rectangular body envelopes. Editable rules and the conservative JLCPCB example cover only a documented subset, not complete fabricator certification.

No simulation, voltage/current/rating inference, impedance/length matching, creepage, thermal or solder-joint analysis is implemented. Ordinary design errors require an in-app confirmation before inspection export. Incomplete imports with blocking diagnostics cannot export fabrication or native replacement boards; continue those designs in their original tool.

## Data and recovery

Projects remain on your device. `localStorage` stores the active design and three prior autosaves; explicit JSON export is the durable backup. Instances on the same origin share the CIRCUITBENCH active-project key. Preferences are local. Undo/redo is session-only, capped at 60 actions.

Corrupt saved data is preserved and autosave pauses until you explicitly choose a copy in **Project & recovery**. A conflicting save from another tab also pauses saving. Load the stored design or keep this tab; the competing stored copy is retained in the raw recovery download. Storage quota failures are reported; download JSON to preserve the in-memory design.

Raw recovery downloads contain strings, not directly editable projects. Extract a valid `current`, `previous` or `conflict` string into a project JSON file and open that file. Export recovery records before clearing browser data. The service worker caches the app shell, not project backups.

## Component libraries and the active layer

Search **Add parts**, filter by category, mounting style or pin count, inspect the symbol and package, then **Place**. Devices include passives, LEDs/diodes, transistors, regulators, timers, amplifiers, logic, interfaces, MCUs, sensors, memories, modules, connectors, switches/relays and mounting holes. The original 12 templates remain in a separate expandable section. Variants share one device entry; component values do not inflate catalog counts.

**Active layer** selects F.Cu or B.Cu. The active copper is bright and drawn above the inactive copper; the other side is dimmed and cannot intercept copper clicks. New PCB parts and routes use the chosen side. Uncheck **Show inactive copper (dimmed)** to hide the opposite copper. Use **Flip to back** for a mirrored underside view; the dropdown alone does not flip the view. Changing the dropdown cancels an unfinished route; use **Via transition** to commit a via and continue on the opposite layer.

**Libraries** manages bundled, browser-local and project entries. Import `.kicad_sym`, `.kicad_mod`, a directory, ZIP, or library JSON. Conversion runs in a worker. Review counts and exclusions before saving. An exact native default-footprint name with matching pins can create a device automatically; otherwise use **Create device** and its explicit mapping table. Pin count alone does not establish package compatibility.

**My library** uses IndexedDB independently of the current project. Export a library pack to transfer or back it up. Installing/updating library entries never replaces placed component snapshots. A project carries its actual symbols, pad geometry and source metadata and can reopen without any installed pack. Clearing site data also clears My library. The bundled catalog requires no internet connection; source/datasheet links open externally only when clicked.

Each catalog symbol/footprint includes a pinned release, source URL and source-subset hash. These checks establish source correspondence and mapping consistency, not independent manufacturer approval. Package heights default to an editable **3 mm estimate**; body envelopes and courtyards are approximate. Check electrical ratings, exact ordering suffix, land pattern, package height, assembly orientation and actual fit for your chosen part.

See `docs/LIBRARY-GUIDE.md` for supported features and exclusions. Examples:
- `catalog-power-led.circuitbench.json`: eight catalog parts, 13 routes, zero unrouted connections and zero error findings in the implemented checks.
- `catalog-mcu-sensor.circuitbench.json`: MCU, sensor, reset and I2C pull-ups; intentionally unrouted.

Rebuild the catalog entirely offline with `npm run build:catalog`, then `npm run build`. The curated selection and corresponding upstream definitions are included. `scripts/build-catalog.cjs` documents the original broader source-selection process; routine rebuilds use `scripts/rebuild-catalog.cjs`.

## Limits and accessibility

| Item | Limit |
| --- | --- |
| Board | 5–500 mm per axis; 0.1–10 mm thickness |
| Components / pins | 150 components; 1,024 physical pads per component (144/256-pin regression fixtures) |
| Copper | 500 tracks; 200 vias; 200 points per track; 2,000 pad/segment/via primitives total |
| Nets / sheets | 256 nets; 40 sheets; 100 child ports |
| Drawing | 1,000 wires; 500 junctions; 300 labels |
| Board objects | 20 zones; 100 mechanical holes; 30 cutouts; 300 silk objects |
| Enclosure | Four parallel PCBs; 160 authored features; 100 openings per vent pattern; 100 manual supports; bounded 120-second geometry worker |
| Files | Project JSON up to 5 MB; library packs up to 50 MB expanded; native library files up to 10 MB each |

Complex fills may pause the browser. Route search is bounded to 180,000 visits and may miss a geometrically possible route; it does not promise shortest or 45° routes. Inner layers, arbitrary curved copper, push-and-shove, external STEP, SPICE and native LibrePCB import are future work.

Light, dark and high-contrast themes, visible focus, labeled controls, modal focus containment, status announcements and numeric editing alternatives are included. The canvas has no complete screen-reader geometry model. Mobile panels/basic editing were tested at 390 px; dense PCB work is best on desktop. No pinch gesture is implemented.

| Action | Shortcut |
| --- | --- |
| Select / pan / wire or route | S / H / W |
| Rotate / fit | R / F |
| Nudge | Arrows; Shift = 10 steps |
| Finish route / cancel | Enter / Escape |
| Delete | Delete or Backspace |
| Undo / redo | Ctrl or Command Z / Shift Z |
| Export JSON | Ctrl or Command S |

## Source and tests

The HTML is ready to deploy. After source edits, `python3 build.py` concatenates the checked-in files with Python's standard library. Model extensions follow `core.js`: `model`, `geometry`, `eda`, `kicad`, `routing`, `blocks`, `hardening`, `library-engine`, `board-editing`, `enclosure`, `enclosure-adapter`. `enclosure-workshop/` contains the adapted CASEBENCH feature model/editor; `build_enclosure_workshop.py` embeds its UI and Manifold worker into the main standalone HTML. UI modules follow `app.js`. `viewer-entry.js` builds the already-vendored 3D bundle.

```sh
npm ci
npx playwright install chromium
npm test
# Only after editing the 3D source:
npm run build:viewer
npm run build
```

Set `CHROMIUM_EXECUTABLE` to use an installed browser. `npm run test:enclosure` retains the v1.3 regression suite. `npm run test:workshop` tests the v1.6 feature model, exports and offline browser workflow; `npm run test:workshop-mesh` adds independent STL/3MF inspection. Independent STL checks use `trimesh==4.9.0`, `numpy` and `rtree`: run `npm run test:enclosure-mesh`. The checked-in Manifold JS/WASM require no install at runtime; `npm run build:manifold` refreshes both from the pinned npm dependency. Re-run `npm run build` after rebuilding either vendor bundle. Independent manufacturing tests additionally use `gerbonara==1.6.3` and `shapely`; native tests use KiCad's `pcbnew`. See `docs/TEST-REPORT.md` for release evidence and `docs/ROADMAP.md` for completed batches and outstanding hardware work. No remote Git repository was created.

Copyright © 2026 Michael Parks / Green Shoe Garage. Application: **GPL-3.0-only**, full text in `LICENSE`. Clipper 6.4.2 is Boost-licensed; Three.js is MIT-licensed; Manifold 3.5.4 is Apache-2.0-licensed; notices are in `vendor/`. KiCad 9.0.0 library data is bundled under CC-BY-SA 4.0 with the KiCad exception; see `libraries/LICENSE.txt`. JSZip is MIT-licensed. The integrated enclosure editor is adapted from Green Shoe Garage CASEBENCH 2.3.1 (MIT); its license and upstream BSP notices are retained in `enclosure-workshop/`. Active solid operations use Manifold; the retained primitive/export utilities include adapted CASEBENCH code. No KiCad/LibrePCB application code or logos are bundled.

## Board templates · v1.7

See [Board templates](docs/BOARD-TEMPLATES.md) for source dimensions, hole coordinates, rotation, preservation/Undo behavior and variant limitations. Three empty starters are included as `examples/board-uno-r3.circuitbench.json`, `examples/board-mkr.circuitbench.json` and `examples/board-pi40.circuitbench.json`. These contain mechanical board geometry; add mating connectors from the component library.

Run `npm run test:templates` for the board-preset model, manufacturing, enclosure-solid and offline browser checks.

## Quick nets and planes · v1.8

Use **Nets & planes** for back-side GND or GND on both sides, per-face net selection, custom supply/signal planes, and physical connection status. Pick leads on the board or in the searchable table, assign a named net, then preview wires or a plane connection. Keep adds real checked tracks/vias in one undoable edit. Different-net leads are blocked; stale and cancelled previews cannot change the board.

Read [Nets and planes](docs/NETS-AND-PLANES.md) for the workflow, settings, supported limits and export behavior. `examples/planes-and-wires.circuitbench.json` demonstrates two planes, a via connection and signal wiring. Run `npm run test:nets` for engine/browser checks or `npm run test:nets-manufacturing` for independent Gerbonara/Shapely export checks.

GIGA R1 WiFi mechanical template data in `board-template-data.js` is adapted from Arduino S.r.l. hardware CAD under CC BY-SA 4.0. See `docs/GIGA-R1-WIFI-SOURCE.md` and `vendor/ARDUINO-GIGA-LICENSE.txt`.
