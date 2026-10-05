# CIRCUITBENCH v1.1.0 — verification report

Software verification completed 2026-10-05 UTC. No physical hardware was built.

## Automated results

`CHROMIUM_EXECUTABLE=/tmp/chromium npm test` passed with **90 PASS assertions/groups** in the saved release log. This includes legacy engine and browser regressions, native-library model tests, two practical catalog fixtures, and 12 library/layer browser workflows. Chromium was run headlessly against static HTTP and standalone file:// installations. See `verification/v1.1-final-tests.log` for the exact checks and measured timings.

- Every one of the 148 mapped devices and all package variants instantiate and validate. All 190 footprints validate independently. Sources and hashes accompany definitions.
- Schema 1/2 migrations preserve existing geometry and net assignments. Library updates leave placed snapshots unchanged.
- Multi-unit LM358 placement and unit movement preserve a single physical component; wire endpoints follow the unit.
- Repeated USB shield pads share a logical net but keep distinct physical identities. Explicit nonidentity mappings survive save/reinstantiation. Repeated unassigned pads do not produce false self-shorts.
- 144- and 256-pin synthetic fixtures validate, check and export; timings are recorded in the release log. This does not establish unrestricted large-board performance.
- Browser coverage includes search, previews, package selection, favorites, mapping, native symbol and footprint import, local IndexedDB persistence, offline reload, responsive light/dark UI, and backup ZIP transfer into a separate standalone installation.
- Active-layer selection changes visual emphasis, placement side and actual routed copper. A route created after selecting Back is verified on B.Cu. Single-layer view hides opposite-side copper. Header state remains legible after placement.
- Existing browser tests cover malformed project import, protected recovery, multi-tab save conflicts, autosave, JSON round trips, keyboard edits, fabrication ZIPs, PDF output, WebGL assembly and sheet/block workflows.

## Practical reference projects

`catalog-power-led.circuitbench.json`: eight components instantiated exclusively from the bundled catalog; 13 routed tracks, zero unrouted connections and zero error findings in implemented checks. It exercises a regulator, polarized capacitors, decoupling, LED polarity, resistor package selection and connectors. Its assumptions describe the remaining electrical/rating choices.

`catalog-mcu-sensor.circuitbench.json`: ATmega328P, MCP9808, I2C pull-ups, reset and decoupling. Pin mapping and persistence are checked. This reference is intentionally **unrouted** and is not fabrication-ready.

## Independent export checks

KiCad 7.0.11's native pcbnew loaded/saved a fixture with RP2040, USB-C, ESP32 and mounting hardware. **137 electrical pads** were checked independently for position, size and angle on both sides. Rounded-corner radii and selective paste layers/apertures were checked; nonplated holes and keepouts loaded successfully. See `verification/v1.1-native-tests.log`.

Gerbonara and Shapely independently parsed the original complex fixture and an expanded catalog fixture. Both sides' copper, mask, paste and silkscreen reconstructed with **0.0 mm² rounded symmetric difference** against the exported geometric expectations. Plated/nonplated drill counts, positions, diameters, slot lengths/angles, outline and cutout segments passed. See `verification/v1.1-manufacturing-tests.log` and `verification/v1.1-catalog-manufacturing.log`. These checks verify serialization and geometry correspondence, not suitability for a fabricator or an electrical design.

## Review-driven fixes

The layer selector had updated only the routing state while both layers remained equally visible. It now emphasizes the active side and applies that side to new parts. The expanded tests also exposed child-sheet selection reverting to the previous selected part and mobile navigation overflow; both were fixed. Responsive panel state is restored when returning to desktop width.

## Explicit limitations

The native library parser supports the documented subset, not all KiCad constructs. Custom/trapezoid/chamfer pads and offset drills are excluded with diagnostics; alternative symbol bodies, static footprint text and external STEP assets have documented limitations. Native board import remains narrower than library import and can flag richer exported boards as partial imports; CIRCUITBENCH JSON retains the full editable data.

Pin mappings and geometry are source-derived and checked for consistency. They are not manufacturer-certified. Package height defaults to an editable 3 mm estimate; body/courtyard envelopes and arc approximations require review. Hardware fabrication, assembly, fit, thermal behavior and electrical testing remain outstanding.
