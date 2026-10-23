---
title: "FieldFix AR"
category: learn
status: approved
---

# FieldFix AR

> Step up to an overheating industrial Cryo-Coolant Pump & Relay Unit, pinch to run a spatial diagnostic scan that highlights faulty components in 3D right on the equipment, and execute a guided 4-step hands-free repair with live mechanical articulation and safety lockout verification.

## What It Is

**FieldFix AR** is a spatial, hands-free equipment diagnostic and guided repair assistant built for Snap SPECS. It is designed for field service technicians, plant engineers, and trainees who need to diagnose equipment faults, verify lockout/tagout safety prerequisites, and perform multi-step mechanical repairs while keeping both hands free for tools and physical hardware.

**The Core Loop:**
1. **Approach & Scan:** The technician looks at the spatially anchored **Cryo-Coolant Pump & Relay Unit** on the workbench in front of them (`z = -110 cm`) and pinches **Scan Equipment** (the preview-testable stand-in for live equipment telemetry / optical marker detection).
2. **Spatial Fault Localization:** Three interactive 3D component hotspots light up directly on the physical assembly:
   - **Hotspot 1 — Primary Coolant Isolation Valve** (`[WARN: Flow Restricted — 18% Open]`)
   - **Hotspot 2 — High-Pressure Bypass Regulator** (`[FAULT: Over-Pressure Spike — 142 PSI]`)
   - **Hotspot 3 — Thermal Relay Core** (`[CRITICAL FAULT: Core Overheating — 118°C]`)
3. **Interactive Component Inspection:** The technician pinches any 3D hotspot directly on the model (or via the spatial selector buttons) to inspect component-specific telemetry, fault root-cause analysis, and required safety PPE/lockout rules.
4. **Hands-Free Guided Repair Sequence:** Selecting the fault initiates a **4-step spatial repair workflow**:
   - **Step 1 — Safety Lockout & Depressurization:** Verify High-Voltage Thermal Relay isolation and close the Primary Coolant Isolation Valve (3D valve wheel rotates and locks in place).
   - **Step 2 — Pressure Bleed & Regulator Purge:** Open the High-Pressure Bypass Regulator to vent trapped line pressure from `142 PSI` down to safe `38 PSI` (3D gauge needle sweeps into the green zone and manifold vents).
   - **Step 3 — Thermal Relay Core Reset & Reseat:** Disengage the overheated relay latch, reseat the Thermal Relay Core, and engage auxiliary cooling flow (3D relay core retracts, cools from pulsing red `118°C` to cyan/emerald `42°C`).
   - **Step 4 — System Re-Pressurization & Verification Test:** Re-open the Primary Coolant Valve and confirm balanced flow (`100% Nominal`, `45 PSI`, `42°C`) to complete the repair and log the service verification.
5. **Advance, Reverse, Confirm & Reset:** At every step, the technician can pinch **Confirm Action** to execute/animate the mechanical step, **Next Step** / **Prev Step** to review or backtrack across the sequence, or **Reset Unit** to replay the diagnostic scenario from the initial fault state.

**Why SPECS (and Not a Phone or Tablet):**
A technician repairing pressurized or high-voltage machinery cannot hold a phone in one hand while turning an isolation valve or probing a relay with the other, nor can they constantly look down at a flat 2D PDF checklist and mentally translate schematic labels onto 3D pipes and relays. On SPECS, the diagnostic highlights, animated mechanical motion cues, and safety callouts sit directly in 3D space registered to the equipment within the wearer's natural field of view—turning complex spatial maintenance into an intuitive, heads-up, hands-free workflow.

## Target Category

- **Primary Category:** **Learn & Assist** (`learn`) — Teaches and guides a physical mechanical diagnostic and repair procedure in real time with spatial registration, step-by-step verification, and animated 3D demonstrations.
- **Secondary Category:** **Everyday Superpowers** (`everyday`) — Gives field technicians instant x-ray-like telemetry overlays, fault localization, and safety lockout verification at a glance.

## Spatial Design

### Placement

