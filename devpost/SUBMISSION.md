# FieldFix AR — Devpost Project Submission (`Learn AR with SPECS`)

## 1. Ready-to-Paste YouTube Upload Metadata

### YouTube Title
`FieldFix AR — Hands-Free Spatial Maintenance Training Simulation for Snap SPECS (Learn AR with SPECS)`

### YouTube Description
```text
FieldFix AR is an interactive, hands-free industrial maintenance training simulation built for Snap SPECS (SPECS 27) in Lens Studio 5.24.1 using CLAD (Closed Loop Agentic Development) and the official Lens Studio MCP Server.

Created for the "Learn AR with SPECS" Devpost Hackathon.

CHAPTERS & SPATIAL AR CAPABILITIES DEMONSTRATED (2:00 — SHA-256: 5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b):
• 0:00 — 1. Machine Malfunction & Initial Telemetry Scan (0/3): Cryo-Pump #04 triggers a 116°C overheat alarm at TR-309 while upstream PR-204 and CV-101 remain [UNINSPECTED]. Pinching [SCAN EQUIPMENT TELEMETRY] sweeps a volumetric dual-beam 3D laser ring across Unit #04 without spoiling upstream answers.
• 0:07.5 — 2A. Trace 1/3 — Follow the Overheating Symptom Upstream: After localizing TR-309 (1/3), the 3D chevron guides the trainee upstream to [PR-204]. Skipping ahead to CV-101 is blocked with non-spoiling feedback ([INSPECT PR-204 FIRST]).
• 0:20.5 — 2B. Trace 2/3 — Inspecting 3D [PR-204] Reveals 142 PSI Bottleneck: Pinching 3D [PR-204] activates localized 3D Auto-X-Ray (1.0x lift), exposing the compressed relief spring and revealing the 142 PSI vapor-lock bottleneck while CV-101 remains [PINCH: INSPECT].
• 0:24.3 — 2C. Trace 3/3 — Inspecting 3D [CV-101] Reveals 18% Root Cause: Pinching 3D [CV-101] exposes the fouled internal cryo-ball seal in Auto-X-Ray, reveals the 18% intake cavitation root cause, and unlocks Step 1/4 LOTO isolation.
• 0:28 — 3. Sequential Industrial LOTO Safety Interlock (Logs Violation #1): Attempting to bleed the 142 PSI PR-204 Regulator (Step 2) before locking out the CV-101 Intake Valve (Step 1) triggers a 3D crimson hazard flash, audible warning, logs LOTO Violation #1 (-15% score penalty), and automatically redirects focus upstream to Step 1/4 [CV-101].
• 0:42 — 4. Steps 1 & 2: 3D Valve LOTO & Pressure Regulator Purge: Pinching the 3D CV-101 valve rotates the yellow-tipped lever handle 90° clockwise, snaps on a red 3D Lockout-Tagout (LOTO) safety clasp, and halts the manifold pipe flow rings (0%). Pinching the 3D PR-204 regulator vents trapped line pressure with a 3D vapor purge plume, sweeping the 3D gauge needle from red (142 PSI) into green (38 PSI).
• 0:57 — 5. Step 3/4: 3D Thermal Relay Core Reseat: Pinching the 3D TR-309 relay retracts the tripped plunger into its collar, rotates the latch 45°, extinguishes the overheat crown, and cools the simulated core from 118°C to 46°C.
• 1:10 — 6A. Run #1 Completion Scorecard (85% B+ Safety Redirected): Completing Step 4 on Run #1 restores 100% flow (42°C | 45 PSI) and awards 85% (B+ SAFETY REDIRECTED | LOTO Blocks: 1), accurately reflecting the earlier out-of-order LOTO violation at 0:28.
• 1:17 — 6B. Clean Attempt After Reset (Run #2 — 100% A+ Flawless LOTO): After resetting and executing all 4 steps in strict LOTO sequence with zero violations, completing Step 4 awards 100% (A+ FLAWLESS LOTO | LOTO Blocks: 0).
• 1:24 — 7. Before / After Spatial Comparison Mode: Toggling [COMPARE BEFORE/AFTER] dynamically animates the 3D machine, valve lever, gauge needle, and telemetry between Fault (118°C / 142 PSI / 18% Flow) and Nominal (42°C / 45 PSI / 100% Flow).
• 1:38 — 8A. Step Navigation & One-Pinch Reset: Demonstrates bidirectional review (< PREV STEP / NEXT STEP >) and one-pinch [RESET UNIT] back to 0/3 standby in Lens Studio 5.24.1.
• 1:44.5 — 8B. 5/5 Automated LEAF Verification: Runs the automated integration suite in Lens Studio 5.24.1 using CLAD, Lens Studio MCP, and LEAF (5/5 scenarios passed, 48/48 assertions, including FieldFixTraceTheFaultSignatureScenario).
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
**FieldFix AR — "Don't Fix Where the Alarm Rings. Trace the Fault to Its Source."**

### Elevator Pitch (Tagline)
Don't fix where the alarm rings—trace the fault to its source. A hands-free Snap SPECS trainer for reverse-causal 3D fault tracing, localized X-Ray cutaways, and active LOTO safety interlocks.

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

> **"Don't fix where the alarm rings. Trace the fault to its source."**

### Inspiration: Why Ordinary Repair Checklists Are Insufficient
Industrial maintenance studies show that over 80% of conventional AR and tablet repair guides act as passive "turn-by-turn GPS"—pointing an arrow at Part A, then Part B. While trainees follow the arrows, they suffer from the **guidance over-reliance trap**: they execute steps mechanically without building a causal mental model of *why* the machine failed, and they routinely fix the downstream component where the alarm rings (`TR-309 Thermal Relay`) while leaving the upstream root cause (`CV-101 Intake Valve`) untouched. Worse, holding a tablet or paper manual occupies the technician's hands, splits visual attention away from pressurized machinery, and cannot show what is happening *inside* sealed housings.

**Who FieldFix AR Is Designed to Train:**
FieldFix AR is built for **industrial maintenance trainees, cryo-pump/HVAC apprentices, and field service technicians** learning root-cause fluid/thermal troubleshooting and OSHA Lockout-Tagout (`LOTO`) safety compliance before working on live energized equipment.

We built **FieldFix AR** for **Snap SPECS (`SPECS 27`)** as an **interactive, hands-free spatial fault-tracing and LOTO safety trainer**. Instead of floating a flat 2D checklist in front of the user's face, FieldFix AR anchors a 29-object articulated 3D equipment digital twin on the left (`x = -12.5 cm`) and a companion world-space instruction panel on the right (`x = +11.5 cm`) at workbench depth (`z = -110 cm`). Trainees keep both hands free, follow physical fluid/pressure cues upstream in 3D space, **explode internal sub-assemblies in localized 3D Auto-X-Ray**, experience **consequence-driven LOTO safety interlocks**, and **pinch directly on 3D components** to restore nominal operation.

---

### What It Does
**FieldFix AR** guides a trainee through diagnosing and resolving a simulated multi-component fault on a **Cryo-Coolant Pump & Relay Unit (`Unit #04`)**:

