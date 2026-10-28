# FieldFix AR V5 — Independent Red-Team Evaluation & Evidence-Based Optimization Report

> **Scope:** Pre-optimization static & runtime profiling, 4-criterion adversarial evaluation, and evidence-backed optimization plan for **FieldFix AR V5 ("Trace the Fault")** on branch `feature/v5-competitive-polish` (baseline commit `46b63b201f34e5695230eb27cdb530b5ea6819c9`).
>
> **Important Measurement Disclosure:** All runtime measurements below were captured in the **Lens Studio 5.24.1 Interactive Preview (`Preview 2`)** and via static scene/code inspection. No physical Spectacles hardware FPS, thermal load, or battery metrics are claimed.

---

## 1. Phase 4 — Independent Red-Team Evaluation Across the 4 Official Criteria

### A. DESIGN (Spatial Ergonomics, Visual Hierarchy, Target Comfort, Readability)

1. **Spatial Placement & Co-Planar Depth (`.virtual-scene.json`):**
   - `FieldFixExperience` is anchored at `[0, 0, -110]` (`1.10 m` in front of `Camera Object` at origin, perspective FOV `63.54°`).
   - `EquipmentUnitRoot` sits at local `[-12.5, -3.5, 2]` with scale `0.85` (world `[-12.5, -3.5, -108 cm]`, yaw `+16°`, pitch `+8°`), placing the 3D manifold in the left-center field of view.
   - `DiagnosticUIRoot` sits at local `[11.5, 0.5, 0]` with scale `0.78` (`Frame` `28 × 43.2 cm` local = `21.84 × 33.70 cm` world) on the same `1.10 m` depth plane.
2. **3D Hand-Pinch Target Sizes & Collider Spacing (`FieldFixEquipmentMesh.ts:653-777, 863-882`):**
   - `Hotspot_CoolantValve` (`[-6.8, -0.5, 4.2]`) and `Hotspot_PressureRegulator` (`[0, 0.2, 4.2]`) use `BoxShape` colliders of `5.2 × 5.2 × 7.0 cm` local (`4.42 × 4.42 × 5.95 cm` world at `1.08 m`, `2.34° × 2.34°` visual angle).
   - `Hotspot_ThermalRelayCore` (`[6.8, -0.1, 4.2]`) uses `5.4 × 5.6 × 7.0 cm` local (`4.59 × 4.76 × 5.95 cm` world).
   - Center-to-center spacing (`6.8 cm` local = `5.78 cm` world) leaves a **`1.36 cm` world-space gap** (`1.5 cm` local) between adjacent collider boxes, preventing accidental cross-triggering on angled rays.
3. **Readability & Waveguide Contrast (`FieldFixDiagnosticUI.ts:524-563`):**
   - All 14 `Component.Text` readouts use dark backing pills (`backgroundSettings.enabled = true`, `alpha = 0.85–0.94`) and drop shadows (`renderOrder = 30`), preventing additive waveguide washout.
4. **Weakness Identified (Design / Visual Consistency):**
   - In `FieldFixEquipmentMesh.ts:917-927` vs. `1249-1302`, before `PR-204` is inspected (`READY_TO_SCAN`, `SCANNING`, and `DIAGNOSING` Trace `1/3`), `regulatorBottleneckRevealed` is `false`, so `FaultBottleneckRing` is assigned `this.bottleneckMeshCleared` (emerald green), yet `animateCausalFlowSystem()` pulses that collar at fault frequency (`11.0 rad/s`) and piles up the 3 upstream amber flow rings against `PR-204` (`x = -0.95`). This creates an emerald-green collar pulsing at fault speed and prematurely reveals the `PR-204` physical choke before Trace `2/3`.

---

### B. TECHNICAL IMPLEMENTATION (State Machine, SPECS APIs, Resource Hygiene)

1. **State Machine Determinism (`FieldFixState.ts`):**
   - `FieldFixStateStore` is a pure TypeScript state machine (`863` lines) with zero scene-graph coupling. All telemetry readouts (`temperatureC`, `pressurePsi`, `flowRatePct`, `flowBottleneckStage`, `activeFaultBadge`) derive from a single deterministic function `computeSimulatedTelemetry()`.
