# Changelog

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
