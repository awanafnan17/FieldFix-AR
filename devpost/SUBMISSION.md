# FieldFix AR — Devpost Project Submission (`Learn AR with SPECS`)

## 1. Ready-to-Paste YouTube Upload Metadata

### YouTube Title
`FieldFix AR — Hands-Free Spatial Maintenance Training Simulation for Snap SPECS (Learn AR with SPECS)`

### YouTube Description
```text
FieldFix AR is an interactive, hands-free industrial maintenance training simulation built for Snap SPECS (SPECS 27) in Lens Studio 5.24.1 using CLAD (Closed Loop Agentic Development) and the official Lens Studio MCP Server.

Created for the "Learn AR with SPECS" Devpost Hackathon.

CHAPTERS & SPATIAL AR CAPABILITIES DEMONSTRATED (2:00):
• 0:00 — 1A. Live AR Gameplay Highlight: Opens immediately in live SPECS AR action with exploded 3D X-Ray Cutaway sub-assemblies and direct SIK hand-pinch manipulation.
• 0:05 — 1B. The Problem, Solution & Spatial AR Layout: Technicians need both hands free during complex equipment maintenance. FieldFix AR anchors an articulated 3D Cryo-Coolant Pump & Relay Unit (#04) and a guided repair checklist side-by-side in world space (z = -110 cm).
• 0:12 — 2. Telemetry Scan & 3D X-Ray Cutaway Mode: A right-hand pinch sweeps a volumetric 3D laser ring across the assembly to localize three faults (CV-101 at 18% flow, PR-204 at 142 PSI, TR-309 at 118°C). Pinching [X-RAY CUTAWAY] explodes the internal cryo-seal gate, spring diaphragm, and copper stator windings out of their housings in 3D space.
• 0:28 — 3. Sequential Industrial LOTO Safety Interlock (Logs Violation #1): Attempting to unseat the overheated TR-309 Relay Core (Step 3) before locking out the intake valve (Step 1) triggers a 3D red hazard flash, audible warning, logs LOTO Violation #1 (-15% score penalty), and automatically redirects focus to CV-101.
• 0:42 — 4. Steps 1 & 2: 3D Valve LOTO & Pressure Regulator Purge: Pinching the 3D CV-101 valve rotates the yellow-tipped lever handle 90° clockwise, snaps on a red 3D Lockout-Tagout (LOTO) safety clasp, and halts the manifold pipe flow rings (0%). Pinching the 3D PR-204 regulator vents trapped line pressure, sweeping the 3D gauge needle from red (142 PSI) into green (38 PSI).
• 0:57 — 5. Step 3/4: 3D Thermal Relay Core Reseat: Pinching the 3D TR-309 relay retracts the tripped plunger into its collar, rotates the latch 45°, and cools the simulated core from 118°C to 46°C.
• 1:10 — 6A. Run #1 Completion Scorecard (85% B+ Safety Redirected): Completing Step 4 on Run #1 restores 100% flow (42°C | 45 PSI) and awards 85% (B+ SAFETY REDIRECTED | LOTO Violations: 1), accurately reflecting the earlier out-of-order LOTO violation at 0:28.
• 1:17 — 6B. Clean Attempt After Reset (Run #2 — 100% A+ Flawless LOTO): After resetting and executing all 4 steps in strict LOTO sequence with zero violations, completing Step 4 awards 100% (A+ FLAWLESS LOTO | LOTO Violations: 0).
• 1:24 — 7. Before / After Spatial Comparison Mode: Toggling [COMPARE BEFORE/AFTER] dynamically animates the 3D machine, valve lever, gauge needle, and telemetry between Fault (118°C / 142 PSI / 18% Flow) and Nominal (42°C / 45 PSI / 100% Flow).
• 1:38 — 8. Step Navigation, Reset & 5/5 Automated LEAF Verification: Demonstrates bidirectional review, one-pinch [RESET UNIT], and automated in-preview verification in Lens Studio 5.24.1 using CLAD, Lens Studio MCP, and LEAF (5/5 scenarios passed, 48/48 assertions, including FieldFixTraceTheFaultSignatureScenario).
• 1:51 — 9. FieldFix AR — Completed Spatial Training Summary: Showcases verified nominal operation combined with 3D X-Ray Cutaway mode across all three subsystems.

IMPORTANT SIMULATION NOTE:
FieldFix AR is an educational and procedural maintenance training simulation. All temperature, pressure, coolant-flow, and fault readings are simulated in software, and the Lockout-Tagout (LOTO) safety interlock teaches procedural sequence awareness rather than establishing physical isolation on live machinery.

TECH STACK:
• Snap Lens Studio 5.24.1 (SPECS 27 target)
• CLAD (Closed Loop Agentic Development) + Lens Studio MCP (PreviewInteractTool, QueryRuntimeSceneTool, run_leaf_scenario, RunAndCollectLogsTool)
• SpectaclesInteractionKit (SIK) v2.0.0 & SpectaclesUIKit v2.0.0
• Procedural Runtime 3D Geometry via MeshBuilder + SimpleVertexBaseColor.lspkg
• Procedural 44.1 kHz Spatial Audio via CLAD /build-sfx + Spoken Voiceover Narration
• Automated Integration Testing via LEAF (Leaf.lspkg v2.0.2 — 5/5 Scenarios Passing)

PUBLIC SOURCE REPOSITORY:
https://github.com/awanafnan17/FieldFix-AR
```