1. **Simulated Spatial Diagnostic Scan & "TRACE THE FAULT" Progressive Discovery (`SCAN EQUIPMENT TELEMETRY`):**
   - Initially (`0/3`), only the visible overheat symptom at `TR-309` (`116°C [OVERHEAT SYMPTOM]`) is disclosed while upstream `PR-204` and `CV-101` read `[UNINSPECTED]`, preserving genuine diagnostic discovery.
   - Pinching the scan button sweeps a dual-beam 3D laser ring (`LaserScanSweepRing`) across the pump unit and initiates a **3-step reverse-causal upstream investigation (`TR-309 -> PR-204 -> CV-101`)**:
     - **Symptom (`[TR-309]` Thermal Relay Core — Trace 1/3):** `CRITICAL: CORE OVERHEAT (118°C)` — localizes the overheat symptom and directs the 3D target chevron upstream to `[PR-204]`. Attempting to skip ahead to `CV-101` before inspecting `PR-204` is blocked with non-spoiling guidance (`[INSPECT PR-204 FIRST]`).
     - **Bottleneck (`[PR-204]` High-Pressure Bypass Regulator — Trace 2/3):** `FAULT: OVER-PRESSURE (142 PSI)` — revealed only after pinching `[PR-204]`, which automatically lifts `RegulatorInternalDiaphragm` in localized 3D X-Ray Cutaway (`1.0x` height) and shifts the 3D chevron upstream to `[CV-101]`.
     - **Root Cause (`[CV-101]` Primary Coolant Isolation Valve — Trace 3/3):** `WARN: FLOW RESTRICTED (18%)` — revealed only after pinching `[CV-101]`, exposing the fouled internal cryo-ball seal (`ValveInternalCryoSeal`) and unlocking Step 1/4 (`LOTO Isolation`).

