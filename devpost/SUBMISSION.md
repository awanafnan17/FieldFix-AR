# FieldFix AR — Devpost Project Submission (`Learn AR with SPECS`)

## 1. Ready-to-Paste YouTube Upload Metadata

### YouTube Title
`FieldFix AR — Hands-Free Spatial Maintenance Training Simulation for Snap SPECS (Learn AR with SPECS)`

### YouTube Description
```text
FieldFix AR is an interactive, hands-free industrial maintenance training simulation built for Snap SPECS (SPECS 27) in Lens Studio 5.24.1 using CLAD (Closed Loop Agentic Development) and the official Lens Studio MCP Server.

Created for the "Learn AR with SPECS" Devpost Hackathon.

CHAPTERS & SPATIAL AR CAPABILITIES DEMONSTRATED (1:44):
• 0:00 — 1. The Problem, Solution & Spatial AR Concept: Technicians need both hands free during complex equipment maintenance. FieldFix AR anchors a 3D Cryo-Coolant Pump & Relay Unit (#04) and a guided repair checklist side-by-side in world space (z = -110 cm).
• 0:10 — 2. Simulated Diagnostic Scan & Fault Visualization: A right-hand pinch on [SCAN EQUIPMENT TELEMETRY] sweeps a volumetric 3D laser ring across the assembly and highlights three simulated faults with color-coded spatial badges: CV-101 Intake Valve (18% flow), PR-204 Bypass Regulator (142 PSI), and TR-309 Thermal Relay (118°C).
• 0:25 — 3. Real Hand Interactions with 3D Equipment Components: Trainees pinch the 3D machine parts directly via Spectacles Interaction Kit (SIK). Step 1 rotates the 3D valve wheel 90°, snaps on a simulated red Lockout-Tagout (LOTO) clasp, and halts pipe flow rings (0%). Step 2 purges the 3D pressure regulator, sweeping the gauge needle from red (142 PSI) into green (38 PSI). Step 3 retracts the tripped thermal relay plunger and cools the simulated core to 46°C.
• 0:55 — 4. Guided Repair Sequence, Simulated Telemetry Recovery & Completion: Step 4 re-opens the 3D intake valve, clears the simulated LOTO clasp, and restores 100% simulated coolant flow across the manifold (42°C | 45 PSI | 100% Flow | 4/4 DONE). Selecting any subsystem after repair displays coherent nominal status summaries.
• 1:20 — 5. Step Navigation, Equipment Reset, Automated Testing & CLAD + MCP Workflow: Demonstrates [< PREV STEP] review, one-pinch [RESET UNIT] for repeatable training, and automated in-preview verification in Lens Studio 5.24.1 using Closed Loop Agentic Development (CLAD), Lens Studio MCP, and LEAF (3/3 scenarios passed).
• 1:35 — 6. Completed AR Experience & Summary: Final view of the nominal 3D pump unit and floating SpectaclesUIKit HUD.

IMPORTANT SIMULATION NOTE:
FieldFix AR is an educational and procedural maintenance training simulation. All temperature, pressure, coolant-flow, and fault readings are simulated in software, and the Lockout-Tagout (LOTO) step teaches procedural sequence awareness rather than establishing physical isolation on live machinery.

TECH STACK:
• Snap Lens Studio 5.24.1 (SPECS 27 target)
• CLAD (Closed Loop Agentic Development) + Lens Studio MCP (PreviewInteractTool, QueryRuntimeSceneTool, run_leaf_scenario, RunAndCollectLogsTool)
• SpectaclesInteractionKit (SIK) v2.0.0 & SpectaclesUIKit v2.0.0
• Procedural Runtime 3D Geometry via MeshBuilder + SimpleVertexBaseColor.lspkg
• Procedural 44.1 kHz Spatial Audio via CLAD /build-sfx
• Automated Integration Testing via LEAF (Leaf.lspkg v2.0.2)

PUBLIC SOURCE REPOSITORY:
https://github.com/awanafnan17/FieldFix-AR
```

