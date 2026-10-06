# CIRCUITBENCH v1.8.2 — Arduino GIGA template verification

Date: 2026-10-05 US Eastern (2026-10-06 UTC).

## Results

**11 board-template engine/export/solid groups** and **9 browser workflow groups** passed. The packaged standalone HTML was used for browser verification. Logs and screenshots are in `docs/verification/v1.8.2-*`.

- Official Arduino ABX00063 CAD outline and six MH pads were extracted; six independent coordinate expectations are checked in the tests. GIGA coordinates, source hashes and licensing are documented in GIGA-R1-WIFI-SOURCE.md.
- Valid 57-vertex outline, 101.60 × 53.34 mm bounds, six Ø3.2 mm holes and correct transforms at 0/90/180/270 degrees.
- Hole provenance supports indices 0–5 for GIGA; index 6 is rejected. Existing four-hole families retain their bounds.
- Preset application preserves project color, thickness, placed components and manual geometry; repeating it retains hole IDs without duplicates.
- Gerber outline, NPTH Excellon and native KiCad geometry include every GIGA edge/hole at all four rotations.
- A clean GIGA template builds valid connected base/lid solids with six supports and no error-severity geometry findings. Serialized STL read-back is valid.
- Picker selection, dynamic six-hole count, preview, rotated Apply, Undo/Redo, autosave reload and downloaded JSON import into a clean browser context pass.
- An existing enclosure resynchronizes to the rotated GIGA outline and six standoffs at the correct hole centers while retaining the PCB color. Existing design findings are not erased by changing the board template.
- Retained Uno, MKR and Raspberry Pi workflows pass; mobile dark/high-contrast layouts and keyboard controls pass. No runtime HTTP requests or uncaught browser errors were observed.

## Reproduce

Run `python3 build.py`, `node tests/board-templates.test.cjs` and `node tests/board-templates-browser.test.cjs` after installing the locked development dependencies. Set CHROMIUM_EXECUTABLE for your Chromium path. No build or dependencies are needed to use the included index.html.

## Scope

This is a mechanical board-shape template. It does not add mating headers, the GIGA electrical design or installed component envelopes. The full v1.8 suite was not rerun for this addition; earlier release reports remain included. No physical board/enclosure fabrication, fit test or public deployment was performed.