2. **Weakness Identified (State Edge Case on Standby 3D Hotspot Pinch — `FieldFixState.ts:384-422`):**
   - If a user in `READY_TO_SCAN` pinches `Hotspot_PressureRegulator` (`PR-204`) directly without clicking `SCAN EQUIPMENT TELEMETRY` first:
     1. Line `384` (`wasInStandby`) transitions `_phase` directly to `"DIAGNOSING"` and sets `_tracedHotspots.relay = true`.
     2. Line `401` (`if (hotspotId === "regulator" && this._tracedHotspots.relay)`) immediately evaluates to `true` in the **same call**, jumping straight to `faultTraceCount = 2` (`PR-204` traced) on the first pinch.
     3. Line `415` (`if (!wasInStandby && hotspotId === "regulator" && !prevRegulator)`) blocks `_xrayMode = true` because `wasInStandby` was `true`, leaving Auto-X-Ray closed even though `PR-204` was marked traced.
3. **Weakness Identified (`UpdateEvent` Redundant Transform Writes — `FieldFixEquipmentMesh.ts:1079-1332`):**
   - While `FieldFixEquipmentMesh` pre-allocates all `33` `RenderMesh` assets and shares `1` material (`0` clones), its `onUpdate(dt)` callback writes `22–28` scene-graph transforms (`setLocalPosition` / `setLocalRotation` / `setLocalScale`) and allocates `14–18` temporary `vec3` / `quat` instances **every single frame**, even when mechanical pivots (`valveWheelPivot`, `gaugeNeedlePivot`, `relayCorePivot`), `regulatorPurgePlumeObj`, `manifoldImpellerObj`, and the 6 LOTO-isolated `coolantFlowRings` are completely stationary.

---

### C. INNOVATION (Why Spatial AR vs. 2D Tablet, Signature Experience)

1. **Genuine Spatial Necessity:**
   - Co-locates directional 3D fluid dynamics (`CoolantFlowPulseRing_0..5` traveling left-to-right from `CV-101` through `PR-204` to `TR-309`), localized 3D Auto-X-Ray internal cutaways (`ValveInternalCryoSeal`, `RegulatorInternalDiaphragm`, `RelayInternalStatorCoil`), and physical mechanical state indicators (rotating asymmetric valve handle, `LotoSafetyClasp`, gauge needle, `RegulatorPurgePlume`) in hands-free stereo space.
2. **Non-Linear Diagnostic & Safety Consequence Engine:**
   - Skipping `PR-204` to pinch `CV-101` at Trace `1/3` triggers a non-punitive causal-order advisory (`[INSPECT PR-204 FIRST]`).
   - Pinching an out-of-order component during `REPAIRING` triggers a **component-pair-specific physical hazard consequence** (`142 PSI blowdown hazard` on `PR-204` vs. `94°C thermal arc risk` on `TR-309`), deducts `-15%` on the competency scorecard, and redirects focus to the required prerequisite (`CV-101`).
3. **The Signature Unforgettable Interaction:**
   - Pinching `PR-204` at Trace `2/3` (`[PINCH: INSPECT]`): the regulator outer housing smoothly elevates into **localized 3D Auto-X-Ray cutaway** to expose the red-jammed `RegulatorInternalDiaphragm` inside the manifold while revealing the `142 PSI` vapor-lock bottleneck.

---

### D. PRESENTATION (First 5 Seconds, Spoiler-Free Arc, Documentation & Screenshot Sync)

1. **Video Pacing & Anti-Spoiler Verification (`devpost/FieldFix-AR-Demo-V5-TraceTheFault.mp4`):**
   - Verified across extracted frames at `0s`, `2s`, `7s`, `12s`, `15s`, `20s`, `22s`, `26s`, and `40s`: opens immediately on live AR footage of the `116°C` overheating cooling unit, conceals `PR-204` (`142 PSI`) until after `PR-204` inspection (`0:15`), conceals `CV-101` (`18%` flow) until after `CV-101` inspection (`0:22`), demonstrates the LOTO safety interlock (`85%` Run 1) and flawless replay (`100%` Run 2), and keeps the CLAD build showcase concise.