---

## 2. Ready-to-Paste Devpost Submission Fields

### Project Title
**FieldFix AR — Hands-Free Spatial Maintenance Training Simulation**

### Elevator Pitch (Tagline)
An interactive hands-free maintenance training simulation for Snap SPECS where trainees pinch 3D valves, pressure regulators, and thermal relays in space to diagnose simulated faults and practice a 4-step Lockout-Tagout repair workflow.

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
When learning to service industrial valves, pressure regulators, and thermal relays, trainees and technicians must coordinate physical hand actions with multi-step safety checklists. Studying a flat paper manual or holding a tablet forces trainees to look away from the equipment and mentally map 2D part codes (`CV-101`, `PR-204`, `TR-309`) onto three-dimensional plumbing and controls.

We built **FieldFix AR** for **Snap SPECS** as an **interactive, hands-free industrial maintenance training simulation**. Instead of floating a flat 2D webpage in front of the user's face, FieldFix AR places an articulated 3D equipment assembly and a companion world-anchored instruction panel side-by-side at workbench depth (`z = -110 cm`). Trainees can look freely around the equipment and **pinch directly on the 3D machine components** (or use the floating checklist buttons) to see how each repair step physically changes the assembly.

---

### What It Does
**FieldFix AR** guides a trainee through diagnosing and resolving a simulated multi-component fault on a **Cryo-Coolant Pump & Relay Unit (`Unit #04`)**:

1. **Simulated Spatial Diagnostic Scan (`SCAN EQUIPMENT TELEMETRY`):**
   - Pinching the scan button (or any 3D component in standby) sweeps a dual-beam 3D laser ring (`LaserScanSweepRing`) across the pump unit with a spatial radar sound effect.
   - Three interactive 3D subsystems light up with severity-coded diagnostic halos and high-contrast floating spatial callout badges:
     - **`[CV-101]` Primary Coolant Isolation Valve** — `WARN: FLOW RESTRICTED (18%)` (Amber halo, slow amber pipe flow rings)
     - **`[PR-204]` High-Pressure Bypass Regulator** — `FAULT: OVER-PRESSURE (142 PSI)` (Amber halo, gauge needle pointing to the red left zone)
     - **`[TR-309]` Thermal Relay Core Assembly** — `CRITICAL: CORE OVERHEAT (118°C)` (Pulsing crimson halo, raised relay plunger)

2. **Direct 3D Component Manipulation + Floating Checklist HUD:**
   - A 3D bobbing pointer chevron (`ActiveStepTargetChevron`) hovers directly above the current step's target 3D part (`CV-101`, `PR-204`, or `TR-309`).
   - Trainees can **pinch the 3D component hotspot directly on the machine** (via `SpectaclesInteractionKit` `Interactable` colliders) to inspect and execute the active step, OR use the companion `SpectaclesUIKit` panel (`CV-101 VALVE`, `PR-204 REG`, `TR-309 RELAY`, `EXECUTE STEP`).

3. **4-Step Guided Repair Sequence with Visible Mechanical Feedback:**
   - **Step 1/4 — Isolate Intake Valve (`CV-101`):** Pinching the 3D `CV-101` valve rotates the 3D spoked handwheel `90°` clockwise, attaches a red **3D simulated Lockout-Tagout (`LotoSafetyClasp`)** onto the valve stem, halts the animated pipe flow rings (`Flow: 0%`, `Simulated Pressure: 128 PSI`), and marks `[1:LOTO OK]`.
   - **Step 2/4 — Purge Bypass Regulator (`PR-204`):** Pinching the 3D `PR-204` regulator vents simulated bypass pressure, sweeps the 3D pressure gauge needle from the red left zone (`142 PSI`) into the green right zone (`38 PSI`), lowers simulated temperature to `82°C`, and marks `[2:PURGE OK]`.
   - **Step 3/4 — Reseat Thermal Relay Core (`TR-309`):** Pinching the 3D `TR-309` relay retracts the raised thermal relay plunger into its collar, rotates the top latch `45°`, lowers simulated core temperature from `118°C` to `46°C`, and marks `[3:RESEAT OK]`.
   - **Step 4/4 — Re-Pressurize & Verify Flow (`CV-101`):** Pinching the 3D `CV-101` valve removes the simulated LOTO clasp, rotates the valve wheel open, accelerates the emerald-green cryo-coolant flow rings (`CoolantFlowPulseRing_0..2`) to `100%` simulated flow across the manifold pipe, turns all subsystem halos and the overhead beacon emerald green, and updates all subsystem descriptions to their verified nominal summaries (`42°C | 45 PSI | 100% FLOW | 4/4 DONE`).