- **Placement Mode:** **World-anchored** (`DeviceTracking` set to `World` on the Perspective `Camera Object`) at the comfortable SPECS focal plane (`z = -110 cm`, inside the `53 cm × 77 cm` usable viewport at default distance).
- **Spatial Layout (Two Cohesive Zones within FOV Budget):**
  1. **3D Equipment Assembly (`EquipmentUnitRoot` at `x = -12 cm, y = -6 cm, z = -110 cm`):** A multi-part, articulated 3D **Cryo-Coolant Pump & Relay Unit** with interactive component hotspots (`ValveHotspot`, `RegulatorHotspot`, `RelayHotspot`), an animated valve handwheel, a pressure gauge needle, a pulsing thermal relay core, and a spatial diagnostic ring indicator.
  2. **Contextual Diagnostic & Repair Panel (`DiagnosticUIRoot` at `x = 13 cm, y = 0 cm, z = -108 cm`, angled `-6°` on Y toward the user):** A single, unified `SpectaclesUIKit` `Frame` (`24 cm × 32 cm`) housing:
     - Top Safety & Telemetry Header (Equipment Status badge + live Temperature / Pressure / Flow readout)
     - Selected Component & Diagnostic Root-Cause Section
     - Guided Repair Step Card (Step `N / 4` title, concise action instruction, safety callout, and visual progress bar)
     - Hands-Free Pinch Action Row (`Scan / Confirm`, `Prev`, `Next`, `Reset`) and Component Quick-Select pills (`Valve`, `Regulator`, `Relay`)

### Field-of-View Budget

- **Maximum Simultaneous Elements:** **2 spatial groups** (the 3D Equipment Assembly on the left-center and the single unified Diagnostic UI `Frame` on the right-center).
- **Pass-Through Budget:** Over **65% of the field of view remains completely open pass-through** around and above the workbench unit so the wearer maintains full situational awareness.
- **Additive Display Contrast:** Because SPECS uses an additive waveguide display where pure black (`#000000`) renders transparent, all text sits inside the dark-tinted `SpectaclesUIKit` `Frame` with high-contrast bright typography (`#FFFFFF` primary headers, `#7CE8FF` cyan telemetry, `#FFB84D` amber warnings, `#FF5C5C` critical fault alerts, and `#4DFF91` nominal/verified states). No UI elements are pinned to screen corners.

### Hands & Input

- **Primary Gestures:**
  - **Ray Aim + Index-Thumb Pinch (`onTriggerUp`):** Powered by `SpectaclesInteractionKit` (SIK) and `SpectaclesUIKit`. Works identically with tracked hands in SPECS and with mouse click / interactive preview hand simulation in Lens Studio Preview.
  - **Direct 3D Hotspot Selection:** Each of the three equipment sub-assemblies (`Primary Coolant Valve`, `Pressure Regulator`, `Thermal Relay Core`) has a dedicated collider + SIK `Interactable` with a ≥ `5 cm` hit volume and hover/active visual highlight so the user can pinch directly on the 3D part in space.
  - **Spatial UI Button Controls:** All buttons use `SpectaclesUIKit` `Button` components (`≥ 4.4 cm` height, `≥ 1.2 cm` spacing) for reliable pinch targeting (`Scan Equipment`, `Valve`, `Regulator`, `Relay`, `Prev Step`, `Confirm Step`, `Next Step`, `Reset`).
- **Voice Input:** None required—100% operable in noisy industrial environments via pinch and gaze-ray targeting.

### Audio & Motion

- **Spatial Audio Cues (`Assets/GeneratedSFX/` via CLAD `/build-sfx`):**
  - `ScanSweep.wav` — Futuristic radar sweep when **Scan Equipment** is triggered.
  - `FaultAlert.wav` — Dual-tone alert chime when the critical thermal/pressure fault is isolated.
  - `ButtonClick.wav` — Crisp tactile click on every hotspot selection and step navigation pinch.
  - `RepairStepConfirm.wav` — Rising mechanical confirmation tone when a repair action is executed.
  - `DiagnosticComplete.wav` — Rewarding harmonic chord when all 4 repair steps are verified and system telemetry returns to nominal.
- **Procedural 3D Motion & Articulation (`FieldFixEquipmentMesh.ts` + `FieldFixMain.ts`):**
  - **Fault Pulse:** Faulty component rings and the overheated Thermal Relay Core pulse smoothly in crimson/amber (`sin(t * 5)`).
  - **Scan Ring Sweep:** A horizontal laser diagnostic ring sweeps vertically across the 3D pump assembly during scanning.
  - **Step 1 Animation:** The 3D **Coolant Isolation Valve Wheel** rotates `90°` to the closed lockout position.
  - **Step 2 Animation:** The **Pressure Gauge Indicator** sweeps down from the red danger zone (`142 PSI`) to the safe bleed zone (`38 PSI`) while the regulator cap shifts.
  - **Step 3 Animation:** The **Thermal Relay Core** retracts, reseats into the housing, and transitions from overheating crimson (`118°C`) to cooled cyan/emerald (`42°C`).
  - **Step 4 Animation:** The **Coolant Flow Conduit** and **Status Beacon** illuminate emerald green (`NOMINAL — 100% FLOW`) with a gentle celebratory pulse.

