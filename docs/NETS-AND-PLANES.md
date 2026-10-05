# Nets, planes and quick wiring · v1.8

Open **PCB layout → Nets & planes**. The existing **Nets** action opens the lead-assignment view of the same tool. Everything works offline, saves with the project and supports Undo.

## Ground, power and signal planes

- **Back GND · front routing** puts a GND plane on the back and removes the managed front plane. It preserves manual zones, pins, tracks and vias.
- **GND on both faces** assigns GND to both faces. The two copper faces still require a through-hole pad or via to connect physically.
- Each face has a **Plane net** dropdown. Choose an existing ground, supply or signal net, or **New net…** to create a name such as `+3V3`, `+12V`, `SDA` or `ENABLE` and assign the plane in one step.
- **None · routing only** removes that face's managed plane. **View front/back** closes the panel and shows the corresponding face and active copper layer.
- **Show filled copper** changes editor visibility, not fabrication outputs. **Refresh connection status** recalculates the displayed physical connectivity.

Planes follow the current board outline, including board templates and later dimension edits. Fill recalculates after changes and clears foreign copper, mounting holes, cutouts and applicable footprint keepouts. Existing local zones have priority over whole-board planes. **Local copper zone…** opens the existing zone editor for smaller pours and multiple nets on a face.

**Settings** controls clearance, thermal gap, spoke width and thermal versus solid pad attachment. Through-vias attach solidly. Board and net-class clearances remain minimums. A net name records circuit intent; it does not establish a voltage, source, current capacity or impedance.

The status reports real filled copper: area, separate electrical regions, and leads connected to the largest connected plane region. Expand **Connection status** to see connected, isolated, opposite-face or unconnected leads. Click a lead in the list to open its connection workflow. Split planes and disconnected assigned leads also appear in Review. Matching net names never bridge separated copper by themselves.

## Connect leads to a plane

1. Choose **Connect leads…** on a plane card, or use the **↗** shortcut next to a component pin's net selector.
2. Pick leads in the searchable table. Alternatively, **Pick on board**, click the pads, then choose **Wire / assign…** in the selection bar. Click a picked pad again to remove it. Escape ends canvas picking.
3. Choose the target in **Connect to plane** and click **Preview plane connection**.
4. Inspect the proposed trace/via count and the copper preview. **Fit connection** zooms to the picked leads and changes; **Whole board** shows broader context.
5. **Keep connection** applies net assignments, traces and vias as one undoable edit. **Discard**, Cancel, Escape and closing the preview leave the PCB unchanged.

Unassigned leads can adopt the plane net. Leads already assigned to a different net and leads marked NC are blocked; the helper never silently merges circuits. Repeated physical pads for one logical pin retain one logical net assignment. Circuit intent can still be edited with the existing net and schematic tools.

The helper first uses existing copper contact, then tries an already attached nearby via or a short same-face connection. An opposite-face SMD lead can receive a short trace and a new through-via. New vias are checked against copper, holes, board edges and via keepouts, and are kept out of SMT solder pads. The proposed leads must connect to the plane's main physical region before the preview is accepted.

## Wire leads to a named net

1. Open **Wire & assign leads** and choose **Target net**. GND, +3V3 and +5V shortcuts choose/create common names; the expandable creation field supports other names.
2. Pick the desired leads. **Pick target net** selects all physical leads currently assigned to that net. **Clear picks** resets the selection; the search field filters by reference, pin name or net.
3. **Assign picked to net** updates schematic connectivity and PCB airwires without adding copper.
4. **Preview wires** assigns eligible unassigned leads and proposes physical tracks between the picked leads. Already connected leads do not get duplicate tracks. Keep or discard the proposal.

For a whole-net routing attempt, choose the net, click **Pick target net**, then **Preview wires**. Opposite-face SMD leads can be joined with a through-via when **Allow through-vias** is enabled. Trace width, preferred face, via diameter and drill are under **Trace and via settings**. Enter dimensions that satisfy the board/net-class rules.

**Manage nets** retains the existing rename and delete tools. Renaming changes the name throughout the project, including planes. Deleting a net removes its copper and unassigns its leads; Undo restores it.

## Limits and recovery

Connection previews run in a cancellable local worker. The board stays unchanged until **Keep connection**, and a preview calculated for an older board revision cannot overwrite newer work. No partial plan is committed when one of the picked leads cannot be connected.

The plane helper accepts up to 128 picked leads; wire proposals accept 2–64. Routing is bounded and preserves existing tracks. A blocked layout may require moving parts, adding a manual via or routing manually. The tool does not implement push-and-shove, length matching, differential routing, current/thermal analysis or impedance solving. Review the full design and fabrication files before ordering.

Only one managed whole-board plane is supported per copper face. Floating and split copper remains visible and is reported; it is not silently removed or stitched. Manual local zones remain editable and are preserved by plane presets.

## Files and compatibility

Planes are ordinary saved zones with `boardPlane: true` and an empty boundary that follows the board. Filled polygons are derived from source geometry. Kept connections are ordinary tracks and plated vias. Project JSON, autosave, fabrication ZIPs, KiCad PCB output and enclosure handoff preserve the corresponding data. KiCad export gives local pours higher zone priority than managed planes. Imported KiCad zones remain manual zones.

Older projects need no migration. v1.8 is needed to retain managed-plane behavior and the quick-connection workflow. The standalone HTML, source and worker are bundled; no external routing service is involved.

Open `examples/planes-and-wires.circuitbench.json` for a small software-checked sampler: front +3V3, back GND, two connectors, an SMD-to-ground via/stub, and routed SDA. Its generic footprints and circuit assumptions require review against actual hardware; it is not a fabricated reference.

## Workflow source

The per-face selectors, ground presets, lead picker, checked plane-connection preview and whole-net routing workflow were adapted from [COPPERBENCH v1.7.1](https://greenshoegarage.com/projects/copperbench/), inspected 2026-10-05. CIRCUITBENCH uses its existing polygon fill, copper connectivity and routing engine. COPPERBENCH's MIT notice is included in `vendor/COPPERBENCH-LICENSE.txt` and the standalone application.
