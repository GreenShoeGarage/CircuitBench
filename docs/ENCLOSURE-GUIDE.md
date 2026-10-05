# CIRCUITBENCH enclosure workbench · v1.6

Open **PCB layout → Enclosure**. The workbench uses the current PCB outline, mounting holes, placed footprints and component heights. Its settings, recipes, additional boards and fit records travel inside the complete CIRCUITBENCH project. **← PCB** saves and returns; reopening updates the mechanical source while retaining stable component links.

## First enclosure

1. Place the actual mounting holes and parts in PCB layout. Check the board dimensions and component heights. Library heights are estimates unless you have reviewed them.
2. In **Enclosure**, choose a shell family and closure, then **Apply enclosure system**. Rounded, circular, oval, polygon, convex assembly-following, open tray and sloped shells are available. A polygon defines the interior, centered around the assembly; narrow or invalid offsets stop generation.
3. Set side clearance, wall, floor, roof and space above/below the assembly. Automatic height includes bottom-side bodies and an explicit assumed lead/solder allowance. Turn off automatic sizing or support height to enter exact dimensions. Apply the settings.
4. In **Mounting**, enable the holes you intend to use. Standalone round holes at least 2 mm wide start enabled. New module-owned holes and slots require deliberate selection. A removed anchor produces a blocking finding and a **Disable missing** action; it is never reassigned by reference name.
5. Select **Standoff bores + manual supports** for blind pilot holes, through-floor holes, optional nut pockets or solid posts. Manual supports use numeric PCB X/Y coordinates. The lift is shared by the primary PCB; additional boards can have their own elevations. Blind depth leaves at least 0.4 mm above the inside floor. Per-hole diameter and bore overrides remain editable.
6. Use **Parts** to review installed component envelopes without changing electrical data. **Review next** highlights unresolved height, underside, mounting and access decisions.

The 3D toolbar offers board-only, assembled, exploded, transparent, section, print-layout and export-read-back views. Top/bottom/front/plan views, numeric inspectors, keyboard controls and a face editor supplement orbit/pan/zoom. On narrow screens, the menu and inspector buttons open one panel at a time.

## Closures

| Closure | Generated geometry | Controls and fit test |
| --- | --- | --- |
| No generated closure | Lift-off lid with optional locating skirt | Joint clearance, skirt depth/wall; standard joint coupon |
| External screws | Outside ears, bolt bores, head recesses and nut pockets | Hardware dimensions and ear settings |
| Internal screws | Inside bosses and retained-nut geometry | Bosses reserve automatic side clearance |
| Heat-set inserts | Inside bosses with insert pockets | Actual insert diameter/depth and screw dimensions |
| Sliding lid | Open entry, side grooves and a pull tab | Groove depth and per-side fit; sliding coupon |
| Snap-fit lid | External cantilever beams, capture hooks and lead-in ramps | Beam thickness and fit; snap coupon |
| Pin hinge | Three interleaved knuckles, cleared bores and a separate headed pin | Pin diameter, knuckle length and fit; hinge coupon |

Sliding, snap-fit and pin-hinge mechanisms currently require a **level rounded rectangular shell**. The hinge has no opposite-edge latch or pin lock. The modeled reference hinge clears the shell and pin at sampled opening angles through 120°; this does not establish printed fit, strength or wear. The snap model is undeformed geometry, without a force or fatigue prediction. Print the matching coupon with your intended material and settings before printing a complete case.

**Hardware + board retention** configures the selected screw, head, washer, nut, insert and driver envelope. Dimensions are editable values, not a manufacturer catalog. The same profile supplies nominal PCB and lid fastener checks; per-support bores are independent. It also offers edge rails, a slide-in cradle and removable hold-down bars for the primary PCB. Rails/cradles require suitable empty board edges and a checked installation path.

## Openings, text, artwork and panels

Choose **Features**, select a face, then add an opening, pocket, raised/recessed text, filled SVG artwork, vent pattern, material feature or service panel. Rectangles, rounded rectangles, circles and capsule slots have editable physical sizes. Service panels generate a separate removable cover with fastener holes.

Use the inspector for exact position, rotation, face and operation target. Through-cut normally cuts its selected wall; choose **Both parts** deliberately for a seam-crossing opening. The face editor supports drag/resize; numeric inputs are the accessible alternative. Shift-select features to align or distribute them. Undo reverses applied changes. Background regeneration preserves a form while you type; submit **Apply feature** to commit its draft values.

A component anchor keeps an opening linked by stable ID. Local connector-mouth offsets follow component rotation and bottom-side mirroring. Removed component anchors block export until you explicitly detach or remap them. Source updates retain installed-envelope overrides with a review warning.

