# CIRCUITBENCH v1.8.0 — verification report

Date: 2026-10-05. Scope: quick plane creation, named-net lead assignment and checked physical connection proposals, while retaining prior PCB/library/template/enclosure functionality.

## Release results

**222 JavaScript/browser PASS groups** completed through the sequential `npm test` chain with exit status 0 and completion guards satisfied. This includes 194 retained groups and 28 new groups: 18 net/plane engine groups and 10 offline browser workflow groups. The final test chain used the packaged standalone HTML, including focused/whole-board preview controls.

**Four additional independent manufacturing checks** passed using Gerbonara and Shapely. Both parsed copper Gerbers exactly matched expected source polygons within the 0.0001 mm² area-difference tolerance (observed difference 0). The plated Excellon drill matched the proposed via center and diameter. Independent polygon tests confirmed that front copper joins the picked SMD lead to the via annulus and back plane copper meets the same annulus. The separate drilling operation clears the via center; trace artwork may cover that center before drilling.

## New coverage

- Back GND / both-face GND presets; arbitrary ground, supply and signal nets; preservation of manual zones and circuit intent.
- Managed-plane schema validation, one-plane-per-face constraint, automatic outline/dimension following, cutouts and manual-zone priority.
- Native KiCad zone priority; real Gerber fill and Excellon via drill export.
- Thermal and solid same-face attachment, direct through-hole attachment, opposite-face SMD stub/via, and reuse of an existing attached via.
- Different-net / NC rejection, repeated physical-pad mapping, wired schematic net assignment, no implicit copper claim from a net name.
- Opposite-face and split-plane connectivity, edge/copper/hole/keepout constraints, net-specific width and annular-ring rules.
- Same-/opposite-face wire proposals, no duplicate tracks for already connected leads, atomic failure and preserved enclosure/template metadata.
- Native browser controls for plane creation/settings/visibility/face view; canvas picking plus keyboard-accessible lead selection.
- Worker preview, focus/whole-board views, Discard, Keep, Undo/Redo, wrong-net errors, stale-result rejection and cancellation.
- Autosave reload, project JSON transfer, fabrication ZIP download, responsive dark/high-contrast UI, no runtime network requests or uncaught browser errors.

The retained enclosure browser test initially exposed a timing race: its generic generation-ready predicate could pass before asynchronous PCB-file import started. It now waits for the imported board to appear before checking generation completion. The complete final regression chain then passed.

The included `examples/planes-and-wires.circuitbench.json` sampler validates and has zero error-severity design findings. Desktop and mobile screenshots were visually reviewed; a focused connection view was added to make short stubs and vias inspectable.

## Reproduce

Install the locked development dependencies, run `python3 build.py`, then `npm test`. Set `CHROMIUM_EXECUTABLE` for a custom Chromium installation. `npm run test:nets` runs the new model/browser groups. `npm run test:nets-manufacturing` regenerates the fixture and runs the independent Python checks; install Gerbonara and Shapely for that command.

Final logs: `docs/verification/v1.8-final-tests.log` and `v1.8-net-manufacturing.log`. Screenshots in that folder include `v1.8-planes-desktop.png`, `v1.8-plane-connection-preview.png`, `v1.8-planes-mobile-dark.png`, `v1.8-leads-mobile-dark.png` and `v1.8-planes-mobile-contrast.png`. Prior v1.7 verification remains in `TEST-REPORT-v1.7.md`.

## Limits

Connection proposals use a bounded search and do not move existing copper. Blocked layouts can require manual routing or component repositioning. Split/floating copper is reported, not silently stitched or removed. Net labels do not certify voltage, current, thermal behavior, signal integrity or impedance. No physical board/enclosure fabrication or public deployment was performed for this release.
