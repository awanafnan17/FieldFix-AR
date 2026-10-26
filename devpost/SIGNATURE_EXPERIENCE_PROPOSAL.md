# FieldFix AR — Signature Experience Upgrade Proposal (`feature/spatial-fault-tracing`)

## 1. Critical Audit of the Current V4 Experience

Before designing new features, we audited the V4 codebase ([FieldFixState.ts](../Assets/Scripts/FieldFixState.ts), [FieldFixEquipmentMesh.ts](../Assets/Scripts/FieldFixEquipmentMesh.ts), [FieldFixDiagnosticUI.ts](../Assets/Scripts/FieldFixDiagnosticUI.ts), [FieldFixMain.ts](../Assets/Scripts/FieldFixMain.ts)) against Snap's official SPECS design best practices (`ar-design-rules.md`):

1. **Physics-Contradicting 3D Coolant Flow (`FieldFixEquipmentMesh.ts:994-1004`):**
   - In V4, three uniform `CoolantFlowPulseRing` cylinders glide smoothly from `x = -6.0` to `+6.0` (all the way into `TR-309`) even while the UI claims `CV-101` is restricted to `18%`, `PR-204` has a `142 PSI` vapor lock, and `TR-309` is suffering from "coolant starvation."
   - Worse, when Step 1 locks out `CV-101` (`0%` flow), `flowSpeed` drops to `0.0` and the flow rings freeze mid-pipe instead of draining or showing trapped upstream riser pressure.
2. **Cold-Start Attention Split (`FieldFixState.ts:177` & `FieldFixEquipmentMesh.ts:846`):**
   - On startup (`READY_TO_SCAN`), `_selectedHotspot` defaults to `"relay"` (`TR-309` on the right) while `_currentStepIndex` is `0` (`CV-101` on the left). A first-time user sees the 3D chevron hovering over `TR-309` while the step card below instructs them to lock out `CV-101`.
3. **Monolithic 9-Button Dashboard (`FieldFixDiagnosticUI.ts:130-398`):**
   - All 9 rectangular `SpectaclesUIKit` buttons and 10 text rows are presented with similar visual weight from second zero—violating SPECS Habits #1, #2, and #3 (*"Put information on the thing it's about"*, *"Show it when it's needed, then get out of the way"*, *"A few big targets"*).
4. **Disconnected Manual X-Ray Toggle:**
   - X-Ray Cutaway is hidden on Row 9 (`BtnToggleXray`) and explodes all three subsystems at once rather than acting as an automatic **spatial diagnostic lens** when tracing a faulted component.

---

## 2. Phase 1 — Signature Interaction Design: `"TRACE THE FAULT"`

### 2.1 Core User Interaction & Spatial Cause-and-Effect
We transform **Cryo-Coolant Pump & Relay Unit #04** from a static checklist prop into an interactive **3D causal fluid, pressure, and thermal system**:

1. **First 10 Seconds — Seeing the Broken Flow Chain Immediately:**
   - Looking at Unit #04, the trainee immediately sees *why* the machine is failing without reading a paragraph:
     - **Upstream Intake (`CV-101` at `x = -6.8` $\rightarrow$ `PR-204` at `x = 0.0`):** Turbulent amber cryo-packets launch from the cavitating `CV-101` valve (`18%` flow) and **slam into a glowing crimson/amber Vapor-Lock Blockage Barrier (`FaultBottleneckRing`)** at `x = -0.65` under `PR-204`.
     - **Vertical Over-Pressure Riser (`x = 0.0, y = 1.2 .. 5.2`):** Compressed pressure pulses surge up the vertical riser tube into `PR-204`, violently jittering the 3D gauge needle in the red danger zone (`142 PSI`).
     - **Downstream Starvation Zone (`PR-204` at `x = 0.0` $\rightarrow$ `TR-309` at `x = +6.8`):** Past the `PR-204` blockage, the flow path is visibly starved—only tiny, sputtering dim droplets trickle halfway across the pipe and evaporate before reaching `TR-309`, causing the uncooled `TR-309` Thermal Relay Core (`+6.8`) to glow crimson (`118°C`), lift its tripped plunger (`+1.35 cm`), and radiate an expanding **3D Thermal Heat Crown (`RelayOverheatCrown`)**.
     - **3D Causal Flow Trace Chevrons (`CausalFlowBridge`):** Directional 3D flow chevrons along the manifold visually link the cause-and-effect chain (`[CV-101 CAVITATION 18%] ──► [PR-204 142 PSI VAPOR LOCK] ──► [TR-309 118°C STARVED]`).