2. **Weakness Identified (Stale Pre-Refactor Static Screenshots in `devpost/screenshots/`):**
   - `devpost/screenshots/01_standby_ready_to_scan.png` and `02_diagnosing_fault_localized.png` were captured before the progressive-disclosure anti-spoiler refactor:
     - `01_standby_ready_to_scan.png` still shows `PR-204: 140 PSI [VAPOR LOCK]` and `CV-101: 18% FLOW [CAVITATION]` on the standby screen instead of `[UNINSPECTED]`.
     - `02_diagnosing_fault_localized.png` still shows `EXECUTE STEP 2: PURGE PSI` at `TRACE: 2/3 MAPPED` instead of `TRACE UPSTREAM: INSPECT [CV-101]`.

---

## 2. Phase 5 — Pre-Optimization Baseline Profile (Measured Before Optimization)

| Metric / Resource | Source Location | Pre-Optimization Baseline | Post-Optimization Target |
| :--- | :--- | :--- | :--- |
| **3D Equipment `SceneObject`s / `RenderMeshVisual`s** | `FieldFixEquipmentMesh.ts:544-832` | `29` / `29` (`frustumCull = true`) | `29` / `29` |
| **Procedural `RenderMesh` Assets (Awake-only)** | `FieldFixEquipmentMesh.ts:468-830` | `33` (`0` runtime `MeshBuilder` calls) | `33` (`0` runtime `MeshBuilder` calls) |
| **Equipment Material Instances / Clones** | `FieldFixEquipmentMesh.ts:463` | `1` shared material / `0` clones | `1` shared material / `0` clones |
| **Active `UpdateEvent` Callbacks** | `FieldFixMain.ts:58`, `FieldFixEquipmentMesh.ts:449` | `2` (`0` in `FieldFixDiagnosticUI.ts`) | `2` (`0` in `FieldFixDiagnosticUI.ts`) |
| **Per-Frame `Transform` Writes in `onUpdate` (LOTO Steps 1–3 Settled)** | `FieldFixEquipmentMesh.ts:1108-1313` | **`23` writes/frame** (incl. 12 parked flow ring writes + 6 settled pivot writes + 1 impeller write) | **`4` writes/frame** (`-82.6%` reduction; only active target chevron, status beacon, and selected halo pulse) |
| **Per-Frame `Transform` Writes in `onUpdate` (`COMPLETED` Settled)** | `FieldFixEquipmentMesh.ts:1108-1313` | **`22` writes/frame** (incl. 7 settled pivot/bottleneck writes) | **`14` writes/frame** (`-36.4%` reduction; only active 100% flow rings, impeller, and nominal beacon) |
| **Uninspected `FaultBottleneckRing` State at Trace `1/3`** | `FieldFixEquipmentMesh.ts:917-927, 1249` | Enabled with green `bottleneckMeshCleared` pulsing at `11 rad/s` while upstream rings pile up at `PR-204` | Disabled (`enabled = false`) until `PR-204` is inspected (`regulatorBottleneckRevealed === true`) |
| **Standby 3D Hotspot Pinch (`READY_TO_SCAN` -> `PR-204`)** | `FieldFixState.ts:384-422` | Jumps straight to `faultTraceCount = 2` and skips `_xrayMode = true` | Cleanly enters `DIAGNOSING` at Trace `1/3` (`TR-309`); subsequent `PR-204` pinch advances to Trace `2/3` with `_xrayMode = true` |
| **Static Screenshots (`01_standby_*.png`, `02_diagnosing_*.png`)** | `devpost/screenshots/` | Pre-refactor labels spoiling `140 PSI` / `18% FLOW` | Live V5 captures matching `[UNINSPECTED]` and `TRACE UPSTREAM: INSPECT [CV-101]` |

---

## 3. Three High-Impact Optimizations Implemented & Verified

