# CIRCUITBENCH v1.8.1 — board color verification

Date: 2026-10-05. Scope: project board appearance and affected renderers.

## Verified

- Seven named presets, draft preview, Apply, Cancel, Escape, custom hex entry and invalid-input rejection.
- Actual PCB surface color on both faces, Undo/Redo, dark labels on a light board and exported SVG appearance.
- Offline WebGL assembly material uses the project color; enclosure mechanical handoff and embedded workshop retain it.
- Autosave reload and downloaded JSON import into a clean browser context preserve the color.
- Mobile dark/high-contrast dialog layouts, keyboard focus, no uncaught page errors and no runtime HTTP requests.
- Legacy projects default to green, hex normalization/validation and identical Gerber/drill output before and after a color change.
- Six existing board-editing engine groups and all ten board-template engine/export/enclosure-solid groups passed.

Nine focused model/browser groups and one additional clean-context JSON import check passed. Desktop white-board, purple 3D, and mobile picker screenshots were visually inspected. The exact generated standalone HTML was used for browser verification.

## Scope limits

The entire v1.8 regression chain was not rerun for this appearance update; prior evidence is preserved in TEST-REPORT-v1.8.md. No physical fabrication or public deployment was performed. Color is a visualization/project preference; select the corresponding solder-mask option when placing a PCB order. Generated manufacturing geometry is unchanged.