2. **Tracing the Fault by Pinching Any 3D Component (Auto-X-Ray Causal Discovery):**
   - When the trainee pinches any 3D component on the machine (or runs `SCAN EQUIPMENT TELEMETRY`):
     - **Localized Auto-X-Ray Inspection:** Inspecting an un-repaired faulted subsystem automatically blends open **that component's 3D internal X-Ray cutaway** (`perHotspotXrayBlend[id] -> 1.0`) so the trainee sees *inside* the exact mechanism they pinched (the cavitating cryo-ball seal in `CV-101`, the compressed relief spring in `PR-204`, or the lifted copper stator windings in `TR-309`), while keeping the global `BtnToggleXray` button available to explode all three simultaneously.
     - **Causal Trace Feedback (`traceChainStatus`):** Selecting `TR-309` (`118°C`) highlights the upstream starvation link from `PR-204` and `CV-101` and displays a concise causal trace:
       `FAULT TRACE: TR-309 overheated (118C) because PR-204 vapor lock (142 PSI) & CV-101 cavitation (18%) blocked coolant!`
     - **Incorrect Action / Out-of-Order LOTO Interlock:** If the trainee pinches `TR-309` or `PR-204` a second time to attempt an immediate repair before locking out `CV-101`, the **Sequential LOTO Safety Interlock** fires a 3D red hazard pulse across the manifold, plays `FaultAlert.wav`, increments `safetyViolations`, explains the physical hazard (*"Cannot unlatch TR-309 while 142 PSI is trapped upstream!"*), and smoothly animates the 3D `ActiveStepTargetChevron` upstream to `CV-101` (Step 1).

3. **Coherent Cause-and-Effect Recovery Across All 4 Repair Steps:**
   - **Step 1 (`CV-101` LOTO Isolation):** Pinching `CV-101` rotates the yellow-tipped 3D lever `-90°` clockwise and snaps on the red 3D `LotoSafetyClasp`. **Visual cause-and-effect:** Upstream intake pulses from `CV-101` stop (`0%` intake), while the trapped `142 PSI` pressure pulse remains visibly bottled inside the `PR-204` vertical riser, proving why Step 2 (Purge) is now safe and required.
   - **Step 2 (`PR-204` Pressure Purge):** Pinching `PR-204` vents the trapped vapor lock. **Visual cause-and-effect:** A **3D Vertical Relief Vent Plume (`RegulatorPurgePlume`)** bursts upward from the regulator cap, the `FaultBottleneckRing` blockage dissolves, the internal diaphragm spring relaxes, and the 3D gauge needle sweeps smoothly from red (`+48°`, `142 PSI`) to green (`-38°`, `38 PSI`).
   - **Step 3 (`TR-309` Relay Core Reseat):** Pinching `TR-309` retracts the raised relay plunger `-1.35 cm` into its cooling sleeve and rotates the top latch `45°`. **Visual cause-and-effect:** The pulsing crimson `RelayOverheatCrown` extinguishes and the core transitions from crimson (`118°C`) to cyan (`46°C`).
   - **Step 4 (`CV-101` Re-Pressurize & Verify 100% Flow):** Pinching `CV-101` removes the LOTO clasp and rotates the lever `+90°` open. **Visual cause-and-effect:** High-velocity emerald/cyan cryo-coolant rings surge continuously across the *entire* manifold (`x = -6.4` to `+6.4`), spinning a **3D Center Sight-Glass Impeller (`ManifoldFlowImpeller`)** and bathing `TR-309` in `100%` balanced flow (`42°C | 45 PSI`).

### 2.2 Why This Is Better in AR on SPECS Than on a Phone or Laptop
- **Spatial Cause-and-Effect Mapping:** On a 2D phone screen, a trainee reads a table of numbers (`18%`, `142 PSI`, `118°C`). On SPECS, the trainee physically traces the 3D manifold from right (`TR-309` overheat) to center (`PR-204` vapor-lock barrier) to left (`CV-101` intake valve) at workbench scale (`z = -110 cm`) with both hands free.
- **In-Place 3D X-Ray & Direct Actuation:** Looking at a component and pinching it in 3D space opens its internal mechanical cutaway right inside the housing and actuates the 3D lever, gauge, and relay plunger directly where they live.

### 2.3 Reused Systems, Cost, Feasibility & Risks
- **Reused Foundations:** Extends `FieldFixStateMachine`, `ProceduralPartBuilder` (`MeshBuilder` + `SimpleVertexBaseColor.lspkg`), `FieldFixDiagnosticUI`, `FieldFixAudioController`, and all 4 existing LEAF scenarios.
- **Monetary Cost:** `$0.00` (100% procedural `MeshBuilder` geometry, offline WAV SFX, and built-in Snap packages).
- **Main Risks & Mitigations:**
  1. *Risk:* Disabling or renaming UIKit buttons for progressive disclosure could break existing LEAF scenarios that look up `BtnHotspot*`, `BtnPrevStep`, `BtnNextStep`, `BtnResetUnit`, `BtnToggleXray`, or `BtnToggleComparison`.
     *Mitigation:* Keep all 9 button `SceneObject`s and `Interactable` components active in the hierarchy; implement progressive disclosure via **spatial hierarchy, compact dock sizing, and phase-adaptive visual styling** + on-machine 3D action callouts.
  2. *Risk:* Over-complicating the 3D mesh with too many draw calls.
     *Mitigation:* Pre-build all static and state-swapped `RenderMesh` assets once in `onAwake()` (`0` per-frame mesh/material allocations).

