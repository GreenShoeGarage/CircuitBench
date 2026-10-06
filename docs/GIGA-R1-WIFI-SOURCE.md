# Arduino GIGA R1 WiFi mechanical template

Added in CIRCUITBENCH v1.8.2. Select **PCB layout → Board templates → Arduino GIGA R1 WiFi**.

The template uses Arduino's **GIGA R1 WiFi, ABX00063** CAD file `PCB.PcbDoc`, carrying a 2025-06-25 board record. It is a 101.60 × 53.34 mm board with a stepped right edge, three nominal R1 mm corners and six Ø3.2 mm mounting holes. USB connectors are at the left in the unrotated top/front view.

The CAD's `Board6/Data` outline and six `Pads6/Data` records named `MH` were normalized to a top-left origin, X right and Y down, in millimeters. Coordinates are rounded to 0.0001 mm. Three quarter-circle arcs use 16 straight segments each, giving a 57-vertex editable polygon. Drill sizes use the datasheet's nominal 3.2 mm callout (CAD value 3.199892 mm).

| Hole | X mm | Y mm | Drill mm |
| --- | --- | --- | --- |
| 1 | 15.24 | 2.54 | 3.2 |
| 2 | 90.17 | 2.54 | 3.2 |
| 3 | 66.04 | 17.78 | 3.2 |
| 4 | 66.0656 | 45.7073 | 3.2 |
| 5 | 13.9956 | 50.7873 | 3.2 |
| 6 | 96.52 | 50.8 | 3.2 |

Two lower mounting centers have small offsets from common Mega-grid coordinates. These values preserve the GIGA CAD positions instead of snapping them to another board's nominal grid. The template does not insert smaller connector anchor holes, electrical headers, connectors or component envelopes. It does not set a new board thickness or change the selected PCB color. Confirm physical fit against the exact hardware before fabrication.

## Sources

- [Arduino GIGA R1 WiFi documentation](https://docs.arduino.cc/hardware/giga-r1-wifi/)
- [Arduino ABX00063 CAD archive](https://docs.arduino.cc/static/5927a4ebbe3f363ebd68e7c50de5e0af/ABX00063-cad-files.zip)
- [Arduino datasheet, Mounting Holes and Board Outline](https://docs.arduino.cc/resources/datasheets/ABX00063-datasheet.pdf), printed page 18 of the retrieved 37-page document.

Retrieved 2026-10-06 UTC (2026-10-05 US Eastern). Source hashes:

- CAD archive SHA-256: `d57801407b342c23286ce111bf5a2d184896a2299793058710038a0fc3d0b88a`
- PCB.PcbDoc SHA-256: `b5440f3df744ccf7b51aad0de10358d11bd681836ddc84bcab529ef5163276fd`

## Attribution and license

Original hardware design: Arduino S.r.l. The CAD archive licenses its hardware under [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). Its original license notice is preserved in `vendor/ARDUINO-GIGA-LICENSE.txt`.

Green Shoe Garage adapted only the board outline and mounting-hole data into `board-template-data.js`, retaining CC BY-SA 4.0 for that data. Changes: coordinate normalization, arc tessellation, decimal rounding, mounting-hole selection and descriptive metadata. CIRCUITBENCH application code remains GPL-3.0-only. Arduino does not endorse this application.
