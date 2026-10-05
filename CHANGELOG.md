# Changelog

## v1.8.1 — 2026-10-05

- Added PCB layout → Board color with seven named presets, a native color picker and custom hex entry. Changes preview before Apply; Cancel/Escape preserve the project.
- Saved color in the board model with autosave, JSON transfer and undo/redo; older projects default to green and malformed colors are rejected.
- Applied color to both PCB faces, the outline editor, assembly SVG, 3D board and enclosure board previews. Light boards use dark annotations and silkscreen visualization.
- Retained manufacturing geometry and bumped the offline shell cache.

## v1.8.0 — 2026-10-05

- Added Nets & planes: back GND / both-face GND presets and per-face selectors for existing or new ground, power and signal nets.
- Added searchable lead picking, click-to-pick on the PCB, inspector pin shortcuts, named-net assignment and whole-net routing shortcuts.
- Added cancellable checked previews for direct plane contact, attached-via reuse, short trace/new-via connections, and same-/opposite-face wires. Keep commits the complete proposal as one undoable edit.
- Added physical main-region connectivity and split-plane findings. Different-net and NC leads are rejected without implicit net merges. Stale previews cannot overwrite newer work.
- Manual zones now take priority over managed whole-board planes; native KiCad exports include matching zone priorities. Managed planes follow board/outline edits and refill automatically.
- Added focused/whole-board copper previews, a power/ground/signal sample project, documentation and independent Gerber/Excellon checks.
- Strengthened the enclosure browser regression's asynchronous PCB-import wait to check imported state before checking generation completion.


## v1.7.0 — 2026-10-05

- Added Arduino Uno R3 (68.58 × 53.34 mm), Arduino MKR 28-pin (61.5 × 25 mm) and Raspberry Pi 40-pin HAT-layout (65 × 56 mm) board shapes from COPPERBENCH v1.7.1.
- Added Board templates to the PCB toolbar and Board size dialog, with preview, 0/90/180/270° rotation, optional mounting holes and source dimensions.
- Apply is one reversible edit. Parts, routing, artwork, thickness and manual/edited holes retain their physical placement. Reapplying avoids duplicate holes and retains same-family support anchors.
- Template geometry persists in project JSON/autosave and flows into fabrication files, KiCad and enclosure generation.
- Added three blank example boards, source/license documentation and 17 verification groups covering geometry, manufacturing, solids and browser workflows.



## 1.6.0 · 2026-10-05

Completes the authorized v1.4, v1.5 and v1.6 enclosure batches, adapting CASEBENCH 2.3.1 workflows into CIRCUITBENCH with offline Manifold geometry and unified project persistence.

- v1.4: migrate existing cases; screw/insert retention; rounded shells; raised/recessed text and SVG; vents; stable component-linked openings; blind/through/solid and manual supports.
- v1.5: full-scale fit frames, closure/feature/hardware coupons, local fit corrections, functional connector/LED/display/button groups, named-part 3MF and complete project print packages.
- v1.6: rounded/circular/oval/polygon/convex-following/tray/sloped families, service panels, additional PCBs/device envelopes, alternative board retention, reusable recipes, sliding/snap-fit/pin-hinge closures.
- Corrected inherited hinge bridge bore interference, hinge-head clearance, retainer/post overlap, STL precision loss and support-bore cache invalidation. Added assembled printable-part collision findings.
- Preserve active form drafts during background regeneration; use the parent save/recovery system; save whole CIRCUITBENCH projects from the enclosure editor. Physical print/fit testing remains outstanding.

## 1.3.0 — 2026-10-05

- Added a rectangular enclosure generated from the PCB outline, rotated component bodies, board thickness and editable front/back component heights. Automatic height includes PCB lift and headroom.
- Added hole-linked standoffs that follow board and footprint mounting holes, with shared lift, individual diameter/bore overrides, enable/disable, manual supports, blind/through/solid bores and hole resynchronization.
- Added resizable round, rectangular and slotted through-openings on all four walls, lid and floor; face dragging, numeric/keyboard positioning, component alignment, duplicate and delete.
- Added an exact-solid 3D preview with see-through case, board/lid toggles, exploded assembly and PNG export; fit checks for underside clearance, supports, lip, opening edges and disconnected parts.
- Added offline worker-based Manifold solids, millimeter binary STL for base and lift-off lid, a print ZIP, dimensions and printable fit report. Enclosure settings participate in project JSON, autosave, undo and baseline comparison.
- Fixed ZIP encoding to preserve binary entries. Bundled all WASM bytes in the standalone HTML; no runtime fetches.
- Verified 125 JavaScript/browser groups plus nine independent STL/ZIP checks. Printable meshes are closed single solids; no physical print or fit test was performed.

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