---

## 3. Phase 2 — Spatially Native UI & Progressive Disclosure

1. **First-Run 10-Second Spatial Onboarding (`READY_TO_SCAN`):**
   - Align initial focus so the 3D `ActiveStepTargetChevron` and floating machine header immediately communicate:
     - **What it is:** `CRYO-PUMP UNIT #04 — COOLANT STARVATION FAULT`
     - **What's wrong:** `142 PSI VAPOR LOCK AT [PR-204] STARVING [TR-309] (118°C)`
     - **What to do:** `PINCH [SCAN TELEMETRY] OR ANY 3D PART TO TRACE FAULT`
2. **Direct 3D Action Prompts Tethered to Each Component (`SpatialEquipmentCallouts`):**
   - Each 3D subsystem badge dynamically shows not just telemetry, but a **context-sensitive 3D pinch prompt** when it is the active target (`[STEP 1/4: PINCH TO LOCK LOTO]`, `[STEP 2/4: PINCH TO PURGE 142 PSI]`, `[STEP 3/4: PINCH TO RESEAT CORE]`, `[STEP 4/4: PINCH TO RESTORE FLOW]`), enabling 100% 3D-first completion without looking at the right-hand panel.
3. **Progressive Disclosure on the Companion Card (`FieldFixDiagnosticUI.ts`):**
   - **Focused Primary Card (Top/Center):** High-contrast status header, live telemetry bar, concise 1-line causal diagnosis, active step card, and a prominent `BtnPrimaryAction` button.
   - **Recessed Compact Utility Dock (Bottom):** Secondary controls (`CV-101`/`PR-204`/`TR-309` selector pills, `< PREV`, `NEXT >`, `RESET UNIT`, `X-RAY CUTAWAY`, `COMPARE BEFORE/AFTER`) are styled as a compact, low-visual-clutter utility tray so they never compete with the primary action during initial diagnosis, while illuminating contextually when relevant (e.g., `COMPARE BEFORE/AFTER` highlights upon `COMPLETED`).

---

## 4. Phase 3 — 3D Machine Polish (`FieldFixEquipmentMesh.ts`)

1. **2-Zone Causal Coolant Flow & Vapor-Lock Barrier (`CoolantFlowPulseRing_0..5` + `FaultBottleneckRing`):**
   - 3 upstream flow rings (`CV-101 -> PR-204`) that compress and bounce against a glowing red/amber `FaultBottleneckRing` at `PR-204` (`x = -0.65`) when blocked; 1 vertical riser pressure ring (`RiserPressurePulseRing`) climbing into `PR-204`; and 2 downstream flow rings (`PR-204 -> TR-309`) that sputter and shrink mid-pipe during starvation (`< 50%` flow) and surge at full scale during `100%` nominal flow.
2. **3D Center Sight-Glass Flow Impeller (`ManifoldFlowImpeller`) & Relief Plume (`RegulatorPurgePlume`):**
   - A rotating 3D turbine impeller inside a manifold sight-glass window (`x = -3.4, y = 1.2, z = 1.1`) whose angular velocity is directly proportional to simulated coolant flow (`18%` slow stutter $\rightarrow$ `0%` stopped during LOTO $\rightarrow$ `100%` rapid laminar spin).
   - An upward-expanding 3D vapor relief plume (`RegulatorPurgePlume`) above `PR-204` that triggers for `1.6s` when Step 2 bleeds `142 PSI -> 38 PSI`, plus a pulsing crimson `RelayOverheatCrown` around `TR-309` while overheated (`118°C`).
3. **Per-Component Auto-X-Ray Cutaway (`perHotspotXrayBlend`):**
   - Smoothly explodes open the currently traced/inspected faulted component's internal 3D sub-assembly (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, or `RelayInternalStatorCoil`) automatically during `DIAGNOSING`/`REPAIRING` (and during the `SCANNING` laser pass), while `BtnToggleXray` toggles full-machine 3-part X-Ray cutaway.

---

## 5. Testable Acceptance Criteria

1. **All 4 Existing LEAF Scenarios Pass (`36/36` assertions):** Zero regressions in `FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`, and `FieldFixAdversarialSafetyAndXRayScenario`.
2. **New 5th LEAF Scenario (`FieldFixTraceTheFaultSignatureScenario`) Passes:** Verifies cold-start clarity, tracing the fault upstream/downstream (`TR-309 -> PR-204 -> CV-101`), localized auto-X-Ray activation (`focusedXrayHotspot`), 2-zone flow/blockage/impeller/plume scene objects, out-of-order LOTO interlock feedback, 4-step causal recovery, and reset consistency.
3. **Real SIK Preview Interaction (`PreviewInteractTool`) & Zero Runtime Errors (`RunAndCollectLogsTool`):** Verified in live Lens Studio `SPECS 27` preview.
