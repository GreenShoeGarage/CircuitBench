# Changelog

## 1.2.0 — 2026-10-05

- Added a true mirrored back view, a Flip button and B shortcut, with side selection and readable assembly annotations. Dragging, nudging, routing, pan and pointer-centered zoom use unchanged board coordinates.
- Promoted silkscreen text to a direct toolbar control and added position, rotate and edit actions for text/images.
- Added offline PNG/JPEG/WebP import with threshold, inversion, transparency, resolution and monochrome preview; physical dimensions and rotation; front/back silkscreen; embedded editable artwork without external image dependencies.
- Included image geometry in SVG, 3D, DRC, Gerber and native KiCad board exports. Raster rectangles merge before rotation to retain holes and avoid shared-edge rounding slivers.
- Added a visual outer-cut-line editor with draggable corners, edge insertion, numeric/keyboard alternatives, polygon validation, cancellable drafts and undo.
- Added width/height/thickness controls; custom outline scaling preserves all existing objects' physical dimensions and coordinates. Existing inspector dimension fields now resize custom boards too.
- Added standalone/offline browser workflows and independent Gerber/KiCad artwork/boundary checks. Existing schema 1/2 projects remain supported; images require v1.2 or newer.

## 1.1.0 — 2026-10-05

- Bundled 148 mapped devices, 148 symbols and 190 footprints derived from pinned KiCad 9.0.0 definitions, with source links, hashes, provenance and retained licensing.
- Added category/package/pin-count search, favorites, symbol and footprint previews, package variants and a device mapping editor.
- Added native symbol/footprint, ZIP, folder and JSON library import with worker conversion and explicit diagnostics; reusable IndexedDB libraries and portable backups.
- Added multi-unit symbol graphics and offsets, repeated physical pads per logical pin, rounded pads, separate paste apertures, mounting holes, silkscreen and footprint keepouts.
- Replaced the 40-pin cap with a 1,024-pad guard within the existing 2,000-primitive project limit; exercised 144/256-pin fixtures.
- Fixed active-layer visual emphasis, placement/routing side, inactive-layer picking and persistent layer preference.
- Fixed child-sheet creation retaining the previously selected part's sheet and narrow-screen navigation overflow.
- Included catalog-only power/LED and MCU/sensor reference projects, native KiCad geometry checks and browser transfer/offline tests.
- Preserved existing projects and isolated placed definitions from library updates.

Physical fabrication/assembly/electrical validation remains outstanding. Package body heights remain editable estimates; native library support is explicitly bounded.

## 1.0.0 — 2026-10-05

Completed the v0.2–v0.9 development batches and packaged the v1.0 software release.

- Added explicit schematic wires, corners and junctions, power labels, NC handling and graph recomputation.
- Added reusable symbols, footprints, devices and circuit blocks with pin mapping and scoped instance nets.
- Added rectangular/oval pads, slotted drills, custom boards, cutouts, mechanical holes, manufacturing silk/paste and thermal copper zones.
- Added bounded KiCad PCB import/export, native validation and blocking diagnostics for incomplete imports.
- Added dimensioned WebGL assembly inspection, explode, top/bottom views and PNG export.
- Added obstacle-aware routes, via transitions, track cleanup, sheet hierarchy, explicit child ports and stronger electrical/geometry checks.
- Added net classes, editable process rules, full-object baselines, multi-tab save protection, three recovery checkpoints and stricter imports.
- Preserved static packaging, offline HTML, local-only project handling, themes, keyboard/numeric editing, PDF reports and schema 1 migration.
- Added a fully routed software reference and independent manufacturing/native-format tests.

**Open:** physical fabrication/assembly/electrical validation. This release is not a proven hardware design or full KiCad/LibrePCB replacement. See the compatibility contract for unsupported formats and features.

## 0.1.0 — initial prototype

Shared schematic/PCB model, component placement, generic circular-pad templates, manual routes/vias, basic checks, local saves/recovery, project/CSV/SVG/report and fabrication outputs.
