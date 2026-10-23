# FieldFix AR — Devpost Project Submission (`Learn AR with SPECS`)

## 1. Ready-to-Paste YouTube Upload Metadata

### YouTube Title
`FieldFix AR — Spatial Equipment Diagnostic & Hands-Free Repair Assistant for Snap SPECS (Learn AR with SPECS)`

### YouTube Description
```text
FieldFix AR is a spatial, hands-free industrial equipment diagnostic and guided repair assistant built for Snap SPECS (SPECS 27) in Lens Studio 5.24.1 using CLAD (Claude / Antigravity Lens Assisted Development) and the official Lens Studio MCP Server.

Created for the "Learn AR with SPECS" Devpost Hackathon.

KEY SPATIAL AR CAPABILITIES DEMONSTRATED IN THIS VIDEO:
• 0:00 — Chapter 1: Standby & Spatial Anchoring at workbench depth (z = -110 cm). 3D Cryo-Coolant Pump & Relay Unit #04 on the left + world-anchored SpectaclesUIKit HUD on the right (>65% open optical pass-through).
• 0:14 — Chapter 2: Hands-Free SIK Pinch triggers volumetric dual-beam 3D LaserScanSweepRing across the manifold and localizes the critical fault on TR-309 (118°C), then focuses CV-101 Intake Valve.
• 0:28 — Chapter 3: Direct 3D Hotspot Manipulation (Steps 1 & 2). Pinching 3D Hotspot_CoolantValve rotates the 3D valve wheel 90° clockwise, engages the red 3D Lockout-Tagout (LOTO) safety clasp, and halts pipe flow rings (0%). Pinching 3D Hotspot_PressureRegulator purges bypass vapor and sweeps the 3D gauge needle from 142 PSI to 38 PSI.
• 0:42 — Chapter 4: Step 3 (Thermal Relay Core Reseat), Step 4 (100% Nominal Cryo-Coolant Flow Restoration), and [< PREV STEP] review navigation.
• 0:58 — Chapter 5: Dual-Modality Hands-Free Workflow (3D Hotspots + SpectaclesUIKit HUD).
• 1:14 — Chapter 6: Automated In-Preview Verification via LEAF v2.0.2 (FieldFixFullDiagnosticRepairScenario PASSED).
• 1:29 — Chapter 7: One-Pinch Equipment Reset & Replay Verification (FieldFixResetAndReplayScenario PASSED).

TECH STACK:
• Snap Lens Studio 5.24.1 (SPECS 27 target)
• CLAD Skills + Lens Studio MCP (PreviewInteractTool, QueryRuntimeSceneTool, run_leaf_scenario, RunAndCollectLogsTool)
• SpectaclesInteractionKit (SIK) v2.0.0 & SpectaclesUIKit v2.0.0
• Procedural Runtime 3D Geometry via MeshBuilder + SimpleVertexBaseColor.lspkg
• Procedural 44.1 kHz Spatial Audio via CLAD /build-sfx
• Automated Integration Testing via LEAF (Leaf.lspkg v2.0.2)
```

---

## 2. Ready-to-Paste Devpost Submission Fields

### Project Title
**FieldFix AR — Spatial Equipment Diagnostic & Hands-Free Guided Repair Assistant**

### Elevator Pitch (Tagline)
Step up to malfunctioning industrial machinery, pinch to scan live spatial fault telemetry directly on 3D components, and execute a 4-step hands-free repair by directly manipulating 3D subsystems with LOTO safety verification on Snap SPECS.

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

### Inspiration
Field service technicians, plant maintenance engineers, and technical trainees routinely troubleshoot pressurized valves, bypass regulators, and high-voltage thermal relays while holding physical tools in both hands. Consulting a smartphone or a 2D PDF service manual forces technicians to set down tools, look away from active hazards, and mentally translate schematic part numbers (`CV-101`, `PR-204`, `TR-309`) onto physical assemblies.

We designed **FieldFix AR** specifically for **Snap SPECS** to answer a fundamental spatial computing question: *What can optical see-through AR glasses do during equipment maintenance that a phone, tablet, or laptop never can?*
- Anchor diagnostic halos and a 3D target pointer chevron directly onto the physical/spatial sub-assemblies in 3D space.
- Allow the technician to **pinch directly on the 3D subsystem hotspots** (or companion HUD buttons) to execute and verify each physical repair step.
- Demonstrate mechanical motions in 3D right on the assembly: which way an isolation valve rotates, where the Lockout-Tagout (`LOTO`) safety clasp attaches, how coolant flow rings move through the manifold pipe, how the pressure gauge needle responds, and how the thermal relay plunger reseats.
- Keep **>65% of the technician's field of view open pass-through** while providing hands-free pinch navigation and lockout safety verification.

---

### What It Does
**FieldFix AR** presents a complete, self-contained industrial diagnostic and repair scenario anchored at workbench depth (`z = -110 cm`):

1. **Volumetric Spatial Equipment Telemetry Scan (`SCAN EQUIPMENT TELEMETRY`):**
   - Pinching the scan button (or any 3D hotspot in standby) sweeps a dual-beam cyan/emerald 3D laser ring (`LaserScanSweepRing`) across the **Cryo-Coolant Pump & Relay Unit (`Unit #04`)** accompanied by a synthesized spatial radar sweep.
   - Three interactive 3D component hotspots light up with severity-coded diagnostic halos and floating 3D callout badges:
     - **`[CV-101]` Primary Coolant Isolation Valve** — `WARN: FLOW RESTRICTED (18%)` (Amber Halo, sluggish amber pipe flow rings)
     - **`[PR-204]` High-Pressure Bypass Regulator** — `FAULT: OVER-PRESSURE (142 PSI)` (Amber/Orange Halo, red-zone gauge needle)
     - **`[TR-309]` Thermal Relay Core Assembly** — `CRITICAL: CORE OVERHEAT (118°C)` (Pulsing Crimson Halo, popped relay plunger)

