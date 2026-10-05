# CIRCUITBENCH v1.6.0 — verification report

Verified 2026-10-05 UTC. This is a software release; no physical enclosure was printed or fitted.

## Automated verification

**177 JavaScript/browser PASS groups:** 125 retained PCB/library/v1.3 regression groups, 40 new enclosure model/geometry/export groups, and 12 new browser workflow groups. The complete `npm test` chain passed with Chromium at `/tmp/chromium`; see `verification/v1.6-final-tests.log`. Completion guards prevent incomplete new-suite runs from being accepted. All browser suites ran sequentially.

The new coverage includes:

- v1.3 migration preserving the 70 × 50 mm reference footprint, 26.6 mm total height, four supports, blind bores and six-face openings. Original settings stay in the complete PCB project.
- Top/bottom transformed pads, drilling/slot semantics, stable component-linked openings, source updates, deleted-anchor findings and complete project validation.
- Real screw ears, internal nut bosses, heat-set insert pockets, raised/recessed text and SVG outlines, vents and pockets.
- Blind, through and solid supports, manual coordinates and geometry-cache invalidation.
- Full-scale reduced-material fit frames; feature/hardware/closure coupons; local corrections and evidence staleness.
- Connector, LED, display and captive-button interfaces, including separate display retainers, plungers and button retainers.
- Seven shell families, service panels, rails/cradles/removable hold-downs, multiple placed PCB snapshots, device supports and explicit recipe mapping.
- Sliding, snap-fit and pin-hinge solids with matching coupons; invalid shell/mechanism combinations are rejected. The reference hinge has zero modeled base/pin interference at 0°, 15°, 30°, 60°, 90° and 120° opening. This samples geometric motion only.
- Offline standalone browser forms for closures, supports, text, vents, SVG, interfaces, additional CIRCUITBENCH boards, recipes, print packages, printable HTML reports, whole-project save, reload/import, enclosure-only reset and undo.
- Active SVG rejection, zero external HTTP requests and zero uncaught browser errors in the new offline workflow.
- 390 px mobile dark/high-contrast layouts, panel controls and visible persistence/export controls. Final visual inspection caught and corrected inherited panel-color tokens; a focused mobile check verified the final theme controls and saved indicator. Report branding/version text and the embedded MIT notice were corrected during final packaging. A final browser check also confirmed atomic rejection of enclosure changes exceeding the parent 5 MB project limit, leaving the prior design unchanged (`tests/workshop-release.test.cjs`).

The retained v1.3 browser tests deliberately call the legacy diagnostic editor. Normal Enclosure actions open the new workbench and are covered by the new browser suite.

## Independent exported geometry

`tests/workshop-mesh.test.py` independently uses Trimesh, NumPy and standard-library XML/ZIP readers. It verified **84 STL parts across 39 specimens**, with watertight topology, consistent winding, one connected solid and positive volume. Exported volumes agree with the world-coordinate specimen meshes. All **39 named-part 3MF assemblies** declare millimeters and contain the expected closed named objects.

Independent point-in-solid probes confirm that blind supports preserve floor material, through bores open the floor and solid supports remain filled. The retained **nine v1.3 independent checks** also passed, covering six-face punchouts, post positions, locating-lip clearance, binary ZIP bytes and dimensional extents. Logs: `verification/v1.6-workshop-mesh-tests.log` and `verification/v1.6-legacy-mesh-tests.log`.

The generator additionally performs assembled printable-part intersection checks and serialized STL/3MF read-back before exports. Reference boards, hardware envelopes and access corridors are not exported as printable solids. The independent tests do not certify every possible parameter combination.

## Problems corrected during this release

- Replaced inherited BSP Boolean execution with local Manifold 3.5.4; retained CASEBENCH's feature model and licensed primitive/export utilities.
- Replaced fragile rounded-offset calculations with Clipper offsets and added bounded final mesh simplification at 0.0001 mm before float32 STL checks.
- Cleared hinge bores after joining bridges, moved the axis to clear the headed pin, and removed retainer/post interference.
- Included support bore modes/manual supports in geometry cache and evidence fingerprints; preserved extension state through corrections and recipes.
- Rebound inherited save/reset/help actions to CIRCUITBENCH; print ZIPs now contain the complete PCB project and edited enclosure.
- Preserved form drafts during asynchronous geometry refresh and regenerated the case after enclosure-only reset.
- Converted additional CIRCUITBENCH boards through an explicit mechanical handoff and removed primary-source replacement controls from the embedded workbench.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run build
npm test
python3 tests/workshop-mesh.test.py
python3 tests/enclosure-mesh.test.py
```

Use `CHROMIUM_EXECUTABLE` for a custom Chromium path. Python inspection dependencies are `trimesh==4.9.0`, `numpy` and `rtree`. The JavaScript geometry tests produce `test-output/workshop/manifest.json` and the specimen exports used by the independent reader. Those bulky generated outputs are not required at runtime and are not shipped in the source ZIP.

The standalone HTML already contains the application, feature model, workers, geometry engine and WASM. Source packaging needs no network build step; `python3 build.py` uses checked-in assets and Python's standard library. Serving `index.html` with `sw.js` retains the existing static/offline installation behavior.

## Remaining evidence

Actual print tolerances, insert installation, fastener engagement, snap deflection/force/fatigue, hinge wear, pin retention and enclosure strength need hardware trials. Sliding/snap/hinge mechanisms are limited to level rounded rectangular shells. The hinge has no opposite-edge latch. Assembly boards are parallel; directional service checks are conservative sweeps. No STEP, slicing/G-code, general motion planner, sealing, thermal or structural analysis is claimed.

Earlier PCB/manufacturing evidence remains in `TEST-REPORT-v1.0.md` through `TEST-REPORT-v1.3.md`. This release did not repeat physical fabrication or claim that the outstanding reference-board hardware gate was closed.
