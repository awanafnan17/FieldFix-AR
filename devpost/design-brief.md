---
title: "FieldFix AR"
category: learn
status: approved
---

# FieldFix AR

> Step up to a simulated overheating industrial Cryo-Coolant Pump & Relay Unit, pinch to run a spatial diagnostic scan that highlights simulated faulty components in 3D right on the equipment, and practice a guided 4-step hands-free repair with live mechanical articulation and simulated Lockout-Tagout (`LOTO`) procedural guidance.

## What It Is

**FieldFix AR** is a spatial, hands-free industrial maintenance **training simulation** built for Snap SPECS using **Closed Loop Agentic Development (`CLAD`)** and the Lens Studio MCP Server. It is designed for field service trainees, plant technicians, and engineering students who want to practice diagnosing multi-component equipment faults, following Lockout-Tagout (`LOTO`) procedural ordering, and executing multi-step mechanical repairs while keeping both hands free.

> **Simulation Scope Note:** All temperature, pressure, coolant-flow, and fault readings in FieldFix AR are simulated in software for training purposes; the Lens does not interface with physical plant sensors or establish real physical electrical/mechanical lockout isolation.

**The Core Training Loop:**
1. **Approach & Scan:** The trainee looks at the spatially anchored **Cryo-Coolant Pump & Relay Unit (`Unit #04`)** at workbench depth (`z = -110 cm`) and pinches **Scan Equipment Telemetry** (the preview-testable stand-in for simulated equipment telemetry / optical marker detection).
2. **Spatial Fault Localization:** Three interactive 3D component hotspots light up directly on the 3D assembly:
   - **Hotspot 1 (`CV-101`) — Primary Coolant Isolation Valve** (`[WARN: Flow Restricted — 18% Simulated Flow]`)
   - **Hotspot 2 (`PR-204`) — High-Pressure Bypass Regulator** (`[FAULT: Over-Pressure Spike — 142 PSI Simulated]`)
   - **Hotspot 3 (`TR-309`) — Thermal Relay Core** (`[CRITICAL FAULT: Core Overheating — 118°C Simulated]`)
3. **Interactive Component Inspection:** The trainee pinches any 3D hotspot directly on the model (or via the spatial selector buttons) to inspect component-specific simulated telemetry, fault root-cause analysis, and procedural safety reminders.
4. **Hands-Free Guided Repair Sequence:** Selecting the fault initiates a **4-step spatial repair training workflow**:
   - **Step 1 — Simulated Lockout & Intake Isolation (`CV-101`):** Close the Primary Coolant Isolation Valve (3D valve wheel rotates `90°` clockwise, a red 3D simulated `LotoSafetyClasp` snaps onto the stem, and pipe flow rings halt at `0%`).
   - **Step 2 — Pressure Bleed & Regulator Purge (`PR-204`):** Open the High-Pressure Bypass Regulator to vent simulated line pressure from `142 PSI` down to `38 PSI` (3D gauge needle sweeps from red left to green right).
   - **Step 3 — Thermal Relay Core Reseat (`TR-309`):** Disengage the tripped relay latch and reseat the Thermal Relay Core (3D relay plunger retracts into its collar and simulated temperature cools from `118°C` to `46°C`).
   - **Step 4 — System Re-Pressurization & Verification (`CV-101`):** Re-open the Primary Coolant Valve to clear the simulated LOTO clasp and confirm balanced simulated flow (`100% Nominal`, `45 PSI`, `42°C`) to complete the training scenario.
5. **Advance, Reverse, Confirm & Reset:** At every step, the trainee can pinch the **active 3D component hotspot** (or **Execute Step**) to animate the mechanical step, **Next Step** / **Prev Step** to review the sequence, or **Reset Unit** to replay the training simulation from the initial fault state.

**Why SPECS (and Not a Phone or Tablet):**
Learning industrial maintenance procedures requires coordinating both hands with three-dimensional valve, gauge, and relay locations. On SPECS, the diagnostic highlights, animated 3D mechanical motions, and procedural reminders sit directly in 3D space registered to the simulated equipment—turning a static checklist into an interactive, heads-up, hands-free training experience.

## Target Category