## Key Features

1. **One-Pinch Equipment Fault Scanner (Preview Stand-In for Hardware Telemetry):** Scans the 3D Cryo-Coolant Pump & Relay Unit with an animated laser sweep ring and reveals live spatial fault states across three subsystems (`Coolant Valve`, `Pressure Regulator`, `Thermal Relay Core`).
2. **Interactive 3D Component Hotspots + Spatial Telemetry Inspector:** Pinch any 3D component hotspot directly on the machinery (or via the quick-select bar) to highlight the part in 3D, view live telemetry (`°C`, `PSI`, `Flow %`), and read the specific root-cause diagnosis and lockout safety warning.
3. **4-Step Hands-Free Guided Repair Workflow with 3D Mechanical Articulation:** Step-by-step interactive repair cards (`Lockout Valve` → `Purge Pressure Regulator` → `Reseat Thermal Relay Core` → `Re-Pressurize & Verify`) where confirming each step drives real-time 3D mechanical animations on the equipment model and updates system telemetry.
4. **Full Bidirectional Navigation (`Next`, `Prev`, `Confirm Action`, `Reset`):** Technicians can freely step forward and backward to review instructions, confirm individual repair actions, watch the animated progress indicator (`0/4` to `4/4`), and reset the entire unit for repeated training or demonstration.
5. **Completion Verification & Service Summary:** Completing all 4 steps transitions the equipment beacon and UI header from `CRITICAL FAULT (118°C / 142 PSI)` to `SYSTEM VERIFIED NOMINAL (42°C / 45 PSI / 100% FLOW)` with audio-visual confirmation.

## Required Assets

- **2D / UI (`SpectaclesUIKit.lspkg` + `Assets/Icons/`):**
  - `Frame` container (`FieldFixDiagnosticUI.ts`) with `FlexLayout` rows/columns, `Button` controls, and high-contrast `Text` readouts.
  - Procedural / Asset Library icons in `Assets/Icons/` for scan, warning, check, and reset indicators.
- **3D (`Assets/Scripts/FieldFixEquipmentMesh.ts` + `SimpleVertexBaseColor.lspkg`):**
  - Multi-part procedural 3D **Cryo-Coolant Pump & Relay Unit** built with Lens Studio `MeshBuilder` and `SimpleVertexBaseColor.lspkg` vertex-colored metallic/emissive-style materials:
    1. `BaseChassisMesh` — Industrial mounting skid, pump housing, and main coolant manifold pipe.
    2. `CoolantValveWheelMesh` — Articulated spoked isolation handwheel on the left intake manifold (`Hotspot 1`).
    3. `PressureRegulatorMesh` — High-pressure regulator dome + rotating gauge needle at top center (`Hotspot 2`).
    4. `ThermalRelayCoreMesh` — Finned cylindrical thermal relay core + status beacon on the right housing (`Hotspot 3`).
    5. `ScanSweepRingMesh` — Animated horizontal laser scan ring & component highlight halos.
- **Audio (`Assets/GeneratedSFX/`):**
  - `ButtonClick.wav`, `ScanSweep.wav`, `FaultAlert.wav`, `RepairStepConfirm.wav`, `DiagnosticComplete.wav` generated via `/build-sfx`.
- **Custom Scripts (`Assets/Scripts/` & `Assets/Tests/`):**
  - `Assets/Scripts/FieldFixState.ts` — Strongly typed data model, component telemetry definitions, and 4-step repair state machine.
  - `Assets/Scripts/FieldFixEquipmentMesh.ts` — Multi-part `MeshBuilder` 3D industrial equipment generator, vertex color state updater, mechanical articulation animator, and SIK 3D hotspot collider/interactable wiring.
  - `Assets/Scripts/FieldFixDiagnosticUI.ts` — Dedicated `SpectaclesUIKit` world-space UI module (`Frame`, `FlexLayout`, `Button`, `Text`, `Event<T>` emitters—strictly following CLAD Channel-A UI separation rules).
  - `Assets/Scripts/FieldFixAudioController.ts` — Procedural spatial audio playback manager.
  - `Assets/Scripts/FieldFixMain.ts` — Main experience coordinator connecting `FieldFixEquipmentMesh`, `FieldFixDiagnosticUI`, and `FieldFixAudioController` with `@input` inspector tunables.
  - `Assets/Tests/FieldFixLeafInteractor.ts`, `Assets/Tests/FieldFixLeafScenario.ts`, `Assets/Tests/LeafIndex.ts` — Automated LEAF test suite verifying initialization, scan, hotspot selection, step navigation, repair confirmation, completion, and reset.