2. **Localized 3D Spatial Auto-X-Ray / Exploded Component Inspection (`X-RAY CUTAWAY`):**
   - Something impossible on a paper checklist or 2D screen: inspecting an upstream component during the fault trace (or pinching **`X-RAY CUTAWAY`**) explodes internal 3D procedural sub-assemblies (`1.0x` full lift on the focused component, `0.36x` tucked preview on non-selected components) out of the outer housings and rotates them in space so trainees can inspect internal fault mechanics:
     - **`ValveInternalCryoSeal` (`CV-101`):** Reveals the partially fouled internal cryo-seal gate (`18%` choked flow -> `0%` LOTO sealed -> `100%` full-bore laminar flow).
     - **`RegulatorInternalDiaphragm` (`PR-204`):** Reveals the compressed internal spring diaphragm & relief poppet (`142 PSI` surge -> `38 PSI` vented equilibrium with upward `RegulatorPurgePlume`).
     - **`RelayInternalStatorCoil` (`TR-309`):** Reveals the overheated copper stator windings & magnetic plunger latch (`118°C` tripped -> `46°C` reseated).

3. **Sequential Industrial LOTO Safety Interlock (`SAFETY INTERLOCK [LOTO VIOLATION]`):**
   - In real industrial maintenance, venting a high-pressure regulator or reseating a relay before locking out the primary intake valve is a critical hazard.
   - If a trainee attempts to execute Step 2 (`PR-204`), Step 3 (`TR-309`), or Step 4 out of order, FieldFix AR **blocks the unsafe action**, flashes a 3D red hazard halo across the assembly with an alert chime (`FaultAlert.wav`), displays a corrective `SAFETY INTERLOCK [LOTO VIOLATION]` banner, and automatically redirects focus to the required prerequisite step (`CV-101`).

4. **Direct 3D Component Manipulation & 4-Step Guided Repair Sequence:**
   - A 3D bobbing pointer chevron (`ActiveStepPointerChevron`) hovers directly above the current step's target 3D part (`CV-101`, `PR-204`, or `TR-309`).
   - **Step 1/4 — Isolate Intake Valve (`CV-101`):** Pinching the 3D `CV-101` valve rotates the **asymmetric yellow-tipped 3D lever handle** `90°` clockwise (`0°` up to `-90°` right), snaps a red **3D simulated Lockout-Tagout (`LotoSafetyClasp`)** onto the stem, halts the animated pipe flow rings (`Flow: 0%`), and marks `[1:LOTO OK]`.
   - **Step 2/4 — Purge Bypass Regulator (`PR-204`):** Pinching the 3D `PR-204` regulator vents simulated bypass pressure, sweeps the 3D pressure gauge needle from the red left zone (`142 PSI`) into the green right zone (`38 PSI`), lowers simulated temperature to `82°C`, and marks `[2:PURGE OK]`.
   - **Step 3/4 — Reseat Thermal Relay Core (`TR-309`):** Pinching the 3D `TR-309` relay retracts the raised thermal relay plunger into its collar, rotates the top latch `45°`, lowers simulated core temperature from `118°C` to `46°C`, and marks `[3:RESEAT OK]`.
   - **Step 4/4 — Re-Pressurize, Verify Flow & Trainee Competency Scorecard (`CV-101`):** Pinching the 3D `CV-101` valve removes the simulated LOTO clasp, rotates the asymmetric valve lever open (`+90°` left), accelerates the 6 emerald-green cryo-coolant flow rings (`CoolantFlowRing_0..5`) to `100%` simulated flow across the manifold pipe, turns all subsystem halos and the overhead beacon emerald green (`42°C | 45 PSI | 100% FLOW | 4/4 DONE`), and generates a **Trainee Competency Scorecard** (`100% / A+ FLAWLESS LOTO`, `85% / B+ SAFETY REDIRECTED`, `70% / C LOTO REVIEW REQUIRED`, or `<=60% / D UNSAFE PROCEDURE`).