- **Primary Category:** **Learn & Assist** (`learn`) — Teaches and guides a multi-step mechanical diagnostic and repair procedure in 3D space with step-by-step verification and animated mechanical demonstrations.
- **Secondary Category:** **Everyday Superpowers** (`everyday`) — Visualizes simulated internal flow, pressure, and thermal states directly on 3D sub-assemblies.

## Spatial Design

### Placement

- **Placement Mode:** **World-anchored** (`DeviceTracking` set to `World` on the Perspective `Camera Object`) at workbench depth (`z = -110 cm`).
- **Spatial Layout (Two Cohesive Side-by-Side Zones):**
  1. **3D Equipment Assembly (`EquipmentUnitRoot` at `x = -12 cm, y = -3 cm, z = -110 cm`):** A multi-part, articulated 3D **Cryo-Coolant Pump & Relay Unit** with interactive component hotspots (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`), an animated valve handwheel, a 3D simulated LOTO safety clasp, animated cryo-coolant pipe flow rings, a pressure gauge needle, a pulsing thermal relay core, a bobbing 3D target chevron, and a dual-beam laser scan ring.
  2. **Contextual Diagnostic & Repair Panel (`DiagnosticUIRoot` at `x = +11.5 cm, y = +0.5 cm, z = -110 cm`):** A single stationary `SpectaclesUIKit` `Frame` (`30 cm × 39 cm`) housing:
     - Top Simulation Header (`FIELDFIX AR // MAINTENANCE TRAINING SIMULATION` + `SIM TELEMETRY` readout)
     - Subsystem Selector Row (`CV-101 VALVE`, `PR-204 REG`, `TR-309 RELAY`)
     - Selected Component Status & Dynamic Summary Section (updates from fault root-cause to locked-out to nominal repaired summary)
     - Guided Repair Step Card (`Step 1/4..4/4`, concise action instruction, procedural safety note, 4-step checklist strip, and progress bar)
     - Hands-Free Pinch Action Row (`SCAN / EXECUTE STEP`, `< PREV STEP`, `NEXT STEP >`, `RESET UNIT`)

### Field-of-View & Readability Design

- **Maximum Simultaneous Elements:** **2 spatial groups** positioned side-by-side (`3D Equipment Assembly` on the left, unified `DiagnosticUIRoot` `Frame` on the right) so the central workspace remains unobstructed and nothing is head-locked to screen corners.
- **Additive Display Contrast:** Because SPECS uses an additive waveguide display where pure black (`#000000`) renders transparent, all text labels use high-contrast bright typography (`#FFFFFF` instructions, `#7CE8FF` cyan telemetry, `#FFD64D` amber warnings, `#FF6666` critical fault alerts, and `#52FA94` nominal/verified states) backed by dark semi-opaque pill backgrounds (`alpha = 0.88–0.94`).

### Hands & Input

- **Primary Gestures:**
  - **Ray Aim + Index-Thumb Pinch (`onTriggerEnd` / `onTriggerUp`):** Powered by `SpectaclesInteractionKit` (SIK) and `SpectaclesUIKit`. Works both with tracked hands in SPECS and with mouse click / SIK puppet hand simulation in Lens Studio Preview.
  - **Direct 3D Hotspot Selection & Step Execution:** Each of the three equipment sub-assemblies (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`) has a dedicated box collider + SIK `Interactable` so pinching the active 3D part focuses and executes the corresponding repair step.
  - **Spatial UI Button Controls:** All 7 HUD buttons use `SpectaclesUIKit` `Button` components positioned with forward Z-clearance (`z = +0.75..+1.15 cm` inside `DiagnosticPanelContent`) for reliable SIK raycast targeting.
- **Voice Input:** None required—operable via pinch and ray targeting.

### Audio & Motion

- **Spatial Audio Cues (`Assets/GeneratedSFX/` via CLAD `/build-sfx`):**
  - `ScanSweep.wav` — Radar sweep when **Scan Equipment Telemetry** is triggered.
  - `FaultAlert.wav` — Dual-tone alert chime when simulated faults are localized.
  - `ButtonClick.wav` — Tactile click on hotspot selection and step navigation pinches.
  - `RepairStepConfirm.wav` — Rising confirmation tone when a repair step is executed.
  - `DiagnosticComplete.wav` — Harmonic chord when all 4 repair steps are verified.
- **Procedural 3D Motion & Articulation (`FieldFixEquipmentMesh.ts` + `FieldFixMain.ts`):**
  - **Fault Pulse:** Faulty component halos and the overheated Thermal Relay Core pulse smoothly.
  - **Scan Ring Sweep:** A dual-beam horizontal laser ring sweeps vertically across the 3D pump assembly during scanning.
  - **Step 1 Animation:** The 3D **Coolant Isolation Valve Wheel** rotates `90°` clockwise, the red 3D **`LotoSafetyClasp`** snaps onto the stem, and the **Coolant Flow Pulse Rings** halt (`0%` flow).
  - **Step 2 Animation:** The **Pressure Gauge Needle** sweeps from the red left zone (`+48°`, `142 PSI`) to the green right zone (`-38°`, `38 PSI`).
  - **Step 3 Animation:** The **Thermal Relay Core** retracts into its collar, rotates its latch `45°`, and transitions from crimson (`118°C`) to cyan/emerald (`46°C`).
  - **Step 4 Animation:** The simulated LOTO clasp clears, the valve wheel opens, the **Coolant Flow Pulse Rings** accelerate to `100%` emerald-green flow, and all halos + **Overhead Status Beacon** illuminate emerald green (`42°C | 45 PSI | 100% Flow`).

## Preview-Testable Adjustments

| Real-World Training Intent | Preview Stand-In |
|---|---|
| Physical industrial pump skid & live sensor telemetry in a training lab | Pre-anchored 3D **Cryo-Coolant Pump & Relay Unit (`Unit #04`)** at workbench depth (`z = -110 cm`) with interactive **Scan Equipment Telemetry** pinch trigger and simulated telemetry (`118°C`, `142 PSI`, `18% Flow`) |
| Physical hand manipulation of valves, bleed regulators, and relay latches | Pinching the highlighted 3D component hotspot (or **Execute Step**) drives real-time 3D mechanical articulation (rotating valve wheel, snapping simulated LOTO clasp, sweeping gauge needle, retracting relay plunger) |
| Walking around the machine bay to inspect sub-assemblies | Direct 3D hotspot pinching on the angled equipment assembly + quick-select component buttons (`CV-101 VALVE`, `PR-204 REG`, `TR-309 RELAY`) reachable from the Preview camera |

## Done Criteria

- [x] **Scene & Spatial Setup:** Project compiles with zero TypeScript errors, runs in Lens Studio Preview (`SPECS 27`, `Interactive` mode) at `z = -110 cm` with `Camera` (`Perspective` + `DeviceTracking: World`) and `SpectaclesInteractionKit`.
- [x] **3D Equipment & Hotspot Interaction:** The multi-part 3D Cryo-Coolant Pump & Relay Unit renders clearly in the preview viewport with 3 distinct interactive hotspots (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`) selectable via pinch/click.
- [x] **Simulated Telemetry Scan:** Triggering **Scan Equipment Telemetry** plays the scan sweep animation/audio, transitions the unit from `READY_TO_SCAN` to `DIAGNOSING`, and highlights the simulated faulty components (`118°C`, `142 PSI`, `18% Flow`).
- [x] **4-Step Guided Repair & Bidirectional Navigation:** Users can step forward (`Next Step`), step backward (`Prev Step`), and execute (`Confirm Action` / 3D hotspot pinch) all 4 repair steps (`Lockout Valve` → `Purge Regulator` → `Reseat Relay Core` → `Verify Flow`), with each step updating the UI card, progress counter (`1/4`..`4/4`), dynamic component summary, and 3D mechanical articulation.
- [x] **Completion & Reset Sequence:** Confirming all 4 repair steps triggers the `SYSTEM NOMINAL - REPAIR VERIFIED` completion state (`42°C`, `45 PSI`, `100% Flow`, green beacon, nominal component summaries), and pinching **Reset Unit** cleanly restores the initial state for replay.
- [x] **Automated LEAF & SIK Preview Verification:** Verified both with real SIK hand pinches via `PreviewInteractTool` (`stepCount: 19, success: true`) and with all 3 automated `Leaf.lspkg` scenarios (`FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`).
