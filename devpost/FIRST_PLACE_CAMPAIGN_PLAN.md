# FieldFix AR — First-Place Competitive Engineering Campaign Plan (`Learn AR with SPECS`)

- **Campaign Start Timestamp:** `2026-10-24T03:07:38+0500`
- **Target Competition:** [Learn AR with SPECS Devpost Hackathon](https://learn-specs.devpost.com/) ($1,250 First-Place Target)
- **Canonical Project:** `FieldFix-AR.esproj` (`FieldFix-AR` workspace)
- **Baseline Rollback Tag & Backup:** Git tag `baseline-pre-15h-campaign` (`a55d26c`) + full file/video snapshot in `devpost/_video_build/backups_campaign_baseline_a55d26c/`

---

## 1. Current Baseline Assessment (`a55d26c`)

### 1.1 Confirmed Strengths
1. **100% Self-Contained SPECS 27 Project:** Built natively in Lens Studio 5.24.1 (`Spectacles` target, `Perspective` camera + `DeviceTracking: World`), using `SpectaclesInteractionKit.lspkg`, `SpectaclesUIKit.lspkg`, `SimpleVertexBaseColor.lspkg`, and `Leaf.lspkg` with zero external cloud or 3D file dependencies.
2. **Cohesive 4-Module Runtime Architecture:** Clean separation between domain state (`FieldFixState.ts`), procedural `MeshBuilder` 3D equipment (`FieldFixEquipmentMesh.ts`), world-space UIKit diagnostic panel (`FieldFixDiagnosticUI.ts`), and spatial audio (`FieldFixAudioController.ts`), orchestrated by `FieldFixMain.ts`.
3. **Dual-Path Spatial Interaction:** Supports both direct 3D SIK `Interactable` component pinches (`Hotspot_CoolantValve`, `Hotspot_PressureRegulator`, `Hotspot_ThermalRelayCore`) and companion `SpectaclesUIKit` HUD buttons.
4. **Honest Training Simulation Framing:** Clearly documented and labeled as an interactive industrial maintenance training simulation with simulated telemetry (`°C`, `PSI`, `Flow %`) and simulated Lockout-Tagout (`LOTO`) guidance.

### 1.2 Confirmed Weaknesses & Defects Discovered by Parallel Specialist Audits
Our concurrent baseline audits by **Agent 1/7 (`independent-red-team-judge`, `b6f425c2`)**, **Agent 2/3 (`senior-lens-engineer`, `41cdde33`)**, **Agent 4 (`adversarial-qa-tester`, `38075bc7`)**, and **Agent 5/6 (`creative-video-director`, `9f59a50e`)** uncovered **7 concrete engineering defects** and **3 major competitive gaps**:

1. **[CRITICAL — Defect #1 & #2] No LOTO Safety Interlock — Out-of-Order Execution Corrupts Telemetry (`FieldFixState.ts:195-320`):**
   - Trainees can execute Step 2 (`Purge PR-204`), Step 3 (`Reseat TR-309`), or Step 4 (`Re-Pressurize CV-101`) **before** performing Step 1 (`CV-101 LOTO Isolation`).
   - Worse: triple-pinching `Hotspot_CoolantValve` after scan executes Step 1 (`i=0`), then `selectHotspot("valve")` jumps to Step 4 (`i=3`), and the next pinch executes Step 4—causing `getSnapshot()` (`lines 314-319`) to report full nominal `42°C | 45 PSI | 100% Flow` while Steps 2 and 3 are still incomplete (`2/4 DONE`)!
2. **[HIGH — Defect #3] Rapid Double-Pinch During 1.2s Scan Aborts Scan & Executes Step 1 (`FieldFixDiagnosticUI.ts:309-315`):**
   - Pinching `BtnPrimaryAction` while `phase === "SCANNING"` routes to `onConfirmStepEvent.invoke()`, immediately cancelling `scanCountdown` and advancing/executing steps mid-scan.
3. **[HIGH — Defect #4] Pressing `< PREV` or `NEXT >` Mid-Scan Causes a Permanent `SCANNING` Zombie State (`FieldFixMain.ts:189-209`):**
   - `nextStep()` / `prevStep()` sets `scanCountdown = -1` without transitioning `_phase` out of `"SCANNING"`, leaving `LaserScanSweepRing` sweeping forever.
4. **[HIGH — Defect #5] Post-Scan Spatial Callout Header Contradiction (`FieldFixDiagnosticUI.ts:681`):**
   - `completeScan()` selects `"relay"` (`TR-309`) while setting Step 1 (`targetHotspot = "valve"` / `CV-101`). Because line 681 interpolates `snapshot.selectedComponent.subsystemCode` instead of `HOTSPOT_CATALOG[snapshot.currentStep.targetHotspot].subsystemCode`, the 3D header badge displays `UNIT #04: STEP 1/4 -> PINCH [TR-309]`—telling the trainee to pinch the wrong component!
5. **[MEDIUM — Defect #6] Post-Completion Idempotence Bug (`FieldFixState.ts:234-268`):**
   - Pinching `BtnPrimaryAction` after `phase === "COMPLETED"` re-runs step confirmation and replays completion audio.
6. **[COMPETITIVE GAP #1] Opaque Outer Shells & Subtle 90° Valve Symmetry:**
   - The `CV-101` valve wheel has `+` 90° rotational symmetry (looking identical before and after a 90° turn in static screenshots), and opaque outer shells hide the internal mechanical faults (`Cryo-PTFE Ball Seal`, `Inconel Diaphragm Spring`, `Bi-Metallic Stator Coil`).
7. **[COMPETITIVE GAP #2] Video Continuity Glitch (`0:00–0:12`), `1:19` Reset Bleed, & Missing Voice Narration (`build_demo_video.py`):**
   - In `FieldFix-AR-Demo.mp4`, Chapter 1 (`0:00–0:10`) and Chapter 2 (`0:10–0:25`) overlap on `raw_polished_gameplay_full.mov` (`ss=0.0..8.0` vs `ss=2.4..12.4`), causing the scan sweep to trigger at `0:04` and then rewind and trigger again at `0:11.5`. At `1:19`, the clip bleeds into `RESET UNIT`. And without voiceover narration, judges must read 4 text zones instead of watching the 3D machine.

---

## 2. Highest-Value Improvements Selected for Implementation

We are implementing a cohesive, 100%-verifiable 5-part upgrade package (**Features A + B + C + D + E**):

| Feature ID | Feature Name | Concrete Engineering Scope | Judging Criteria Boosted |
| :--- | :--- | :--- | :--- |
| **Feature A** | **Spatial X-Ray / Exploded Component Inspection** | Add procedural internal 3D sub-assemblies (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`) that smoothly explode outward along local 3D axes (`vec3` lerp) with rotating/oscillating internal animations and X-Ray engineering callouts when `BtnToggleXray` (`X-RAY EXPLODE`) is toggled. | **Innovation / Originality**, **Design** |
| **Feature B** | **Smart LOTO Safety Interlock & Trainee Competency Scorecard** | Block out-of-order step execution (`confirmCurrentStep`) if prerequisite safety steps (`[0 -> 1 -> 2 -> 3]`) are incomplete. Trigger red hazard halo flash, `FaultAlert.wav`, corrective guidance banner (`SAFETY INTERLOCK [LOTO VIOLATION]`), auto-focus the required prerequisite step, and compute a live **Trainee Safety & Competency Score (`100% / A+ FLAWLESS LOTO`)** upon completion. | **Technical Implementation**, **Innovation / Originality** |
| **Feature C** | **Interactive Before / After Spatial Comparison Mode** | Add `BtnToggleComparison` (`COMPARE: FAULT VIEW` ↔ `VIEWING: FAULT (118C)`) so after (or during) repair, the user can dynamically toggle the 3D machine articulation, gauge needle, relay core lift, flow rings, and telemetry between the Fault (`118°C / 142 PSI / 18% Flow`) and Restored (`42°C / 45 PSI / 100% Flow`) states without losing progress. | **Design**, **Presentation** |
| **Feature D** | **Enhanced 3D Affordances & Asymmetric Mechanical Silhouettes** | Add a high-visibility yellow/orange **3D Asymmetric Valve Lever Handle** on `ValveWheelPivot` (making `0°` vs `-90°` LOTO vs `+90°` Open unmistakable), **3D Spatial Callout Leader Struts** connecting each component to its badge, and **3D Hover Action Prompts** (`onHoverEnter`/`onHoverExit`). | **Design**, **Technical Implementation** |
| **Feature E** | **Engineering Hardening, Adversarial LEAF Suite & Narrated 120s Hero AR Video** | Fix all 7 state/UI/scan edge cases, add `FieldFixAdversarialSafetyAndXRayScenario.ts` (4 total LEAF scenarios), verify via real SIK `PreviewInteractTool` batches, recapture all screenshots, and rebuild `FieldFix-AR-Demo.mp4` (`120.0s`, `1080p`, `30fps`) with fresh zero-glitch captures and free local macOS voiceover narration (`/usr/bin/say`) + spatial SFX. | **Presentation**, **Technical Implementation** |

---

## 3. Agent Ownership & Multi-Agent Safety Protocol

| Agent Role | Subagent Type / ID | Exclusive Ownership & Responsibilities |
| :--- | :--- | :--- |
| **Agent 1 & 7 — Competition Strategist & Red Team Judge** | `independent-red-team-judge` (`b6f425c2`) | Competitive gap analysis, feature selection, and post-integration adversarial judging across Design, Technical Implementation, Originality, and Presentation. |
| **Agent 2 & 3 — Spatial Experience Designer & Senior Lens Engineer** | `senior-lens-engineer` (`41cdde33`) | Code audit and exact TypeScript architecture specification for `FieldFixState.ts`, `FieldFixEquipmentMesh.ts`, `FieldFixDiagnosticUI.ts`, and `FieldFixMain.ts`. |
| **Agent 4 — Independent QA / Adversarial Tester** | `adversarial-qa-tester` (`38075bc7`) | Edge-case vulnerability discovery, `FieldFixAdversarialSafetyAndXRayScenario.ts` design, and SIK `PreviewInteractTool` verification matrix. |
| **Agent 5 & 6 — Creative Video Director & Technical Writer** | `creative-video-director` (`9f59a50e`) + `security-reviewer` / `release-evidence-auditor` | Frame-by-frame video critique, `120s` narrated video storyboard (`build_demo_video.py`), documentation synchronization, and final compliance/security audit. |
| **Agent 8 — Lead Integrator (Orchestrator)** | Primary Agent | Exclusive control of live Lens Studio MCP operations (`RecompileTypeScriptTool`, `RunAndCollectLogsTool`, `PreviewInteractTool`, `run_leaf_scenario`, `CapturePanelScreenshotTool`), code integration, screen recording, and local Git checkpoints. |

---

## 4. Objective Acceptance Criteria & Planned Milestone Sequence

| Milestone | Scope | Objective Verification Mechanism | Target Status |
| :--- | :--- | :--- | :---: |
| **M1 — Baseline Audit & Campaign Plan** | Open `FieldFix-AR.esproj`, backup `a55d26c`, run 4 parallel specialist audits, author `FIRST_PLACE_CAMPAIGN_PLAN.md` & `QUALITY_CAMPAIGN_LOG.md`. | All 4 subagent reports delivered; baseline compile & logs verified. | **IN PROGRESS** |
| **M2 — Core Engineering Hardening & Features A, B, C, D** | Implement hardened `FieldFixState.ts`, `FieldFixEquipmentMesh.ts` (X-Ray internal sub-meshes, asymmetric valve lever, callout leader struts, before/after comparison), `FieldFixDiagnosticUI.ts` (`BtnToggleXray`, `BtnToggleComparison`, fixed header badge, scorecard), and `FieldFixMain.ts`. | `RecompileTypeScriptTool` (`0` errors) + `RunAndCollectLogsTool` (`0` runtime errors). | PLANNED |
| **M3 — Adversarial QA & 4-Scenario LEAF Suite + Real SIK Batch** | Add `FieldFixAdversarialSafetyAndXRayScenario.ts` to `Assets/Tests/LeafIndex.ts`; run all 4 LEAF scenarios in Preview (`run_leaf_scenario`) and execute multi-step real SIK hand interaction batches (`PreviewInteractTool`). | `4/4` LEAF scenarios return `status: "succeeded"`; `PreviewInteractTool` batches return `success: true` with verified runtime state transitions. | PLANNED |
| **M4 — Live Gameplay Screen Recording & Fresh 1080p Screenshots** | Capture fresh 1080p screenshots (`01`..`06`) and record continuous 60fps live Preview footage demonstrating Scan, Spatial X-Ray Exploded View, LOTO Safety Interlock block & recovery, Steps 1–4 3D articulation, Before/After Comparison, Trainee Scorecard, and LEAF execution. | Visual inspection via `read_file` on all PNGs and extracted video frames. | PLANNED |
| **M5 — Narrated 120s Hero AR Demo Video Rebuild & Frame Inspection** | Upgrade `devpost/build_demo_video.py` with local `/usr/bin/say` voiceover synthesis, sidechain audio ducking, 8 chapters (`120.0s`), zoomed LEAF inset, and zero continuity glitches; export `devpost/FieldFix-AR-Demo.mp4`. | `ffprobe` (`1920x1080`, `30fps`, `h264`, `aac`, `120.0s`) + frame-by-frame visual inspection across all 8 chapters. | PLANNED |
| **M6 — Adversarial Red-Team Re-Judging & Polish Loop** | Dispatch `independent-red-team-judge` to critique the integrated build, screenshots, and new `120.0s` video; apply any high-impact polish fixes identified. | Independent Red Team critique report + re-verified tests. | PLANNED |
| **M7 — Documentation Sync, Independent Security/Release Audit & Local Commit** | Synchronize `README.md`, `SUBMISSION.md`, `design-brief.md`, `VERIFICATION_REPORT.md`, `COMPLIANCE_CHECKLIST.md`, and `QUALITY_CAMPAIGN_LOG.md`; run `security-reviewer` & `release-evidence-auditor`; commit locally (no push); open video & project on Mac. | `0` secrets/PII, clean local `git status`, all 19 Final Acceptance Criteria verified. | PLANNED |