---

## 2. Ready-to-Paste Devpost Submission Fields

### Project Title
**FieldFix AR — Hands-Free Spatial Maintenance Training Simulation**

### Elevator Pitch (Tagline)
An interactive hands-free maintenance training simulation for Snap SPECS with 3D X-Ray Cutaways, a Sequential LOTO Safety Interlock, Before/After Spatial Comparison, and direct 3D component manipulation.

### Public Code Repository URL (`Try it out` / GitHub Link)
`https://github.com/awanafnan17/FieldFix-AR`

### Built With
- `snap-specs`
- `lens-studio`
- `clad`
- `model-context-protocol`
- `typescript`
- `spectacles-interaction-kit`
- `spectacles-ui-kit`
- `leaf`

---

## 3. Full Project Story (Devpost Description)

### Inspiration: Why Maintenance Training Belongs in Spatial AR
When learning to service industrial valves, pressure regulators, and thermal relays, trainees and technicians must coordinate physical hand actions with strict safety interlocks. Studying a flat paper manual or holding a tablet forces trainees to look away from the equipment, occupies their hands, and makes it impossible to visualize internal valve seals, diaphragm compression, or stator coil overheating inside sealed housings.

We built **FieldFix AR** for **Snap SPECS (`SPECS 27`)** as an **interactive, hands-free industrial maintenance training simulation**. Instead of floating a flat 2D webpage in front of the user's face, FieldFix AR places an articulated 3D equipment assembly and a companion world-anchored instruction panel side-by-side at workbench depth (`z = -110 cm`). Trainees can look freely around the equipment, **explode internal 3D sub-assemblies in X-Ray Cutaway mode**, experience **real-time Lockout-Tagout (`LOTO`) safety interlock enforcement**, and **pinch directly on the 3D machine components** to execute repairs.

---

### What It Does
**FieldFix AR** guides a trainee through diagnosing and resolving a simulated multi-component fault on a **Cryo-Coolant Pump & Relay Unit (`Unit #04`)**:

1. **Simulated Spatial Diagnostic Scan (`SCAN EQUIPMENT TELEMETRY`):**
   - Pinching the scan button (or any 3D component in standby) sweeps a dual-beam 3D laser ring (`LaserScanSweepRing`) across the pump unit with a spatial radar sound effect.
   - Three interactive 3D subsystems light up with severity-coded diagnostic halos, high-contrast floating spatial callout badges, and **3D Callout Leader Struts**:
     - **`[CV-101]` Primary Coolant Isolation Valve** — `WARN: FLOW RESTRICTED (18%)` (Amber halo, slow amber pipe flow rings)
     - **`[PR-204]` High-Pressure Bypass Regulator** — `FAULT: OVER-PRESSURE (142 PSI)` (Amber halo, gauge needle pointing to the red left zone)
     - **`[TR-309]` Thermal Relay Core Assembly** — `CRITICAL: CORE OVERHEAT (118°C)` (Pulsing crimson halo, raised relay plunger)

2. **3D Spatial X-Ray / Exploded Component Inspection (`X-RAY CUTAWAY`):**
   - Something impossible on a paper checklist or 2D screen: pinching **`X-RAY CUTAWAY`** explodes three internal 3D procedural sub-assemblies (`y = +2.75..3.15 cm, z = +1.45 cm`) out of the outer housings and rotates them in space so trainees can inspect internal fault mechanics:
     - **`ValveInternalCryoSeal` (`CV-101`):** Reveals the partially fouled internal cryo-seal gate (`18%` choked flow -> `0%` LOTO sealed -> `100%` full-bore laminar flow).
     - **`RegulatorInternalDiaphragm` (`PR-204`):** Reveals the compressed internal spring diaphragm & relief poppet (`142 PSI` surge -> `38 PSI` vented equilibrium).
     - **`RelayInternalStatorCoil` (`TR-309`):** Reveals the overheated copper stator windings & magnetic plunger latch (`118°C` tripped -> `46°C` reseated).

3. **Sequential Industrial LOTO Safety Interlock (`SAFETY INTERLOCK [LOTO VIOLATION]`):**
   - In real industrial maintenance, venting a high-pressure regulator or reseating a relay before locking out the primary intake valve is a critical hazard.
   - If a trainee attempts to execute Step 2 (`PR-204`), Step 3 (`TR-309`), or Step 4 out of order, FieldFix AR **blocks the unsafe action**, flashes a 3D red hazard halo across the assembly with an alert chime (`FaultAlert.wav`), displays a corrective `SAFETY INTERLOCK [LOTO VIOLATION]` banner, and automatically redirects focus to the required prerequisite step (`CV-101`).

4. **Direct 3D Component Manipulation & 4-Step Guided Repair Sequence:**
   - A 3D bobbing pointer chevron (`ActiveStepTargetChevron`) hovers directly above the current step's target 3D part (`CV-101`, `PR-204`, or `TR-309`).
   - **Step 1/4 — Isolate Intake Valve (`CV-101`):** Pinching the 3D `CV-101` valve rotates the **asymmetric yellow-tipped 3D lever handle** `90°` clockwise (`0°` up to `-90°` right), snaps a red **3D simulated Lockout-Tagout (`LotoSafetyClasp`)** onto the stem, halts the animated pipe flow rings (`Flow: 0%`), and marks `[1:LOTO OK]`.
   - **Step 2/4 — Purge Bypass Regulator (`PR-204`):** Pinching the 3D `PR-204` regulator vents simulated bypass pressure, sweeps the 3D pressure gauge needle from the red left zone (`142 PSI`) into the green right zone (`38 PSI`), lowers simulated temperature to `82°C`, and marks `[2:PURGE OK]`.
   - **Step 3/4 — Reseat Thermal Relay Core (`TR-309`):** Pinching the 3D `TR-309` relay retracts the raised thermal relay plunger into its collar, rotates the top latch `45°`, lowers simulated core temperature from `118°C` to `46°C`, and marks `[3:RESEAT OK]`.
   - **Step 4/4 — Re-Pressurize, Verify Flow & Trainee Competency Scorecard (`CV-101`):** Pinching the 3D `CV-101` valve removes the simulated LOTO clasp, rotates the asymmetric valve lever open (`+90°` left), accelerates the emerald-green cryo-coolant flow rings (`CoolantFlowPulseRing_0..2`) to `100%` simulated flow across the manifold pipe, turns all subsystem halos and the overhead beacon emerald green (`42°C | 45 PSI | 100% FLOW | 4/4 DONE`), and generates a **Trainee Competency Scorecard** (`100% / A+ FLAWLESS LOTO` or `85% / B+ SAFETY REDIRECTED`).

