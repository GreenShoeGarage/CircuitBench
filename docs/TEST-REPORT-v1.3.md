# CIRCUITBENCH v1.3.0 — verification report

Software verification completed 2026-10-05 UTC. No physical enclosure was printed or fitted.

## Automated results

**125 JavaScript/browser PASS groups:** 108 existing regression groups, eight enclosure engine groups and nine enclosure browser groups. Logs are in `verification/v1.3-*.log`. The enclosure workflow ran against the standalone HTML with the browser offline. No remote HTTP requests or uncaught page errors occurred. Browser suites were run sequentially.

New coverage includes:

- Dimensions from PCB bounds, rotated/overhanging body envelopes, top/bottom component heights, board thickness and lift.
- Board and transformed footprint mounting holes, missing anchors, default and individual support overrides, enable/disable, body collisions and minimum lift.
- Configuration validation, project JSON, autosave, reload, transfer to a fresh standalone browser context, component height changes and undo.
- Round, rectangular and capsule-slot openings on all six faces. Numeric sizing, component alignment, face dragging, keyboard movement, duplicate/delete and invalid edge placement.
- Actual solid generation, single connected base/lid, binary STL and byte-preserving ZIP exports. Blind/through/solid bores, taller posts and deterministic rebuilds.
- 3D controls, see-through preview, board/lid visibility, exploded and assembled views, printable fit report and ZIP contents.
- Desktop light and 390 px mobile dark workflows, with no horizontal overflow. Screenshots were visually inspected for the main editor, standoffs, openings and mobile face editor.

`npm test` contains the full 125-group chain. `npm run test:enclosure` runs the two enclosure suites. Set `CHROMIUM_EXECUTABLE` for an installed Chromium. The engine suite generates the reference meshes used by the independent checks.

## Independent STL verification

**Nine additional PASS checks** in `tests/enclosure-mesh.test.py` use Trimesh 4.9.0, NumPy and Rtree without calling application geometry functions:

- Five meshes (base, lid, through-bore base, solid-post base and raised base) are watertight, consistently wound, positive-volume, single connected solids and flat at Z=0. All have the expected 70 × 50 mm footprint.
- Heights match 24.6 mm for the reference base, 4 mm for the print-oriented lid including lip, and 32.6 mm for the raised base.
- Point-in-solid tests confirm empty space at all six punchout centers and intact adjoining material.
- All four support locations contain real post material. Blind bores leave a closed floor; through bores open it; solid posts remain filled.
- The lid locating ring has the specified thickness and per-side fit clearance. ZIP binary bytes and CRC are valid.

Use `npm run test:enclosure-mesh` after installing the Python dependencies. Fixture project and base/lid STL are shipped in `examples/`. The example is a geometric software fixture, not a proven product enclosure.

## Corrections made during verification

The old ZIP helper encoded every entry as text. It now preserves Uint8Array and ArrayBuffer entries, verified against the exported STL bytes. The worker's bundled `import.meta.url` must be a valid base URL even when all WASM bytes are supplied directly; the vendor rebuild script preserves that requirement. No network WASM fetch is used. Browser tests assert all nine workflows complete, preventing an interrupted run from being mistaken for a pass.

## Scope and remaining evidence

The generator produces rectangular enclosures and a lift-off lid with a locating lip. There is no latch, screw retention, thread, insert, seal, screw-head clearance, STEP model, connector mating envelope or physical print simulation. All supports share one PCB lift; outer diameter and bore have individual overrides. Openings are cut-through voids, not breakaway membranes.

Actual package heights, underside leads, mating connectors, printer calibration, structural strength and thermal behavior still need real-world verification. The app reports stored-height assumptions and blocks modeled fit errors. Earlier PCB/manufacturing evidence is retained in `TEST-REPORT-v1.2.md`, `TEST-REPORT-v1.1.md` and `TEST-REPORT-v1.0.md`; the physical reference-board gate remains open.
