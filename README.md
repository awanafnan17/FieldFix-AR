# FieldFix AR — Spatial Equipment Diagnostic & Guided Repair Assistant for Snap SPECS

> **Built for the [Learn AR with SPECS](https://learn-specs.devpost.com/) Hackathon** using Snap Lens Studio 5.24.1, CLAD (`ls-clad`), Lens Studio MCP, `SpectaclesInteractionKit.lspkg`, `SpectaclesUIKit.lspkg`, `SimpleVertexBaseColor.lspkg`, and `Leaf.lspkg`.

---

## Overview

**FieldFix AR** is a hands-free, spatially anchored industrial equipment diagnostic and repair assistant designed for **Snap SPECS (`SPECS 27`)**.

When a field technician approaches a malfunctioning **Cryo-Coolant Pump & Relay Unit (`Unit #04`)**, FieldFix AR anchors a multi-part, articulated 3D equipment assembly and a companion `SpectaclesUIKit` diagnostic control panel at workbench depth (`z = -110 cm`). Using pinch gestures (`SpectaclesInteractionKit`), the technician can:
1. **Scan Equipment Telemetry** (preview-testable stand-in for live IoT/optical equipment sensing), sweeping a volumetric dual-beam 3D laser ring (`LaserScanSweepRing`) across the machinery to localize 3 subsystem alerts:
   - **CV-101 Primary Coolant Isolation Valve** — `WARN: FLOW RESTRICTED (18%)`
   - **PR-204 High-Pressure Bypass Regulator** — `FAULT: OVER-PRESSURE (142 PSI)`
   - **TR-309 Thermal Relay Core Assembly** — `CRITICAL: CORE OVERHEAT (118°C)`
2. **Pinch 3D Component Hotspots Directly on the Equipment to Focus & Execute Repairs** (or use the companion UIKit HUD buttons):
   - A 3D bobbing pointer chevron (`ActiveStepTargetChevron`) hovers directly above the active repair step's target 3D component (`CV-101`, `PR-204`, or `TR-309`).
   - Pinching a focused 3D hotspot when it is the active repair target **directly executes and confirms that physical repair step on the 3D machine**.
3. **Execute a 4-Step Hands-Free Guided Repair Sequence** (`[1:LOTO] -> [2:PURGE] -> [3:RESEAT] -> [4:FLOW]`) with real-time 3D mechanical and flow articulation:
   - **Step 1 (`CV-101` Lockout):** The 3D **Coolant Isolation Valve Wheel** rotates `90°` clockwise, a red **3D Lockout-Tagout (`LotoSafetyClasp`)** snaps onto the valve stem, and the animated manifold **Coolant Flow Pulse Rings** halt (`Flow: 0%`, `[1:LOTO OK]`).
   - **Step 2 (`PR-204` Purge):** The 3D **Pressure Regulator Gauge Needle** sweeps from the crimson danger zone (`142 PSI`) into the regulated green zone (`38 PSI`, `82°C`, `[2:PURGE OK]`).
   - **Step 3 (`TR-309` Reseat):** The overheated 3D **Thermal Relay Core** retracts into its containment collar, rotates its latch `45°`, and cools from pulsing crimson (`118°C`) to cyan/emerald (`46°C`, `[3:RESEAT OK]`).
   - **Step 4 (`CV-101` Re-Pressurize & Verify):** The 3D LOTO safety clasp clears, the **Isolation Valve** re-opens, the 3 emerald-green **Coolant Flow Pulse Rings** accelerate to `100%` flow across the manifold pipe, and all halos + overhead **Status Beacon** illuminate emerald green (`SYSTEM NOMINAL — 42°C | 45 PSI | 100% FLOW | 4/4 DONE`).
4. **Navigate Bidirectionally & Replay:** Step forward (`NEXT STEP >`), step backward (`< PREV STEP`), confirm repair actions (`EXECUTE STEP`), or reset the scenario (`RESET UNIT`) hands-free at any time.

---

## Why It Belongs on SPECS (Not a Phone or Website)

Industrial field maintenance requires **both hands** for valves, gauges, and lockout tools. A phone or tablet forces the technician to put down their tools, look away from high-pressure or high-voltage hardware, and mentally map 2D schematic labels (`CV-101`, `PR-204`, `TR-309`) onto physical pipes.

On **Snap SPECS**:
- **Spatial Registration & Direct 3D Manipulation:** 3D diagnostic halos, the bobbing target chevron, and floating callout badges register directly onto the 3D subsystem being serviced, and pinching the 3D component executes the step in place.
- **Additive Waveguide Ergonomics:** High-contrast typography sits inside a dark-tinted `SpectaclesUIKit` `Frame` beside the equipment while leaving **>65% of the field of view open pass-through** for safety.
- **Hands-Free Pinch Workflow:** Every inspection, confirmation, and navigation action is triggered via natural far-field ray + pinch.

---

## Repository Structure

```
FieldFix-AR/
├── FieldFix-AR.esproj                    # Lens Studio 5.24.1 SPECS project
├── LICENSE                               # MIT License
├── README.md                             # Project documentation & setup instructions
├── devpost/
│   ├── FieldFix-AR-Demo.mp4              # 100.3s 1080p 30fps continuous motion demo video
│   ├── build_demo_video.py               # Reproducible ffmpeg continuous-video assembly script
│   ├── design-brief.md                   # Official plan-lens AR design brief (status: approved)
│   ├── SUBMISSION.md                     # Ready-to-paste Devpost & YouTube submission copy
│   ├── COMPLIANCE_CHECKLIST.md           # Full competition rule & security audit checklist
│   ├── VERIFICATION_REPORT.md            # Real SIK PreviewInteractTool & LEAF test evidence
│   └── screenshots/                      # High-res 1392x1910 & full-editor PNG captures
├── Assets/
│   ├── Scripts/
│   │   ├── FieldFixState.ts              # Pure state machine, telemetry model & 4-step repair data
│   │   ├── FieldFixEquipmentMesh.ts      # Procedural MeshBuilder 3D unit, LOTO clasp, flow rings & SIK hotspots
│   │   ├── FieldFixDiagnosticUI.ts       # SpectaclesUIKit Frame, 7 Buttons, ProgressBar, Checklist & Callouts
│   │   ├── FieldFixAudioController.ts    # Spatial audio playback controller
│   │   └── FieldFixMain.ts               # Experience coordinator (direct 3D hotspot + UIKit execution)
│   ├── Tests/
│   │   ├── FieldFixLeafInteractor.ts     # Custom LEAF interactor driving UIKit buttons & 3D hotspots
│   │   ├── FieldFixLeafScenario.ts       # Scenario 1: FieldFixFullDiagnosticRepairScenario
│   │   ├── FieldFixMidRepairShowcaseScenario.ts # Scenario 2: FieldFixMidRepairShowcaseScenario
│   │   ├── FieldFixResetAndReplayScenario.ts    # Scenario 3: FieldFixResetAndReplayScenario
│   │   └── LeafIndex.ts                  # @scenariosIndex registration for Lens Studio LEAF runner
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

## Reproducible Setup & Testing Instructions

### Prerequisites
- **Snap Lens Studio 5.24.1+** (SPECS / Spectacles build)
- **CLAD (`ls-clad`)** & **Antigravity** (optional, for AI-assisted MCP inspection/testing)

### Opening & Running the Project in Lens Studio
1. Launch **Lens Studio 5.24.1**.
2. Open [`FieldFix-AR.esproj`](./FieldFix-AR.esproj).
3. In the **Preview Panel (`Preview 1`)**, ensure:
   - Device is set to **`SPECS 27`**
   - Input mode is set to **Interactive**
4. Interact in the Preview Panel:
   - Pinch/click **`SCAN EQUIPMENT TELEMETRY`** (or any 3D hotspot) to run the dual-beam laser scan sweep and localize the 3 equipment faults.
   - Pinch/click directly on the **active 3D component hotspot** indicated by the bobbing 3D chevron (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`) **or** pinch **`EXECUTE STEP 1..4`** on the HUD panel to perform each repair step and watch the 3D valve wheel rotate, red LOTO clasp engage, pipe flow rings halt/restore, pressure gauge needle sweep, thermal relay core reseat, and status beacon turn emerald green.
   - Use **`< PREV STEP`**, **`NEXT STEP >`**, and **`RESET UNIT`** at the bottom of the panel to review steps or replay the full workflow.

