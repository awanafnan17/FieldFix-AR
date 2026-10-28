# FieldFix AR — Hands-Free Spatial Maintenance Training Simulation for Snap SPECS

> **Built for the [Learn AR with SPECS](https://learn-specs.devpost.com/) Hackathon** using Snap Lens Studio 5.24.1, **CLAD (Closed Loop Agentic Development, `ls-clad`)**, Lens Studio MCP, `SpectaclesInteractionKit.lspkg`, `SpectaclesUIKit.lspkg`, `SimpleVertexBaseColor.lspkg`, and `Leaf.lspkg`.

---

## Overview

> **"Don't fix where the alarm rings. Trace the fault to its source."**

**FieldFix AR** is an interactive, hands-free industrial maintenance and reverse-causal fault-tracing **training simulation** designed for **Snap SPECS (`SPECS 27`)**. It trains industrial maintenance apprentices, HVAC/cryo-pump technicians, and field service engineers to diagnose upstream root causes and follow strict Lockout-Tagout (`LOTO`) safety ordering instead of blindly replacing the downstream part where an alarm rings.

When a trainee or technician steps up to the simulated **Cryo-Coolant Pump & Relay Unit (`Unit #04`)**, FieldFix AR anchors a multi-part, articulated 3D equipment assembly on the left and a companion `SpectaclesUIKit` diagnostic and repair checklist on the right at workbench depth (`z = -110 cm`). Using far-field hand-pinch gestures (`SpectaclesInteractionKit`), the user can:

1. **Run a Simulated Equipment Telemetry Scan & "TRACE THE FAULT" Progressive Discovery (`SCAN EQUIPMENT TELEMETRY`):**
   Initially, only the visible overheat symptom at `TR-309` (`116°C`) is shown while upstream components read `[UNINSPECTED]`. Pinching `SCAN EQUIPMENT TELEMETRY` sweeps a volumetric dual-beam 3D laser ring (`LaserScanSweepRing`) across the 3D machine and guides the trainee through a **progressive reverse-causal 3D fault trace** without spoiling the upstream answers beforehand:
   - **Symptom (`TR-309` Thermal Relay Core Assembly — Trace 1/3):** `CRITICAL: CORE OVERHEAT (118°C)` — localizes the overheat symptom and prompts the trainee to inspect the next upstream component (`PR-204`) without revealing the bottleneck yet.
   - **Bottleneck (`PR-204` High-Pressure Bypass Regulator — Trace 2/3):** `FAULT: OVER-PRESSURE (142 PSI)` — revealed only after pinching `PR-204` upstream, which activates localized 3D X-Ray Cutaway (`RegulatorInternalDiaphragm`), illuminates the red vapor-lock collar (`FaultBottleneckRing`), and guides the trainee upstream to `CV-101`.
   - **Root Cause (`CV-101` Primary Coolant Isolation Valve — Trace 3/3):** `WARN: FLOW RESTRICTED (18%)` — revealed only after completing the upstream trace to `CV-101`, exposing the fouled internal cryo-ball seal (`ValveInternalCryoSeal`) and unlocking Step 1/4 (`LOTO Isolation`).

2. **Toggle 3D Spatial X-Ray / Localized Exploded Cutaway Mode (`X-RAY CUTAWAY`):**
   Pinching an upstream component during the fault trace (or pinching `X-RAY CUTAWAY`) explodes internal 3D procedural sub-assemblies (`1.0x` full lift on the focused component, `0.36x` tucked preview on non-selected components) and rotates them in real time so trainees can see *inside* the machine before touching a wrench:
   - **`ValveInternalCryoSeal` (`CV-101`):** Internal cryo-seal gate & bypass port (`18%` choked flow -> `0%` LOTO sealed -> `100%` full-bore laminar flow).
   - **`RegulatorInternalDiaphragm` (`PR-204`):** Internal spring diaphragm & relief poppet (`142 PSI` compressed -> `38 PSI` vented equilibrium with upward `RegulatorPurgePlume`).
   - **`RelayInternalStatorCoil` (`TR-309`):** Internal copper stator windings & magnetic plunger latch (`118°C` tripped -> `46°C` reseated).

3. **Experience Sequential Industrial LOTO Safety Interlock Enforcement:**
   FieldFix AR enforces real industrial Lockout-Tagout (`LOTO`) safety ordering (`Step 1 -> Step 2 -> Step 3 -> Step 4`). If a trainee attempts an out-of-order repair (such as purging the `142 PSI` regulator `PR-204` or reseating the `118°C` relay `TR-309` before isolating `CV-101`), the **Sequential Safety Interlock** blocks execution, flashes a 3D red hazard halo with an audible alert (`FaultAlert.wav`), displays a corrective `SAFETY INTERLOCK [LOTO VIOLATION]` banner, and automatically redirects focus to the required prerequisite step (`CV-101`).

4. **Pinch 3D Component Hotspots Directly on the Equipment to Focus & Execute Repairs** (or use the companion UIKit HUD buttons):
   - A 3D bobbing pointer chevron (`ActiveStepTargetChevron`) hovers directly above the active repair step's target 3D component (`CV-101`, `PR-204`, or `TR-309`).
   - Pinching a focused 3D hotspot when it is the active repair target **directly executes and confirms that repair step on the 3D machine**:
     - **Step 1 (`CV-101` Isolate & Simulated LOTO):** The asymmetric yellow-tipped **3D Valve Lever Handle** rotates `90°` clockwise (`0°` up to `-90°` right), a red **3D simulated Lockout-Tagout clasp (`LotoSafetyClasp`)** snaps onto the valve stem, and the animated manifold **Coolant Flow Pulse Rings** halt (`Simulated Flow: 0%`, `[1:LOTO OK]`).
     - **Step 2 (`PR-204` Purge Pressure):** The 3D **Pressure Regulator Gauge Needle** sweeps from the red left danger zone (`142 PSI`) into the regulated green right zone (`38 PSI`, `82°C`, `[2:PURGE OK]`).
     - **Step 3 (`TR-309` Reseat Relay Core):** The overheated 3D **Thermal Relay Core** retracts its raised plunger into its containment collar, rotates its latch `45°`, and cools from pulsing crimson (`118°C`) to cyan/emerald (`46°C`, `[3:RESEAT OK]`).
     - **Step 4 (`CV-101` Re-Pressurize & Verify Flow):** The simulated 3D LOTO clasp clears, the **Asymmetric Valve Lever** rotates open (`+90°` left), the 3 emerald-green **Coolant Flow Pulse Rings** accelerate to `100%` simulated flow across the manifold pipe, all halos + overhead **Status Beacon** illuminate emerald green (`SYSTEM NOMINAL — 42°C | 45 PSI | 100% FLOW | 4/4 DONE`), and the **Trainee Competency Scorecard** awards a grade (`100% / A+ FLAWLESS LOTO` or `85% / B+ SAFETY REDIRECTED`).

5. **Toggle Before / After Spatial Comparison Mode (`COMPARE BEFORE/AFTER`), Navigate & Replay:**
   After completing all 4 steps, trainees can pinch `COMPARE BEFORE/AFTER` to dynamically animate the 3D machine, valve lever, gauge needle, relay core, flow rings, and telemetry between `FAULT (BEFORE)` (`118°C / 142 PSI / 18% Flow`) and `NOMINAL (AFTER)` (`42°C / 45 PSI / 100% Flow`) without losing completion state, step backward/forward (`< PREV STEP`, `NEXT STEP >`), or reset the simulation (`RESET UNIT`).

> **Simulation Notice:** FieldFix AR is an educational maintenance training simulation. All temperature, pressure, and coolant-flow readings are simulated in software, and the Lockout-Tagout (`LOTO`) step demonstrates procedural sequence guidance and interlock enforcement rather than establishing physical isolation on live industrial equipment.

---

## Why It Belongs on SPECS (Not a Phone or Website)

Learning industrial maintenance procedures requires coordinating both hands with spatial part locations (`CV-101`, `PR-204`, `TR-309`). Holding a phone or tablet occupies the trainee's hands and forces them to mentally translate 2D diagrams onto 3D valves, gauges, and relays.

On **Snap SPECS**:
- **Spatial Registration, 3D X-Ray Cutaways & Direct 3D Manipulation:** Diagnostic halos, 3D callout leader struts, exploded internal X-Ray sub-assemblies, and the bobbing 3D target chevron register directly onto the 3D subsystem being serviced, and pinching the 3D part executes the step in place.
- **Additive Waveguide Readability & Unobstructed Layout:** High-contrast typography with dark backing pills sits inside a stationary `SpectaclesUIKit` `Frame` (`28 × 43.2 cm`) beside the 3D equipment, keeping the central workspace clear and avoiding head-locked screen clutter.
- **Hands-Free Pinch Workflow:** Every inspection, X-Ray cutaway toggle, safety-interlocked repair execution, Before/After comparison, and navigation action is triggered via natural far-field ray + pinch.

---

## Repository Structure

```
FieldFix-AR/
├── FieldFix-AR.esproj                    # Lens Studio 5.24.1 SPECS project
├── LICENSE                               # MIT License (with Third-Party Snap Package notices)
├── README.md                             # Project documentation & setup instructions
├── devpost/
│   ├── FieldFix-AR-Demo-V5-TraceTheFault.mp4 # 111.53s (1:51.5) V5 "TRACE THE FAULT" verified demo video
│   ├── FieldFix-AR-Demo.mp4              # Preserved V4 approved demo video
│   ├── JUDGE_RESEARCH.md                 # Epistemically labeled [1]-[4] judge & competition analysis
│   ├── COMPETITIVE_LANDSCAPE.md          # SPECS ecosystem, academic HCI & enterprise AR benchmark
│   ├── RED_TEAM_AND_OPTIMIZATION_REPORT.md # 4-criterion red-team audit & pre/post optimization profile
│   ├── HUMAN_USABILITY_TEST_PROTOCOL.md  # 5-minute first-time human reviewer usability protocol
│   ├── SIGNATURE_EXPERIENCE_PROPOSAL.md  # "TRACE THE FAULT" spatial architecture & design spec
│   ├── build_demo_video.py               # Reproducible ffmpeg + voiceover video assembly script
│   ├── design-brief.md                   # Official plan-lens AR design brief (status: approved)
│   ├── SUBMISSION.md                     # Ready-to-paste Devpost & video submission copy
│   ├── COMPLIANCE_CHECKLIST.md           # Competition rule, accuracy & security audit checklist
│   ├── VERIFICATION_REPORT.md            # Real SIK PreviewInteractTool, 5/5 LEAF & V4 vs V5 critique report
│   └── screenshots/                      # Synchronized V5 runtime preview & editor PNG captures
├── Assets/
│   ├── Scripts/
│   │   ├── FieldFixState.ts              # State machine, Trace-The-Fault, LOTO interlock, X-Ray, Comparison & Scorecard
│   │   ├── FieldFixEquipmentMesh.ts      # Procedural MeshBuilder 3D unit, 2-zone flow, X-Ray internals, lever & hotspots
│   │   ├── FieldFixDiagnosticUI.ts       # Progressive-disclosure SpectaclesUIKit Frame, 9 Buttons, ProgressBar & Callouts
│   │   ├── FieldFixAudioController.ts    # Spatial audio playback controller
│   │   └── FieldFixMain.ts               # Experience coordinator (direct 3D hotspot + UIKit execution)
│   ├── Tests/
│   │   ├── FieldFixLeafInteractor.ts     # Custom LEAF interactor driving UIKit buttons & 3D hotspots
│   │   ├── FieldFixLeafScenario.ts       # Scenario 1: FieldFixFullDiagnosticRepairScenario
│   │   ├── FieldFixMidRepairShowcaseScenario.ts # Scenario 2: FieldFixMidRepairShowcaseScenario
│   │   ├── FieldFixResetAndReplayScenario.ts    # Scenario 3: FieldFixResetAndReplayScenario
│   │   ├── FieldFixAdversarialSafetyAndXRayScenario.ts # Scenario 4: Adversarial LOTO Interlock, X-Ray & Comparison
│   │   ├── FieldFixTraceTheFaultSignatureScenario.ts   # Scenario 5: Signature "TRACE THE FAULT" causal discovery & Auto-X-Ray
│   │   └── LeafIndex.ts                  # @scenariosIndex registration for all 5 LEAF scenarios
│   ├── GeneratedSFX/                     # 44.1 kHz WAV cues synthesized via CLAD /build-sfx
│   │   ├── ButtonClick.wav
│   │   ├── ScanSweep.wav
│   │   ├── FaultAlert.wav
│   │   ├── RepairStepConfirm.wav
│   │   └── DiagnosticComplete.wav
│   └── SimpleVertexBaseColor.lspkg/      # Vertex-color material for procedural MeshBuilder parts
└── Packages/
    ├── SpectaclesInteractionKit.lspkg    # SIK v2.0.0 (Hand/Mouse/Mobile ray + pinch interaction)
    ├── SpectaclesUIKit.lspkg             # UIKit v2.0.0 (Frame, Button, ProgressBar)
    ├── Leaf.lspkg                        # LEAF v2.0.2 (Automated preview interaction testing)
    ├── AiPreviewAgentInspect.lspkg       # Live runtime scene GraphQL inspection bridge
    └── AiPreviewAgentInteract.lspkg      # Live SIK puppet hand interaction bridge
```

---

## Visual Progression & Key Screenshots (`devpost/screenshots/`)

| Stage | Screenshot File | What It Shows in the Live SPECS 27 Runtime |
| :--- | :--- | :--- |
| **1. Standby (`0/3`)** | [`devpost/screenshots/01_standby_ready_to_scan.png`](./devpost/screenshots/01_standby_ready_to_scan.png) | Only the visible overheat symptom at `TR-309` (`116°C [OVERHEAT SYMPTOM]`) is disclosed; upstream `PR-204` and `CV-101` read `[UNINSPECTED]` so nothing is spoiled prior to investigation. |
| **2. Trace `1/3` (`TR-309`)** | [`devpost/screenshots/02_diagnosing_fault_localized.png`](./devpost/screenshots/02_diagnosing_fault_localized.png) | After the dual-beam laser scan, `TR-309` (`118°C`) is localized (`1/3 INSPECTED`) and the 3D chevron + primary CTA (`TRACE UPSTREAM: INSPECT [PR-204]`) guide the trainee upstream. |
| **3. Trace `2/3` (`PR-204` Auto-X-Ray)** | [`devpost/screenshots/03_trace_fault_upstream_pr204.png`](./devpost/screenshots/03_trace_fault_upstream_pr204.png) | Inspecting `PR-204` lifts its outer housing into **localized 3D Auto-X-Ray** (`RegulatorInternalDiaphragm`), reveals the `142 PSI` vapor-lock bottleneck, and updates the primary CTA to `TRACE UPSTREAM: INSPECT [CV-101]`. |
| **4. LOTO Safety Interlock** | [`devpost/screenshots/04_loto_safety_interlock_blocked.png`](./devpost/screenshots/04_loto_safety_interlock_blocked.png) | Attempting an out-of-order repair before isolating `CV-101` flashes the 3D crimson hazard halo, explains the physical blowdown/arc hazard, logs LOTO Violation #1 (`-15%`), and redirects focus to `Step 1/4: CV-101`. |
| **5. Nominal Completion (`4/4`)** | [`devpost/screenshots/06_completed_nominal_scorecard.png`](./devpost/screenshots/06_completed_nominal_scorecard.png) | All 4 steps completed (`42°C | 45 PSI | 100% FLOW`), emerald flow rings active across the manifold, and the **Trainee Competency Scorecard** displayed (`85% B+` vs. `100% A+`). |
| **6. Full Lens Studio 5.24.1 Editor** | [`devpost/screenshots/05_full_editor_with_preview.png`](./devpost/screenshots/05_full_editor_with_preview.png) | Complete Lens Studio `5.24.1` workspace showing the 3D Scene Editor, Hierarchy, TypeScript scripts, LEAF Runner, and live `SPECS 27` Preview. |

---

## Reproducible Setup & Testing Instructions

### Prerequisites
- **Snap Lens Studio 5.24.1+** (SPECS / Spectacles build)
- **CLAD (`ls-clad`, Closed Loop Agentic Development)** & **Antigravity** (optional, for AI-assisted MCP inspection/testing)

### Opening & Running the Project in Lens Studio
1. Launch **Lens Studio 5.24.1**.
2. Open [`FieldFix-AR.esproj`](./FieldFix-AR.esproj).
3. In the **Preview Panel (`Preview 1`)**, ensure:
   - Device is set to **`SPECS 27`**
   - Input mode is set to **Interactive**
4. Interact in the Preview Panel:
   - Pinch/click **`SCAN EQUIPMENT TELEMETRY`** to run the dual-beam laser scan sweep and localize the visible overheat symptom at **`TR-309`** (`Trace 1/3: 118°C`), while upstream `PR-204` and `CV-101` remain concealed (`[PINCH: INSPECT]` / `[UNINSPECTED]`).
   - Follow the 3D chevron upstream: pinch **`Hotspot_PressureRegulator`** (`PR-204`) or **`TRACE UPSTREAM: INSPECT [PR-204]`** (`Trace 2/3`) to automatically lift `RegulatorInternalDiaphragm` in localized **3D Auto-X-Ray** (`1.0x` height) and reveal the `142 PSI` vapor-lock bottleneck; then pinch **`Hotspot_CoolantValve`** (`CV-101`) or **`TRACE UPSTREAM: INSPECT [CV-101]`** (`Trace 3/3`) to expose `ValveInternalCryoSeal`, reveal the `18%` intake cavitation root cause, and unlock Step 1/4 (`LOTO Isolation`). (Trying to skip `PR-204` and pinch `CV-101` at Trace 1/3 is blocked with `[INSPECT PR-204 FIRST]`.)
   - Before completing Step 1 (`CV-101`), test the **Sequential LOTO Safety Interlock** by pinching `Hotspot_PressureRegulator` (`PR-204`) twice (or selecting `PR-204` / `TR-309` and pinching `EXECUTE STEP`) to observe the 3D red hazard flash, audible alert (`FaultAlert.wav`), LOTO Violation #1 (`-15%`), and automatic redirect to `CV-101`.
   - Pinch/click directly on the **active 3D component hotspot** indicated by the bobbing 3D chevron (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`) **or** pinch **`EXECUTE STEP 1..4`** on the HUD panel to perform each repair step in order (`1 -> 2 -> 3 -> 4`).
   - Once all 4 steps are completed, pinch **`COMPARE BEFORE/AFTER`** (bottom-right utility button) to toggle the 3D machine and telemetry between `FAULT (BEFORE)` and `NOMINAL (AFTER)`, toggle **`X-RAY CUTAWAY`** (bottom-left utility button), or use **`< PREV STEP`**, **`NEXT STEP >`**, and **`RESET UNIT`**.

### Running Automated LEAF Tests
1. In Lens Studio, open the **LEAF Panel** (or invoke `run_leaf_scenario` via Lens Studio MCP).
2. Run all 5 registered scenarios from `Assets/Tests/LeafIndex.ts`:
   - **`FieldFixFullDiagnosticRepairScenario`**
   - **`FieldFixMidRepairShowcaseScenario`**
   - **`FieldFixResetAndReplayScenario`**
   - **`FieldFixAdversarialSafetyAndXRayScenario`**
   - **`FieldFixTraceTheFaultSignatureScenario`**

---

## Licensing & Third-Party Notices

- **Original FieldFix AR Code, Procedural Assets & Documentation ([MIT License](./LICENSE)):**
  All original TypeScript scripts (`Assets/Scripts/*.ts`, `Assets/Tests/*.ts`), procedural `MeshBuilder` 3D geometry, algorithmically synthesized 44.1 kHz `.wav` sound effects (`Assets/GeneratedSFX/*.wav`), and documentation/video scripts (`README.md`, `devpost/`) are licensed under the **MIT License**.
- **Snap Inc. Lens Studio Packages & Template Assets (Third-Party Notice):**
  Our MIT License does **not** override third-party licenses. The bundled Lens Studio packages (`Packages/SpectaclesInteractionKit.lspkg`, `Packages/SpectaclesUIKit.lspkg`, `Packages/Leaf.lspkg`, `Packages/AiPreviewAgentInspect.lspkg`, `Packages/AiPreviewAgentInteract.lspkg`, `Packages/Bitmoji 3D.lsc`, `Assets/SimpleVertexBaseColor.lspkg/`), template render assets (`Assets/Render/Echopark.hdr`), and Editor API definitions (`Support/editor.d.ts`) are Copyright (c) Snap Inc. and are governed by the [Snap Inc. Lens Studio License Agreement](https://lensstudio.snapchat.com/terms/) and Spectacles Developer Terms. Zero unauthorized or paid third-party assets are included.