5. **Before / After Spatial Comparison Mode (`COMPARE BEFORE/AFTER`) & Repeatable Reset:**
   - Once at least 1 repair step or all 4 steps are completed, trainees can pinch **`COMPARE BEFORE/AFTER`** to dynamically animate the 3D machine, valve lever, gauge needle, relay core, flow rings, and telemetry between `FAULT (BEFORE)` (`118°C / 142 PSI / 18% Flow`) and `NOMINAL (AFTER)` (`42°C / 45 PSI / 100% Flow`), step backward/forward (`< PREV STEP`, `NEXT STEP >`), or pinch **`RESET UNIT`** to replay the simulation.

> **Honest Limitations, Simulation Scope & Hardware Testing Disclosure ("Logic Proven" vs. "Feel Unproven"):**
> - **What Is Simulated:** FieldFix AR is an educational and procedural maintenance training simulation. The 3D Cryo-Coolant Pump (`Unit #04`), temperature (`116°C–118°C` $\rightarrow$ `42°C`), pressure (`140–142 PSI` $\rightarrow$ `45 PSI`), coolant flow (`18%` $\rightarrow$ `0%` $\rightarrow$ `100%`), and Lockout-Tagout (`LOTO`) safety interlocks are simulated in software by a deterministic state engine (`FieldFixStateMachine`) rather than connected to live industrial SCADA sensors or physical valves.
> - **What Was Tested ("Logic Proven"):** All state transitions, 3D SIK hand-pinch interactions, progressive-disclosure masks, Auto-X-Ray cutaways, LOTO safety redirects, and `85% B+` / `100% A+` competency scorecards are **logic proven** in the **Lens Studio 5.24.1 (`SPECS 27`) Interactive Preview** using `PreviewInteractTool`, `QueryRuntimeSceneTool`, and **`5/5` passing `Leaf.lspkg` v2.0.2 integration scenarios**.
> - **What Was Not Tested on Physical Hardware ("Feel Unproven"):** Because physical SPECS glasses were not used during development, optical waveguide brightness in outdoor/factory glare, long-session physical head comfort, real-world CAD Model Target registration onto physical pipes, and human cohort retention studies (`devpost/HUMAN_USABILITY_TEST_PROTOCOL.md`) remain **feel unproven** and represent the next stage of validation.

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

---

## 4. Explicit Alignment with Official Devpost Judging Criteria

