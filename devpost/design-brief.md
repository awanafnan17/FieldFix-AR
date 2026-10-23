---
title: "FieldFix AR"
category: learn
status: approved
---

# FieldFix AR

> Step up to a simulated overheating industrial Cryo-Coolant Pump & Relay Unit, pinch to run a spatial diagnostic scan, toggle 3D X-Ray Cutaway mode to inspect internal valve seals, diaphragms, and stator windings in 3D space, and practice a safety-interlocked 4-step hands-free Lockout-Tagout (`LOTO`) repair with Before/After spatial comparison.

## What It Is

**FieldFix AR** is a spatial, hands-free industrial maintenance **training simulation** built for Snap SPECS using **Closed Loop Agentic Development (`CLAD`)** and the Lens Studio MCP Server. It is designed for field service trainees, plant technicians, and engineering students who want to practice diagnosing multi-component equipment faults, inspecting internal sub-assemblies via 3D X-Ray Cutaways, following strict Lockout-Tagout (`LOTO`) procedural interlock ordering, and executing multi-step mechanical repairs while keeping both hands free.

> **Simulation Scope Note:** All temperature, pressure, coolant-flow, and fault readings in FieldFix AR are simulated in software for training purposes; the Lens does not interface with physical plant sensors or establish real physical electrical/mechanical lockout isolation.

