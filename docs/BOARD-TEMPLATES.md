# Board templates · v1.8.2

In **PCB layout**, select **Board templates**. The same picker is available in **Board size**. Choose a family, inspect the front-view preview, choose a clockwise quarter-turn rotation, and optionally include the mounting holes. **Apply board template** commits one undoable change. Cancel, Escape and closing the picker leave the project unchanged.

| Preset | Reference dimensions | Outline | Mounting holes |
| --- | --- | --- | --- |
| Arduino Uno R3 | 68.58 × 53.34 mm | Nine-corner stepped polygon | Four Ø3.2 mm |
| Arduino MKR 28-pin | 61.5 × 25 mm | Rounded rectangle, R2 mm | Four optional Ø2.25 mm |
| Raspberry Pi 40-pin | 65 × 56 mm | Legacy-style HAT outline, R3 mm | Four Ø2.7 mm |
| Arduino GIGA R1 WiFi | 101.60 × 53.34 mm | Stepped outline, three R1 mm corners | Six Ø3.2 mm |

Uno, MKR and Raspberry Pi match COPPERBENCH's **HATs, shields & carriers** section. GIGA R1 WiFi uses Arduino's official ABX00063 CAD geometry, documented in [GIGA-R1-WIFI-SOURCE.md](GIGA-R1-WIFI-SOURCE.md). They supply mechanical board geometry. Place your mating connectors from the component library and verify the chosen host's pinout, connector gender, engagement height and clearances. Header pads and electrical circuitry are not inserted by the shape picker.

## Applying to an existing design

The outer cut line and finished width/height change. Thickness, components, schematic connections, nets, tracks, vias, cutouts, silkscreen, manual holes and source zone boundaries retain their physical size and placement. Existing content is not stretched or recentered. Review reports objects outside the new boundary and clearance conflicts so you can move or reroute them.

Untouched holes added by the previous preset are replaced. A preset hole whose position, drill or slot has been edited becomes an ordinary hole and is retained. Exact existing nonplated circular holes at the same centers and diameters are reused rather than duplicated, including component-owned holes. Reapplying the same preset preserves generated hole IDs so enclosure support settings continue to follow those anchors. A different family creates new anchors; review supports and other links when reopening an existing enclosure.

Rotating a preset rotates its outline and hole pattern together about the reference envelope, then places the minimum bounds at X = 0, Y = 0. Existing objects remain in board coordinates. The rotation does not flip the PCB or its copper layers. **Flip to back** remains a separate viewing control.

After applying, **Edit outline** and **Board size** still work normally. Resizing scales the outline only; it does not scale the hole pattern and should no longer be treated as a standard mechanical fit. Reopening the picker shows the last selected preset settings; applying again restores its nominal outline.

## Coordinate reference

All coordinates are millimeters in the unrotated new board's front view, origin at upper left, X right and Y down. Arduino USB is on the left; Raspberry Pi GPIO is along the top. The picker lists transformed coordinates for the chosen rotation.

| Preset | Hole 1 X,Y | Hole 2 X,Y | Hole 3 X,Y | Hole 4 X,Y |
| --- | --- | --- | --- | --- |
| Uno R3 | 15.24, 2.54 | 13.97, 50.8 | 66.04, 17.78 | 66.04, 45.72 |
| MKR | 2.31, 2.31 | 59.19, 2.31 | 2.31, 22.69 | 59.19, 22.69 |
| Pi 40-pin | 3.5, 3.5 | 61.5, 3.5 | 3.5, 52.5 | 61.5, 52.5 |

Uno's polygon is `(0,0), (64.516,0), (66.04,1.524), (66.04,12.954), (68.58,15.494), (68.58,48.26), (66.04,50.8), (66.04,53.34), (0,53.34)`. The path closes automatically. Rounded corners match COPPERBENCH's 16 segments per quarter circle and 0.0001 mm coordinate precision; these are polygons, not analytic arcs. The same saved polygon drives the PCB view, manufacturing files and enclosure source.

GIGA hole coordinates and CAD attribution are listed in [GIGA-R1-WIFI-SOURCE.md](GIGA-R1-WIFI-SOURCE.md).

## Fit notes

- **GIGA R1 WiFi:** ABX00063 board shape and six mounting holes only. The small USB/audio connector anchor holes are deliberately excluded. Headers, installed component heights, USB/audio overhang and antenna/display access are not inserted by a board-shape template.
- **Uno R3:** nominal R3 geometry, not a blanket claim for R4, Uno Q, Mega or clones. Verify USB and barrel connector clearances on the selected host.
- **MKR:** nominal WiFi 1010 reference envelope. Exact variant body size and board-to-hole offsets require review. Turn mounting holes off if the target board does not use this pattern. Antenna and battery connector clearances remain design responsibilities.
- **Raspberry Pi:** the 65 × 56 mm add-on/HAT outline, not an 85 mm host SBC outline. It does not cover Pico, Compute Module or original 26-pin boards. A board shape alone does not establish HAT or HAT+ compliance; verify model-specific connectors, cooling, standoffs and power requirements.

## Saved data and exports

The finished outline and actual NPTH objects are saved in ordinary project geometry. Optional `board.template` and per-hole `boardTemplate` provenance identify the picker selection and unchanged generated holes; they do not replace actual coordinates. Metadata validates on import and survives JSON/autosave. Existing schema 1/2 projects without metadata continue to load. v1.7 is required for preset-aware replacement behavior; GIGA template metadata requires v1.8.2 or newer.

Gerber Edge.Cuts, separate NPTH Excellon and native KiCad PCB exports contain the geometry. The enclosure handoff receives the same outline, holes, board thickness and existing component heights. Empty templates generate one enabled support per mounting hole (six for GIGA, four for the other presets); inspect bore dimensions and support settings for the actual hardware. Four portable blank project starters are included under `examples/board-*.circuitbench.json`.

## Sources and attribution

Geometry was matched against the self-contained [COPPERBENCH v1.7.1 application](https://greenshoegarage.com/projects/copperbench/) on 2026-10-05, `Platforms` revision 1. Retrieved source HTML SHA-256: `4218518dd49263ad00514ec9f6b0b99d99bf4b60c773e7debb75b15631a03c15`.

COPPERBENCH's platform definitions cite:

- [Arduino Uno R3 datasheet](https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf) and [KiCad Arduino_UNO_R3 footprint](https://raw.githubusercontent.com/KiCad/kicad-footprints/master/Module.pretty/Arduino_UNO_R3.kicad_mod).
- [MKR 28-pin reference pinout](https://docs.arduino.cc/resources/pinouts/ABX00012-full-pinout.pdf) and [MKR reference datasheet](https://docs.arduino.cc/resources/datasheets/ABX00023-datasheet.pdf).
- [Raspberry Pi 4 mechanical drawing](https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-mechanical-drawing.pdf) and [HAT+ specification](https://datasheets.raspberrypi.com/hat/hat-plus-specification.pdf).

The template transfer is a software geometry match to COPPERBENCH, not a new physical measurement or certification. Nominal source data is adapted under COPPERBENCH's MIT license, copyright 2026 Green Shoe Garage; the notice is retained in the standalone HTML and `vendor/COPPERBENCH-LICENSE.txt`.
