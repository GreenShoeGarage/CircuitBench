# PCB viewing, artwork and board shape

The PCB layout toolbar has six direct controls: **Flip to back**, **Text**, **Image**, **Edit outline**, **Board size** and **Board templates**. They work in Easy mode and offline.

## View both sides

Click **Flip to back**, or press **B** while working on the canvas. The PCB mirrors horizontally as if you turned the physical board over, and Back copper becomes active. Click again to return to the front. The heading always identifies the viewing side and active copper layer.

Selection, dragging, arrow-key movement, routing, zoom and pan continue to work. Numeric coordinates always refer to the original board coordinate system. Assembly reference labels and pin numbers stay readable; manufactured artwork follows the physical side. The copper dropdown may select a layer independently of the viewing orientation. **Show inactive copper** controls the dimmed opposite side.

The preference survives reload. Flipping changes no project coordinates, placement data or manufacturing files. Bottom Gerbers must not be manually mirrored.

## Add text

Click **Text**, enter the label, position, character height, rotation and side, then **Apply / create**. The default side follows the active copper layer. Bottom text mirrors automatically so it reads normally from Back view. The font supports uppercase A–Z, digits, spaces and `+ - . / _ :`.

Select the text to edit X/Y, rotate it or reopen its text settings. Drag and arrow keys move it; **R** rotates by 90°. The Design tree's Silkscreen list provides selection without precise canvas clicking. Delete and Undo work as for other board objects.

## Add a logo or image

1. Click **Image** and choose a PNG, JPEG or WebP file.
2. Inspect the monochrome preview. Dark pixels print as silk, light pixels stay clear, and transparent pixels always stay clear. Adjust **Threshold**, **Invert visible colors** and **Resolution** if needed.
3. Set the physical **Width mm**; height follows the original aspect ratio. Set center X/Y, rotation and front/back side.
4. Click **Add image**, then drag or use inspector coordinates to position it.

The preview presents the unrotated artwork as read from its chosen side. Rotation values use the board's clockwise front-view coordinates; the same rotation appears reversed from the underside. Center coordinates anchor images; the first character anchors text.

The smallest raster pixel is compared with the current minimum silk-feature rule. Enlarge the artwork or use lower resolution if the preview warns about fine detail. Review also checks artwork against board edges and mask openings.

The converted artwork is embedded in JSON, backups and fabrication packages. It appears in 3D and exports as real silkscreen geometry to Gerber and KiCad, including transparent holes. It is not merely a screen overlay. After reopening, you can change dimensions, position, rotation and side without the source file. To change the conversion threshold/resolution, use **Replace image** to reimport the original.

Supported input: up to 10 MB / 16 megapixels. Converted raster: up to 256 pixels per axis, 6,000 rectangles per image, 12,000 rectangles across the project. Detailed/noisy images may require lower resolution or simpler artwork. SVG and multicolor silkscreen are not supported.

## Edit the outer cut line

Click **Edit outline**. Work in the preview using the front-view board coordinates:

- Drag a corner to move it; click an edge to insert a new corner.
- Select a corner with its dropdown and enter exact X/Y values.
- Focus the preview and use arrow keys to move the selected corner by the current grid step; Shift multiplies the step by ten.
- Use **Add corner after selected** or **Remove corner** without a pointer. At least three corners are required.
- Expand **All coordinates** for one X,Y pair per line; **Preview coordinates** validates and displays the polygon.
- **Reset to rectangle** creates a draft rectangle at the current dimensions.

The preview is a draft. **Cancel**, Escape or closing the dialog leaves the board unchanged. **Apply outline** commits one undoable edit. Crossing edges, duplicate corners, invalid dimensions and a shifted minimum origin are rejected. Keep at least one corner on X = 0 and one on Y = 0. The boundary closes automatically; up to 200 corners are supported.

Cutouts and holes retain their positions. To edit internal cutouts, holes or slots, use **Board tools**. After applying, inspect the updated 3D board and Review findings.

## Adjust overall dimensions

**Board size** sets width, height and thickness in millimeters. Width/height range: 5–500 mm; thickness: 0.1–10 mm. Rectangles resize directly. A custom outline scales along each axis to the requested dimensions, preserving its vertex topology.

Components, tracks, vias, holes, cutouts, silkscreen and source zone boundaries keep their physical sizes and positions. Copper fills recalculate against the new board. Objects left outside the boundary are retained so you can move them, and Review reports their conflicts. Undo restores the previous boundary and thickness.

The project inspector's width/height fields also support custom outlines. Exported Edge.Cuts and 3D use the same saved geometry.

## Start from a standard board shape

Use **Board templates**, also available from **Board size**, to choose Arduino Uno R3, Arduino MKR 28-pin or Raspberry Pi 40-pin HAT-layout geometry. Preview the outline and mounting holes, choose a clockwise rotation and apply. See [Board templates](BOARD-TEMPLATES.md) for exact dimensions and source notes.