| Judging Criterion | How FieldFix AR V5 Delivers | Concrete Evidence |
| :--- | :--- | :--- |
| **1. Design** *(Glasses-first spatial layout, readability, comfort, and interaction ergonomics)* | • **Side-by-Side World-Anchored Workspace (`z = -110 cm`):** Places the 3D Cryo-Pump (`x = -12 cm`) and stationary `SpectaclesUIKit` `Frame` (`x = +11.5 cm`) side-by-side in `DeviceTracking: World` mode so the central field of view stays unobstructed and zero elements are head-locked.<br>• **Additive Waveguide Contrast:** High-contrast bright text (`#FFFFFF`, `#7CE8FF`, `#FFD64D`, `#FF6666`, `#52FA94`) over dark semi-opaque backing pills (`alpha = 0.88–0.94`) with 3D callout leader struts.<br>• **Localized 3D Auto-X-Ray Clearance:** Focuses full exploded height (`1.0x`) only on the active subsystem (`0.36x` on unselected parts) to prevent 3D label occlusion. | [`devpost/design-brief.md`](./design-brief.md), [`FieldFixDiagnosticUI.ts`](../Assets/Scripts/FieldFixDiagnosticUI.ts), [`FieldFixEquipmentMesh.ts`](../Assets/Scripts/FieldFixEquipmentMesh.ts) |
| **2. Implementation** *(Technical execution in Lens Studio, SPECS SDKs, CLAD/MCP workflow, and testability)* | • **100% Self-Contained Procedural 3D & Audio:** Built in Lens Studio `5.24.1` (`SPECS 27`) with `SpectaclesInteractionKit` v2.0.0, `SpectaclesUIKit` v2.0.0, procedural `MeshBuilder` 3D geometry (`SimpleVertexBaseColor.lspkg`), and 5 synthesized 44.1 kHz WAV cues via CLAD `/build-sfx`.<br>• **Automated 5/5 LEAF Test Suite (`48` Assertions):** Every state transition, progressive trace skip-guard, localized Auto-X-Ray toggle, LOTO interlock redirect, and reset/replay path is verified by 5 `Leaf.lspkg` v2.0.2 scenarios. | [`FieldFixState.ts`](../Assets/Scripts/FieldFixState.ts), [`Assets/Tests/LeafIndex.ts`](../Assets/Tests/LeafIndex.ts), [`devpost/VERIFICATION_REPORT.md`](./VERIFICATION_REPORT.md) |
| **3. Innovation** *(Why spatial AR on SPECS is essential vs. a 2D screen or paper checklist)* | • **Reverse-Causal "TRACE THE FAULT" Investigation:** Trainees do not just click through a revealed checklist—they start from a visible symptom (`TR-309` `116°C` overheat) while upstream faults are `[UNINSPECTED]`, physically trace the 3D pipe path upstream (`TR-309 -> PR-204 -> CV-101`), and inspect internal valves/springs in 3D Auto-X-Ray.<br>• **Consequence-Driven LOTO Safety Interlock & Competency Grading:** Out-of-order pinches on pressurized 3D parts trigger a 3D hazard flash, redirect to `CV-101`, and differentiate Run #1 (`85% B+ Safety Redirected`) from a clean Run #2 (`100% A+ Flawless LOTO`). | [`FieldFixTraceTheFaultSignatureScenario.ts`](../Assets/Tests/FieldFixTraceTheFaultSignatureScenario.ts), [`devpost/SIGNATURE_EXPERIENCE_PROPOSAL.md`](./SIGNATURE_EXPERIENCE_PROPOSAL.md) |
| **4. Presentation** *(Clarity of demo video, chronological spoiler-free narrative, and honest disclosures)* | • **Spoiler-Free Chronological 2:00 1080p 30fps Demo:** Opens in real SPECS 27 AR preview footage, conceals upstream answers until each 3D component is inspected (`1/3 -> 2/3 -> 3/3`), includes a synchronized `2.3x` 3D zoom viewport for mechanical clarity, and demonstrates both `85%` (Run #1) and `100%` (Run #2) attempts plus live `5/5` LEAF verification.<br>• **Transparent Scope Disclosures:** Clearly labels simulated telemetry/LOTO scope and Lens Studio `5.24.1` `SPECS 27` preview testing. | [`FieldFix-AR-Demo-V5-TraceTheFault.mp4`](./FieldFix-AR-Demo-V5-TraceTheFault.mp4) (`SHA-256: 5811fe2d0f02550bdbce61136692b5ee992b37b964efeca541354909b1ed597b`) |
