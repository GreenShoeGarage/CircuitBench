# CIRCUITBENCH development roadmap

Status: v1.0.0 software release, 2026-10-05.

| Batch | Delivered | Verification |
| --- | --- | --- |
| v0.1 | Shared schematic/PCB model, placement, manual routing, local saves and basic exports | Original core and browser suites |
| v0.2 | Wires/corners, junctions, power/NC, reusable symbol/footprint/device libraries, rect/oval pads | Graph split/merge, pin mapping and drill-void tests |
| v0.3 | Outlines/cutouts, holes/slots, silk/paste, zones/thermals and rule presets | Independent Gerber/Excellon geometry checks |
| v0.4 | Bounded KiCad PCB interchange with previews and diagnostics | Native KiCad 7.0.11 load/save, plotting and pad geometry |
| v0.5 | WebGL board/assembly, placement CSV, stronger courtyard/drill/mask/silk checks | Rendering, interaction and export tests |
| v0.6 | Obstacle-aware routes, via transitions and track cleanup | Detour/blocked-layer and browser routing tests |
| v0.7 | Parent/child sheets, explicit ports, reusable blocks and scoped instance nets | Reference/net isolation, port roles and hierarchy cycles |
| v0.8 | Migration, nested library validation, multi-tab conflicts and protected recovery | Save/reload, migration, conflict and recovery workflows |
| v0.9 | Release corpus, mobile/keyboard/offline checks, large-design benchmark and documentation | TEST-REPORT.md |
| v1.0 | Standalone HTML and complete self-hosting source package | Final build/runtime/archive verification |

These are completed development batches assembled into v1.0, not separately published intermediate releases.

## Hardware gate remains open

The earlier roadmap required a physically fabricated and assembled reference board for v1.0. That cannot be completed in this software-only environment. This is explicitly a **v1.0 software release**, not a claim that the original physical gate was fulfilled.

`examples/routed-reference.circuitbench.json` has all nets routed and passes the implemented checks. It is a software fixture, not proven hardware. Remaining evidence: actual footprint/polarity verification; independent fabricator DFM; board fabrication; copper/drill/mask inspection; assembly; short/continuity testing; safe current-limited bench power-up; observed behavior and documented revisions.

## Beyond v1.0

1. Physical reference-board evidence and corrections from fabrication/assembly.
2. Broader KiCad formats: richer pads/graphics, curved copper, project rules and native schematic hierarchy.
3. Native LibrePCB interchange as a separate adapter, with its own device/library identity fixtures.
4. External STEP/component models and dimensionally verified package libraries.
5. Geometry workers, more scalable designs, routing and length/impedance constraints.
6. Simulation only after a verified symbol-to-model mapping exists.
7. Additional browser/accessibility coverage and richer nonvisual editing.

No future dates are committed. Each expansion needs its own compatibility tests and evidence.