### Optimization 1: Conceal 3D Manifold Bottleneck Until `PR-204` Inspection & Fix Standby Hotspot Pinch
- **Observed Problem:**
  1. `FieldFixEquipmentMesh.ts:917-927, 1249-1302` rendered `FaultBottleneckRing` in emerald green pulsing at fault speed and bunched upstream flow rings at `PR-204` before `PR-204` was ever inspected.
  2. `FieldFixState.ts:384-422` allowed pinching `PR-204` during `READY_TO_SCAN` to jump directly to Trace `2/3` while skipping Auto-X-Ray (`_xrayMode = true`).
- **Implementation:**
  1. In `FieldFixState.selectHotspot()`: when `wasInStandby` is `true`, transition to `"DIAGNOSING"`, mark `_tracedHotspots.relay = true` (`Trace 1/3`), focus `relay` (`TR-309`), and return immediately so the trainee starts at Trace `1/3` before tracing upstream to `PR-204`.
  2. In `FieldFixEquipmentMesh.applySnapshot()` and `animateCausalFlowSystem()`: keep `faultBottleneckRingObj.enabled = isRegulatorBlocked` (hidden until `PR-204` is inspected at Trace `2/3`), and gate the `PR-204` upstream ring pile-up on `this.regulatorBottleneckRevealed` so Trace `1/3` only shows the downstream thermal starvation at `TR-309`.
- **Acceptance Criterion:** At `READY_TO_SCAN` and Trace `1/3`, `FaultBottleneckRing.enabled === false`; pinching `PR-204` at Trace `2/3` enables `FaultBottleneckRing` (`bottleneckMeshBlocked`) and activates Auto-X-Ray (`xrayMode === true`). All 5 LEAF scenarios pass.
- **Regression Risk:** Low.

### Optimization 2: Dirty-Gate Settled Mechanical Pivots & LOTO-Parked Flow Rings in `FieldFixEquipmentMesh.onUpdate()`
- **Observed Problem:** `FieldFixEquipmentMesh.onUpdate()` executed up to `19` redundant `Transform` writes and temporary `vec3`/`quat` allocations every frame on stationary pivots (`valveWheelPivot`, `gaugeNeedlePivot`, `relayCorePivot`), `regulatorPurgePlumeObj.enabled`, `manifoldImpellerObj`, `faultBottleneckRingObj`, and the 6 parked LOTO flow rings (`coolantFlowRings[0..5]`).
- **Implementation:** Added dirty-delta guards (`> 0.0005`) on settled mechanical pivots, guarded `regulatorPurgePlumeObj.enabled` so it only mutates when enabled, skipped `manifoldImpellerObj.setLocalRotation` when `impellerSpeed === 0`, and added a `flowRingsParkedDirty` flag (reset in `applySnapshot()`) so LOTO-isolated flow rings write their parked transforms once instead of every frame.
- **Acceptance Criterion:** Reduces steady-state LOTO per-frame transform writes in `FieldFixEquipmentMesh.onUpdate()` from `23` to `4` (`-82.6%`); all 5 LEAF scenarios pass with zero visual regressions.
- **Regression Risk:** Very Low.

### Optimization 3: Synchronize Static Submission Screenshots (`devpost/screenshots/`) with Verified V5 Runtime
- **Observed Problem:** `devpost/screenshots/01_standby_ready_to_scan.png` and `02_diagnosing_fault_localized.png` predated the V5 progressive-disclosure anti-spoiler UI (`PR-204: [UNINSPECTED]`, `TRACE UPSTREAM: INSPECT [CV-101]`).
- **Implementation:** Re-captured the static screenshots in `devpost/screenshots/` directly from the live V5 runtime preview (`CaptureRuntimeViewTool` / verified V5 state captures) so every static image in the repository matches the V5 code and video.
- **Acceptance Criterion:** Visual inspection of `01_standby_ready_to_scan.png` and `02_diagnosing_fault_localized.png` confirms zero premature spoilers and exact correspondence with `FieldFixDiagnosticUI.ts`.
- **Regression Risk:** None.
