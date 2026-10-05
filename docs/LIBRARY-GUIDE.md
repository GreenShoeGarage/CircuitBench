# Component library guide — v1.1

The catalog contains 148 mapped devices, 148 symbols and 190 footprints. Counts are separate; values of one resistor are not separate devices. The original 12 templates are retained for older projects and generic editing.

## Find, inspect, place

Use Add parts → search/filter → device preview → package choice → Place. The symbol preview shows logical pins; the package preview shows physical pads in a top view. Pin mapping is expandable. Favorites persist in browser preferences. Libraries also exposes the complete symbol and footprint collections independently. Devices with different ordering suffixes must be checked against the corresponding datasheet.

## Imports

Supported inputs are KiCad `.kicad_sym`, `.kicad_mod`, folders, ZIPs and CIRCUITBENCH library JSON. Native library source release 9.0.0 is included for reproducibility; the parser accepts supported S-expression constructs rather than asserting full compatibility with every KiCad version.

| Area | Supported | Excluded or limited |
| --- | --- | --- |
| Symbols | Inheritance within a file, pin names/numbers/electrical roles, separate units, polylines, rectangles, circles, arcs and text | Standard body style only; alternate De Morgan styles omitted with a note; font rendering differs; hidden pins are made visible |
| Pads | Circle, rectangle, oval, rounded rectangle; THT/SMD; repeated numbers; plated round/slot holes | Custom/trapezoid/chamfer pads and offset drills excluded |
| Footprints | Silkscreen/Fab outlines, standalone paste/mask apertures, NPTH holes, keepout polygons | External 3D models excluded; static footprint text omitted with a note; per-pad/footprint manufacturing overrides mostly excluded |
| Mapping | Exact default footprint name when available; explicit pin-to-pad assignment; multiple physical pads per logical pin | No guessed package mapping by pin count alone; all copper pads and logical pins must be assigned |
| Scale | 50 MB expanded input, 2,000 files and entries per category per pack; 10 MB native file; 128 S-expression nesting levels | Larger packs must be split; editable projects still have a 5 MB file limit and 2,000 copper primitives |

Unsupported electrical/copper geometry excludes that footprint, rather than silently substituting a generic pad. Conversion diagnostics identify rejected entries before saving. Some modules, including source Pico footprints with custom copper pad shapes, need a supported alternate footprint or future parser work. The bundled Arduino UNO/Nano and other supported modules are usable now.

## Logical pins, physical pads and units

A physical pad has a stable `n` identity. `number` retains its native pad number. `pin` identifies its logical symbol pin. Multiple physical pads can share that pin; their electrical assignment stays synchronized. They remain separate copper islands until actual copper connects them. ERC counts each logical pin once. Symbol units share one component reference and board footprint; inspector offsets move a unit and its attached wire endpoints.

Create device lets you map logical pins to comma-separated physical pad IDs. Save selected device preserves that mapping. Applying a replacement footprint requires compatible existing logical assignments; use the mapping editor for a different map.

## Storage and transfer

Bundled definitions live inside the HTML. My library lives in IndexedDB for this browser and origin, separately from the autosaved project. Export my library creates portable JSON that includes user and project library entries. Imports preview replacement of identical library IDs. Placed components retain embedded geometry, source metadata and their current pin mappings; library updates cannot silently modify them. Unused installed entries are not copied into each project.

Projects retain schema 2 and accept schema 1 migration. Use v1.1 for projects using its richer geometry; older application versions can lack these capabilities. Keep an exported JSON backup before downgrading. Library storage errors are surfaced; browser/site-data deletion removes local user libraries.

## Evidence and limits

Geometry and pin numbering were converted from a pinned upstream source and checked for mapping consistency. The included native source subset, selection manifest and rebuild script permit reproduction. Device provenance includes source URLs and hashes. No manufacturer has certified these converted definitions, and no physical board was fabricated for this release.

Body height is an editable 3 mm estimate. Body/courtyard envelopes and graphic arcs are simplified; arcs are polygonized. Verify exact package suffix, pin assignment, physical dimensions, height, ratings and fabrication rules against the actual parts. Component source data retains CC-BY-SA 4.0 with the KiCad exception; application code remains GPL-3.0-only.