## Scene Hierarchy (Sketch)

```
Root
├── Camera Object (Perspective Camera, FOV 63.5°, near 1, far 10000 + DeviceTracking: World)
├── Lighting
│   ├── Ambient Light
│   └── Light (Directional)
├── SpectaclesInteractionKit
│   ├── [REQUIRED] Core
│   └── [OPTIONAL] Visuals
└── FieldFixExperience [z = -110 cm] (FieldFixMain.ts, FieldFixAudioController.ts)
    ├── EquipmentUnitRoot [x = -12, y = -6, z = 0] (FieldFixEquipmentMesh.ts)
    │   ├── BaseChassisVisual
    │   ├── CoolantValveAssembly [x = -9, y = 2, z = 4] (SIK Interactable Hotspot 1)
    │   ├── PressureRegulatorAssembly [x = 0, y = 10, z = 3] (SIK Interactable Hotspot 2)
    │   ├── ThermalRelayAssembly [x = 9, y = 3, z = 4] (SIK Interactable Hotspot 3)
    │   ├── ScanSweepRingVisual
    │   └── OverheadStatusBeaconVisual
    ├── DiagnosticUIRoot [x = 13, y = 0, z = 2] (FieldFixDiagnosticUI.ts — UIKit Frame)
    └── AudioPlayersRoot
        ├── ClickAudio
        ├── ScanAudio
        ├── AlertAudio
        ├── ConfirmAudio
        └── CompleteAudio
```

## Preview-Testable Adjustments

| Real-World Intent | Preview Stand-In |
|---|---|
| Live IoT equipment sensor telemetry & optical fiduciary marker detection on physical plant machinery | Interactive **Scan Equipment** pinch button + pre-anchored 3D **Cryo-Coolant Pump & Relay Unit** at workbench depth (`z = -110 cm`) with simulated live telemetry (`118°C`, `142 PSI`, `18% Flow`) |
| Physical two-handed wrench/valve manipulation verified by computer vision | Pinching **Confirm Action** (or pinching the highlighted 3D component hotspot) drives real-time 3D mechanical articulation (rotating valve wheel, sweeping pressure gauge, retracting relay core) |
| Walking around the physical machine bay to inspect side panels | Direct 3D hotspot pinching on the angled equipment assembly + quick-select component buttons (`Valve`, `Regulator`, `Relay`) comfortably reachable from the default Preview camera |

## Done Criteria

- [x] **Scene & Spatial Setup:** Project compiles with zero TypeScript errors, runs in Lens Studio Preview (`SPECS 27`, `Interactive` mode) at `z = -110 cm` with `Camera` (`Perspective` + `DeviceTracking: World`) and `SpectaclesInteractionKit`.
- [x] **3D Equipment & Hotspot Interaction:** The multi-part 3D Cryo-Coolant Pump & Relay Unit renders clearly in the preview viewport with 3 distinct interactive hotspots (`Primary Coolant Valve`, `Pressure Regulator`, `Thermal Relay Core`) selectable via pinch/click.
- [x] **Equipment Scan Stand-In:** Triggering **Scan Equipment** plays the scan sweep animation/audio, transitions the unit from `READY TO SCAN` to `FAULT DETECTED`, and highlights the faulty components with live telemetry (`118°C`, `142 PSI`, `18% Flow`).
- [x] **4-Step Guided Repair & Bidirectional Navigation:** Users can step forward (`Next Step`), step backward (`Prev Step`), and execute (`Confirm Action`) all 4 repair steps (`Lockout Valve` → `Purge Regulator` → `Reseat Relay Core` → `Verify Flow`), with each step updating the UI card, progress counter (`1/4`..`4/4`), safety banner, and 3D mechanical articulation.
- [x] **Completion & Reset Sequence:** Confirming all 4 repair steps triggers the `SYSTEM VERIFIED NOMINAL` completion state (`42°C`, `45 PSI`, `100% Flow`, green beacon), and pinching **Reset** cleanly restores the initial state for replay.
- [x] **Automated LEAF Verification:** LEAF test scenarios in `Assets/Tests/` execute in Lens Studio Preview and pass with zero runtime errors in `RunAndCollectLogsTool`.

## Out of Scope

- External cloud APIs, paid 3D asset marketplaces, or external LLM/vision inference calls.
- Multi-user Colocated Connected Lenses networking (single-technician offline-capable experience).
- Persistent cross-session cloud work-order database sync.