5. **Before / After Spatial Comparison Mode (`COMPARE BEFORE/AFTER`) & Repeatable Reset:**
   - Once all 4 steps are completed, trainees can pinch **`COMPARE BEFORE/AFTER`** to dynamically animate the 3D machine, valve lever, gauge needle, relay core, flow rings, and telemetry between `FAULT (BEFORE)` (`118°C / 142 PSI / 18% Flow`) and `NOMINAL (AFTER)` (`42°C / 45 PSI / 100% Flow`), step backward/forward (`< PREV STEP`, `NEXT STEP >`), or pinch **`RESET UNIT`** to replay the simulation.

> **Simulation Scope Note:** FieldFix AR is an interactive training simulation. All temperature, pressure, and flow telemetry values are simulated in software, and the simulated Lockout-Tagout (`LOTO`) safety interlock is designed for procedural training rather than physical hazard isolation on live industrial equipment.

---

### How We Built It
- **Snap Lens Studio 5.24.1 & Closed Loop Agentic Development (`CLAD`) + Lens Studio MCP:**
  - Planned using the official `plan-lens` workflow (`devpost/design-brief.md`) for additive waveguide contrast (high-contrast text over dark backing pills inside a world-anchored frame) and a clean side-by-side spatial layout (`3D machine` on the left, `UIKit checklist` on the right).
  - Built, inspected, and iteratively verified using **Closed Loop Agentic Development (`CLAD`)** skills (`ls-clad`) and the **Lens Studio MCP** server (`RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `PreviewInteractTool`, `QueryRuntimeSceneTool`, `CapturePanelScreenshotTool`, `run_leaf_scenario`).
- **Procedural Multi-Part 3D Equipment & X-Ray Sub-Assemblies (`FieldFixEquipmentMesh.ts`):**
  - Constructed in TypeScript using Lens Studio's `MeshBuilder` API and `SimpleVertexBaseColor.lspkg` vertex-colored materials—generating the 3D pump skid, manifold pipes, animated cryo-coolant flow pulse rings, spoked valve wheel with asymmetric yellow-tipped lever handle, 3D simulated LOTO clasp, pressure gauge dial and needle, finned thermal relay core, 3 internal X-Ray sub-assemblies (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`), 3D callout leader struts, overhead status beacon, 3D target chevron, and dual-beam laser scan ring with zero paid or external 3D assets.
- **SPECS World-Space UI (`FieldFixDiagnosticUI.ts`):**
  - Built with `SpectaclesUIKit.lspkg` v2.0.0 (`Frame`, `Button`, `ProgressBar`), `SpectaclesInteractionKit.lspkg` v2.0.0 (`Interactable`), 9 interactive buttons across 4 rows, and dynamic status cards for Normal, X-Ray Cutaway, LOTO Interlock Warning, Before/After Comparison, and Trainee Competency Scorecard views.
- **Real SIK Hand Preview Verification + 5/5 Automated LEAF Test Suite (`Assets/Tests/`):**
  - Verified both with real SIK puppet hand pinches via `PreviewInteractTool` and `QueryRuntimeSceneTool` across all 3D hotspots and all 9 UIKit buttons, and with 5 automated `Leaf.lspkg` v2.0.2 integration scenarios (`FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`, `FieldFixAdversarialSafetyAndXRayScenario`, and `FieldFixTraceTheFaultSignatureScenario`).