### Running Automated LEAF Tests
1. In Lens Studio, open the **LEAF Panel** (or invoke `run_leaf_scenario` via Lens Studio MCP).
2. Run all 3 registered scenarios from `Assets/Tests/LeafIndex.ts`:
   - **`FieldFixFullDiagnosticRepairScenario`**
   - **`FieldFixMidRepairShowcaseScenario`**
   - **`FieldFixResetAndReplayScenario`**

---

## Licensing & Third-Party Notices

- **Original FieldFix AR Code, Procedural Assets & Documentation ([MIT License](./LICENSE)):**
  All original TypeScript scripts (`Assets/Scripts/*.ts`, `Assets/Tests/*.ts`), procedural `MeshBuilder` 3D geometry, algorithmically synthesized 44.1 kHz `.wav` sound effects (`Assets/GeneratedSFX/*.wav`), and documentation/video scripts (`README.md`, `devpost/`) are licensed under the **MIT License**.
- **Snap Inc. Lens Studio Packages & Template Assets (Third-Party Notice):**
  Our MIT License does **not** override third-party licenses. The bundled Lens Studio packages (`Packages/SpectaclesInteractionKit.lspkg`, `Packages/SpectaclesUIKit.lspkg`, `Packages/Leaf.lspkg`, `Packages/AiPreviewAgentInspect.lspkg`, `Packages/AiPreviewAgentInteract.lspkg`, `Packages/Bitmoji 3D.lsc`, `Assets/SimpleVertexBaseColor.lspkg/`), template render assets (`Assets/Render/Echopark.hdr`), and Editor API definitions (`Support/editor.d.ts`) are Copyright (c) Snap Inc. and are governed by the [Snap Inc. Lens Studio License Agreement](https://lensstudio.snapchat.com/terms/) and Spectacles Developer Terms. Zero unauthorized or paid third-party assets are included.