4. **Bidirectional Step Review & Repeatable Training Reset:**
   - Trainees can pinch `< PREV STEP` or `NEXT STEP >` to review instructions, select any subsystem button to read its current status summary (fault, locked-out mid-repair, or repaired nominal), or pinch `RESET UNIT` to restore the initial fault state (`116°C`, `140 PSI`, `0/4`) for repeated practice.

> **Simulation Scope Note:** FieldFix AR is an interactive training simulation. All temperature, pressure, and flow telemetry values are simulated in software, and the simulated Lockout-Tagout (`LOTO`) step is designed for procedural training rather than physical hazard isolation on live industrial equipment.

---

### How We Built It
- **Snap Lens Studio 5.24.1 & Closed Loop Agentic Development (`CLAD`) + Lens Studio MCP:**
  - Planned using the official `plan-lens` workflow (`devpost/design-brief.md`) for additive waveguide contrast (high-contrast text over dark backing pills inside a world-anchored frame) and a clean side-by-side spatial layout (`3D machine` on the left, `UIKit checklist` on the right) that keeps the central workspace unobstructed.
  - Built, inspected, and iteratively verified using **Closed Loop Agentic Development (`CLAD`)** skills (`ls-clad`) and the **Lens Studio MCP** server (`RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `PreviewInteractTool`, `QueryRuntimeSceneTool`, `CapturePanelScreenshotTool`, `run_leaf_scenario`).
- **Procedural Multi-Part 3D Equipment (`FieldFixEquipmentMesh.ts`):**
  - Constructed in TypeScript using Lens Studio's `MeshBuilder` API and `SimpleVertexBaseColor.lspkg` vertex-colored materials—generating the 3D pump skid, manifold pipes, animated cryo-coolant flow pulse rings, spoked valve wheel, 3D simulated LOTO clasp, pressure gauge dial and needle, finned thermal relay core, overhead status beacon, 3D target chevron, and dual-beam laser scan ring with zero paid or external 3D assets.
- **SPECS World-Space UI (`FieldFixDiagnosticUI.ts`):**
  - Built with `SpectaclesUIKit.lspkg` v2.0.0 (`Frame`, `Button`, `ProgressBar`), `SpectaclesInteractionKit.lspkg` v2.0.0 (`Interactable`), high-contrast dark backing pills, and dynamic component status descriptions that update cleanly as each part transitions from faulted to locked-out to repaired.
- **Procedural Spatial Audio (`FieldFixAudioController.ts`):**
  - Synthesized 5 custom 44.1 kHz `.wav` sound effects (`ButtonClick.wav`, `ScanSweep.wav`, `FaultAlert.wav`, `RepairStepConfirm.wav`, `DiagnosticComplete.wav`) locally via CLAD `/build-sfx`.
- **Real SIK Hand Preview Verification + Automated LEAF Test Suite (`Assets/Tests/`):**
  - Verified both with real SIK puppet hand pinches via `PreviewInteractTool` and `QueryRuntimeSceneTool` (which surfaced and helped us fix a root `Frame` collider / billboard z-occlusion issue on secondary buttons, as well as gauge needle sweep direction and post-repair status descriptions) and with 3 automated `Leaf.lspkg` v2.0.2 integration scenarios (`FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`).