**The Core Training Loop:**
1. **Approach & Scan:** The trainee looks at the spatially anchored **Cryo-Coolant Pump & Relay Unit (`Unit #04`)** at workbench depth (`z = -110 cm`) and pinches **Scan Equipment Telemetry** (the preview-testable stand-in for simulated equipment telemetry / optical marker detection).
2. **Spatial Fault Localization & 3D X-Ray Cutaway Inspection:** Three interactive 3D component hotspots light up directly on the 3D assembly linked by 3D Callout Leader Struts, and trainees can toggle **`X-RAY CUTAWAY`** to explode internal 3D sub-assemblies (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`) outward (`y = +2.75..3.15 cm, z = +1.45 cm`) and inspect their rotating internal geometry:
   - **Hotspot 1 (`CV-101`) — Primary Coolant Isolation Valve** (`[WARN: Flow Restricted — 18% Simulated Flow]`)
   - **Hotspot 2 (`PR-204`) — High-Pressure Bypass Regulator** (`[FAULT: Over-Pressure Spike — 142 PSI Simulated]`)
   - **Hotspot 3 (`TR-309`) — Thermal Relay Core** (`[CRITICAL FAULT: Core Overheating — 118°C Simulated]`)
3. **Sequential LOTO Safety Interlock Enforcement:** If a trainee attempts to execute Step 2 (`PR-204`), Step 3 (`TR-309`), or Step 4 before completing prior prerequisite steps, FieldFix AR blocks the unsafe action, flashes a 3D red hazard halo with `FaultAlert.wav`, displays a `SAFETY INTERLOCK [LOTO VIOLATION]` banner, and redirects focus to the required prerequisite step (`CV-101`).
4. **Hands-Free Guided Repair Sequence:**
   - **Step 1 — Simulated Lockout & Intake Isolation (`CV-101`):** Close the Primary Coolant Isolation Valve (asymmetric yellow-tipped 3D valve lever rotates `90°` clockwise from `0°` up to `-90°` right, a red 3D simulated `LotoSafetyClasp` snaps onto the stem, and pipe flow rings halt at `0%`).
   - **Step 2 — Pressure Bleed & Regulator Purge (`PR-204`):** Open the High-Pressure Bypass Regulator to vent simulated line pressure from `142 PSI` down to `38 PSI` (3D gauge needle sweeps from red left to green right).
   - **Step 3 — Thermal Relay Core Reseat (`TR-309`):** Disengage the tripped relay latch and reseat the Thermal Relay Core (3D relay plunger retracts into its collar and simulated temperature cools from `118°C` to `46°C`).
   - **Step 4 — System Re-Pressurization, Verification & Competency Scorecard (`CV-101`):** Re-open the Primary Coolant Valve (`+90°` left) to clear the simulated LOTO clasp, confirm balanced simulated flow (`100% Nominal`, `45 PSI`, `42°C`), and receive a **Trainee Competency Scorecard** (`100% / A+ FLAWLESS LOTO` or `85% / B+ SAFETY REDIRECTED`).
5. **Before / After Spatial Comparison, Bidirectional Navigation & Reset:** After completion, trainees can pinch **`COMPARE BEFORE/AFTER`** to dynamically animate the 3D machine and telemetry between `FAULT (BEFORE)` (`118°C / 142 PSI / 18% Flow`) and `NOMINAL (AFTER)` (`42°C / 45 PSI / 100% Flow`), step backward/forward (`< PREV STEP`, `NEXT STEP >`), or pinch **`RESET UNIT`** to replay the training simulation.

## Target Category

- **Primary Category:** **Learn & Assist** (`learn`) — Teaches and guides a safety-interlocked multi-step mechanical diagnostic and repair procedure in 3D space with 3D X-Ray Cutaways, step-by-step verification, and animated mechanical demonstrations.
- **Secondary Category:** **Everyday Superpowers** (`everyday`) — Gives trainees X-Ray vision into internal cryo-seal gates, spring diaphragms, and copper stator windings right on the 3D assembly.

## Spatial Design

### Placement

- **Placement Mode:** **World-anchored** (`DeviceTracking` set to `World` on the Perspective `Camera Object`) at workbench depth (`z = -110 cm`).
- **Spatial Layout (Two Cohesive Side-by-Side Zones):**
  1. **3D Equipment Assembly (`EquipmentUnitRoot` at `x = -12 cm, y = -3 cm, z = -110 cm`):** A multi-part, articulated 3D **Cryo-Coolant Pump & Relay Unit** with interactive component hotspots (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore` with `5.2 × 5.2 × 7.0` colliders), an asymmetric yellow-tipped 3D valve lever handle, a 3D simulated LOTO safety clasp, 3 internal rotating X-Ray sub-assemblies (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`), 3D callout leader struts, animated cryo-coolant pipe flow rings, a pressure gauge needle, a pulsing thermal relay core, a bobbing 3D target chevron, and a dual-beam laser scan ring.
  2. **Contextual Diagnostic & Repair Panel (`DiagnosticUIRoot` at `x = +11.5 cm, y = +0.5 cm, z = -110 cm`):** A single stationary `SpectaclesUIKit` `Frame` (`28 cm × 43.2 cm`) with vertically centered content (`DiagnosticPanelContent` at `y = +1.35 cm, z = +0.8 cm`) housing:
     - Top Simulation Header (`FIELDFIX AR // MAINTENANCE TRAINING SIMULATION` + `SIM TELEMETRY` readout)
     - Subsystem Selector Row (`CV-101 VALVE`, `PR-204 REG`, `TR-309 RELAY`)
     - Selected Component Status, X-Ray Cutaway Detail & LOTO Safety Interlock Banner Section
     - Guided Repair Step Card (`Step 1/4..4/4`, concise action instruction, procedural safety note, Trainee Competency Scorecard, 4-step checklist strip, and progress bar)
     - Hands-Free Pinch Action Rows (`SCAN / EXECUTE STEP`, `< PREV STEP`, `NEXT STEP >`, `RESET UNIT`, `X-RAY CUTAWAY`, `COMPARE BEFORE/AFTER`)

### Field-of-View & Readability Design

- **Maximum Simultaneous Elements:** **2 spatial groups** positioned side-by-side (`3D Equipment Assembly` on the left, unified `DiagnosticUIRoot` `Frame` on the right) so the central workspace remains unobstructed and nothing is head-locked to screen corners.
- **Additive Display Contrast:** Because SPECS uses an additive waveguide display where pure black (`#000000`) renders transparent, all text labels use high-contrast bright typography (`#FFFFFF` instructions, `#7CE8FF` cyan telemetry, `#FFD64D` amber warnings, `#FF6666` critical fault alerts, and `#52FA94` nominal/verified states) backed by dark semi-opaque pill backgrounds (`alpha = 0.88–0.94`).

## Done Criteria

- [x] **Scene & Spatial Setup:** Project compiles with zero TypeScript errors, runs in Lens Studio Preview (`SPECS 27`, `Interactive` mode) at `z = -110 cm` with `Camera` (`Perspective` + `DeviceTracking: World`) and `SpectaclesInteractionKit`.
- [x] **3D Equipment, X-Ray Cutaways & Hotspot Interaction:** The multi-part 3D Cryo-Coolant Pump & Relay Unit renders clearly in the preview viewport with 3 distinct interactive hotspots (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`), an asymmetric yellow-tipped 3D valve lever, 3D callout leader struts, and 3 exploding internal X-Ray sub-assemblies (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`).
- [x] **Sequential LOTO Safety Interlock:** Attempting out-of-order repair execution blocks the step, flashes the 3D red hazard halo, plays `FaultAlert.wav`, displays the `SAFETY INTERLOCK [LOTO VIOLATION]` banner, and auto-redirects focus to the required prerequisite step.
- [x] **4-Step Guided Repair, Competency Scorecard & Before/After Comparison:** Users can execute all 4 repair steps (`Lockout Valve` → `Purge Regulator` → `Reseat Relay Core` → `Verify Flow`), view their Trainee Competency Scorecard (`100% / A+` or `85% / B+`), toggle `COMPARE BEFORE/AFTER` between Fault and Nominal states, and reset cleanly (`RESET UNIT`).
- [x] **Automated LEAF & SIK Preview Verification:** Verified both with real SIK hand pinches via `PreviewInteractTool` across all 3D hotspots and all 9 UIKit buttons, and with all 4 automated `Leaf.lspkg` scenarios (`FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`, `FieldFixAdversarialSafetyAndXRayScenario`).