2. **Direct 3D Hotspot Manipulation + Companion UIKit HUD:**
   - A 3D bobbing pointer chevron (`ActiveStepTargetChevron`) hovers directly above the current repair step's target 3D component (`CV-101`, `PR-204`, or `TR-309`).
   - Technicians can **pinch the 3D component hotspot directly on the equipment model** (via `SpectaclesInteractionKit` `Interactable` colliders) to focus and execute the active repair step, OR use the companion `SpectaclesUIKit` panel (`CV-101 VALVE`, `PR-204 REG`, `TR-309 RELAY`, `EXECUTE STEP`).

3. **4-Step Guided Repair with Real-Time 3D Mechanical & Flow Articulation:**
   - **Step 1/4 — Lockout Isolation Valve (`CV-101`):** Pinching the 3D `CV-101` valve hotspot (or `EXECUTE STEP 1`) rotates the 3D spoked handwheel `90°` clockwise, snaps a red **3D Lockout-Tagout (`LotoSafetyClasp`)** onto the valve stem, halts the animated pipe flow rings (`Flow: 0%`, `Pressure: 128 PSI`), and marks `[1:LOTO OK]`.
   - **Step 2/4 — Purge Bypass Regulator (`PR-204`):** Pinching the 3D `PR-204` regulator hotspot (or `EXECUTE STEP 2`) vents trapped vapor, sweeps the 3D pressure gauge needle from `142 PSI` to the green `38 PSI` zone, cools the manifold to `82°C`, and marks `[2:PURGE OK]`.
   - **Step 3/4 — Reseat Thermal Relay Core (`TR-309`):** Pinching the 3D `TR-309` relay hotspot (or `EXECUTE STEP 3`) retracts the popped thermal relay cylinder into its collar, rotates the top latch `45°`, cools the core from `118°C` to `46°C`, and marks `[3:RESEAT OK]`.
   - **Step 4/4 — Re-Pressurize & Verify (`CV-101`):** Pinching the 3D `CV-101` valve hotspot (or `EXECUTE STEP 4`) clears the 3D LOTO safety clasp, rotates the valve open, accelerates the 3 emerald-green cryo-coolant flow rings (`CoolantFlowPulseRing_0..2`) to `100%` flow across the manifold pipe, illuminates all 3 subsystem halos and the overhead status beacon emerald green, and logs `SYSTEM NOMINAL — REPAIR VERIFIED (42°C | 45 PSI | 100% FLOW | 4/4 DONE)`.

4. **Hands-Free Bidirectional Navigation & Replay:**
   - At any point, the wearer can pinch `< PREV STEP` or `NEXT STEP >` to review instructions or `RESET UNIT` to restore the initial fault state (`116°C`, `140 PSI`, `0/4`) for repeatable training.

---

### How We Built It
- **Snap Lens Studio 5.24.1 & Official CLAD (`ls-clad`) + Lens Studio MCP:**
  - Planned using the official `plan-lens` skill (`devpost/design-brief.md`) following all SPECS additive waveguide contrast rules and FOV budget constraints (`≤ 2` simultaneous spatial groups, `>65%` open pass-through).
  - Implemented and verified through **Google Antigravity** connected to the live **Lens Studio MCP** server (`VirtualScene`, `RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `PreviewInteractTool`, `QueryRuntimeSceneTool`, `CapturePanelScreenshotTool`, `run_leaf_scenario`).
- **Procedural Multi-Part 3D Equipment (`FieldFixEquipmentMesh.ts`):**
  - Authored in TypeScript using Lens Studio's `MeshBuilder` API and `SimpleVertexBaseColor.lspkg` vertex-colored materials—generating an articulated 3D industrial pump skid, manifold pipes, animated cryo-coolant flow pulse rings, spoked valve handwheel, 3D LOTO safety clasp, pressure gauge dial + needle, finned thermal relay core, overhead status beacon, 3D target chevron, and dual-beam laser scan ring with zero paid or external assets.
- **SPECS World-Space UI (`FieldFixDiagnosticUI.ts`):**
  - Built with `SpectaclesUIKit.lspkg` v2.0.0 (`Frame`, `Button`, `ProgressBar`), `SpectaclesInteractionKit.lspkg` v2.0.0 (`Interactable`), and a 4-step visual status checklist strip (`[1:LOTO OK] [2:PURGE OK] [3:RESEAT OK] [4:FLOW OK]`).
- **Procedural Spatial Audio (`FieldFixAudioController.ts`):**
  - Synthesized 5 custom 44.1 kHz `.wav` audio cues (`ButtonClick.wav`, `ScanSweep.wav`, `FaultAlert.wav`, `RepairStepConfirm.wav`, `DiagnosticComplete.wav`) locally via CLAD `/build-sfx`.
- **Real SIK Hand Preview Verification + Automated LEAF Test Suite (`Assets/Tests/`):**
  - Verified both with real SIK puppet hand pinches via `PreviewInteractTool` and `QueryRuntimeSceneTool` (which caught and allowed us to fix a subtle `Frame` root collider / billboard raycast occlusion on secondary buttons) and with 3 automated `Leaf.lspkg` v2.0.2 integration scenarios (`FieldFixFullDiagnosticRepairScenario`, `FieldFixMidRepairShowcaseScenario`, `FieldFixResetAndReplayScenario`).