SVG import accepts bounded filled outlines and basic shapes/transforms. It rejects scripts, external references, strokes and live text. Convert text to filled outlines before import. Lettering uses the included mixed-case drafting alphabet. Artwork is extruded/recessed solid geometry. Face tools remain planar; they do not wrap curved walls.

## Functional interfaces and fit

**Access** adds coordinated connector openings and plug corridors, optional cable-tie bridges, LED bezels/guides, display bezels/window seats with optional separate retainers, and captive button plungers with separate removable retainers. Enter the actual dimensions, mouth/actuator offset, travel and evidence. A component's name does not supply connector geometry. Each group is editable, suppressible and reusable as a definition.

**Print** provides:

- A full-scale reduced-material **fit frame** retaining support spacing, joint datum and selected feature regions. It is available for supported level screw-fastened or unfastened shells. Sliding/snap/hinge and sloped cases use dedicated coupons instead.
- Coupons for the current closure, insert/nut geometry, a selected feature, or joint/bore gauges.
- Local measured corrections to one opening dimension/position, one support bore or the joint fit. Source boards are never scaled. Preview the correction, record the observation, then apply it.
- Printer-bed dimensions, part orientation, material/nozzle/process notes and local profile storage.
- Separate slicer-inspection and physical-fit records. These are user observations; changes to relevant geometry/process make them stale.

Review blocks invalid/stale meshes, detached solids, modeled interference and unresolved anchors. Warnings retain their severity and evidence source. PCB/body/tool envelope checks are conservative and depend on the dimensions supplied.

## Assemblies and recipes

In **Advanced mode → Assembly**, add up to three additional CIRCUITBENCH PCB JSON files, for four total parallel boards. Each keeps its own mechanical snapshot, placement, in-plane rotation and elevation. Added boards start without generated supports; enable floor supports deliberately. These are floor-to-board supports, not automatic board-to-board spacers. Compatible CASEBENCH mechanical sources can also be read.

Add device envelopes for batteries, modules, displays and switches, with optional support pads/cradles. Directional insertion/removal checks sweep conservative envelopes; they do not solve flexing, wiring, rotation or a complete assembly sequence.

**Library** exports/imports enclosure recipes with explicit component-anchor mapping and stores reusable hardware, envelopes, feature groups and interfaces. Recipes transfer design intent, not fit approval. Unmapped anchors remain blocking findings. Library data is included in the complete project; export it separately to reuse elsewhere.

## Save, upgrade and export

**Save PCB + enclosure** downloads the complete `.circuitbench.json`, including the primary electrical/PCB design. Normal edits use CIRCUITBENCH autosave, conflict handling and recovery. The enclosure has its own 30-step session undo; the parent PCB workspace retains its existing 60-step history. Fresh start inside the workbench resets only the enclosure and can be undone. Return to the PCB to open or reset a whole project.

v1.3 dimensions, supports, manual posts, bore styles and six-face openings migrate when you first open Enclosure. The original `enclosure` object is retained as a backup; new work lives in `enclosureWorkshop`. Migrated case dimensions remain fixed initially to preserve the existing fit. Enable automatic sizing when you want revised board extents to resize the case.

The print package contains one binary STL per printable part, named-part millimeter 3MF, the complete CIRCUITBENCH project, source mechanical snapshots, hardware CSV, evidence, assembly steps and a printable HTML report. Reference boards and body envelopes are excluded from printed geometry. Separate STL files use the selected bed orientations. 3MF encodes units; set STL units to millimeters in your slicer. No slicing or G-code is generated.

**Guide → Export enclosure backup** preserves the embedded enclosure if parent saving is blocked. It is a recovery artifact; merge its `enclosure` object into `enclosureWorkshop` in a complete PCB JSON only after resolving the parent conflict. The original PCB must still match. Keep a complete downloaded project as the normal backup.

## Geometry and limits

Solid unions/differences/intersections run in a local Manifold 3.5.4 worker. Polygon offsets use Clipper. Final mesh simplification uses a 0.0001 mm tolerance to remove triangles too small to survive float32 STL conversion, followed by topology and serialized-read-back checks. Mechanical preview coordinates are rounded to 0.0001 mm. This is tessellated printable geometry, not analytic STEP.

Limits include 160 authored features, 100 holes per vent pattern, 100 manual supports, four PCBs, a 120-second worker-operation limit, and the parent 5 MB complete-project import limit. Changes exceeding the complete-project size limit are rejected before replacing the current enclosure. Large artwork/assemblies may need simplification. Failure leaves the last mesh visible as a stale reference and locks export until a valid current model exists.

No physical enclosure, snap force, printed hinge, insert installation, thermal behavior, ingress protection or structural strength was verified for this release. Fit and fabrication still require actual hardware and printer trials. The software package is standalone and self-hostable; no deployment is implied.
