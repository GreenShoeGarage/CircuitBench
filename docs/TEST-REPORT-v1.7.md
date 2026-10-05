# CIRCUITBENCH v1.7.0 — verification report

Date: 2026-10-05. Scope: standard board shapes matching COPPERBENCH v1.7.1, with all previous PCB/library/enclosure functionality retained.

## Results

**194 JavaScript/browser PASS groups** completed through the sequential `npm test` chain: 177 retained regression groups plus 10 new template geometry/export/enclosure-solid groups and 7 new offline browser workflow groups. Exit status 0; completion guards passed. The exact standalone `index.html` used by this chain is included in the release.

**Six additional independent STL checks** passed using Trimesh 4.9.0: the base and lid exported for Uno R3, MKR and Pi presets are watertight, have consistent winding and positive enclosed volume, and each contains one connected body. This is software geometry verification, not a physical fit test.

## New coverage

- Three source envelopes, Uno stepped outline, rounded-corner area/bounds, and 0/90/180/270-degree orientations.
- Source hole centers and diameters, handedness, atomic application, model validation, legacy-project migration and JSON preservation.
- Existing electrical design, physical part sizes, thickness, manual/edited holes and artwork are retained. Reapply is idempotent, same-family support identities persist, and hole-budget overflow rolls back.
- Gerber Edge.Cuts, NPTH Excellon and KiCad contain the real boundary and holes for all 12 family/orientation combinations.
- Enclosure handoff uses the actual polygon and hole IDs; each family generates printable base/lid solids and four supports. Browser verification opens the Pi template through the normal enclosure UI.
- Toolbar and Board size entry points, preview, Cancel/Escape, apply, Undo/Redo, outline-only option, autosave reload and downloaded JSON reimport.
- Standalone cold offline behavior, no runtime HTTP requests or uncaught browser errors, mobile dark/high-contrast layouts and native keyboard controls. Desktop and mobile screenshots were visually inspected.

## Reproduce

Install the locked development dependencies, run `python3 build.py`, then `npm test`. Set `CHROMIUM_EXECUTABLE` if Chromium is installed at a custom location. `npm run test:templates` runs the new engine and browser groups. With Python Trimesh, NumPy and its supporting mesh dependencies installed, `npm run test:templates-mesh` regenerates and independently checks the six STL parts.

Logs: `docs/verification/v1.7-tests.log`, `v1.7-template-browser.log`, and `v1.7-template-mesh.log`. Screenshots: `v1.7-desktop-picker.png`, `v1.7-mobile-dark.png`, `v1.7-mobile-contrast.png`, and `v1.7-pi-enclosure.png` in the same folder. Prior v1.6 detailed verification is preserved in `TEST-REPORT-v1.6.md`.

## Limits

The presets reproduce COPPERBENCH's nominal mechanical geometry. Actual host-board variants, connector/header placement, standoff/hardware fit and fabrication tolerances require verification. MKR mounting offsets are variant-dependent; Pi is a 65 × 56 mm HAT-layout add-on, not an 85 mm host board. No headers or electrical circuitry are automatically inserted. Rounded corners use the same 16-segment-per-quadrant approximation as COPPERBENCH. No physical board or enclosure has been fabricated for this release. No public deployment was performed.
