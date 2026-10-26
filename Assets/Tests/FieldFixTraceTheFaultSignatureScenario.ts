/**
 * FieldFixTraceTheFaultSignatureScenario.ts
 * Automated LEAF scenario verifying the "TRACE THE FAULT" Signature Spatial Experience:
 * 1. First-10-Second Progressive Disclosure Onboarding & 2-Zone Causal Flow Geometry
 * 2. Spatial Scan -> Symptom Discovery at TR-309 (118C Overheat, Trace 1/3)
 * 3. Upstream 3D Hotspot Trace to PR-204 (142 PSI Vapor-Lock, Trace 2/3) + Automatic 3D X-Ray Cutaway
 * 4. Out-of-Order LOTO Safety Interlock when attempting to purge PR-204 before isolating CV-101
 * 5. Coherent Cause-and-Effect 4-Step 3D Mechanical Recovery (Purge Plume, Overheat Crown extinguish, 100% Flow)
 * 6. Reset & Replay state restoration
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

@component
export class FieldFixTraceTheFaultSignatureScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    const main = await interactor.waitForReady()

    main.resetExperience()
    await sleep(100)

    // 1. Verify Progressive Disclosure Onboarding & New 3D Signature Geometry
    const initSnap = interactor.getSnapshot()
    expect(initSnap.phase, "Initial phase is READY_TO_SCAN").toBe("READY_TO_SCAN")
    expect(initSnap.uiDisclosureMode, "Initial disclosure mode is onboarding").toBe("onboarding")
    expect(initSnap.faultTraceCount, "Initial fault trace count is 0").toBe(0)
    expect(initSnap.flowBottleneckStage, "Initial bottleneck stage is choked_142psi").toBe("choked_142psi")
    expect(
      interactor.getLabelText("StepHeaderText"),
      "Onboarding step header hides repair spoilers until scan"
    ).toBe("PHASE 1: SPATIAL TELEMETRY SCAN")

    const bottleneckRing = findSceneObjectByName("FaultBottleneckRing")
    const riserPulse = findSceneObjectByName("RiserPressurePulseRing")
    const impeller = findSceneObjectByName("ManifoldFlowImpeller")
    const purgePlume = findSceneObjectByName("RegulatorPurgePlume")
    const overheatCrown = findSceneObjectByName("RelayOverheatCrown")
    const causalBridge = findSceneObjectByName("CausalFlowBridge")

    expect(bottleneckRing !== null && bottleneckRing.enabled, "FaultBottleneckRing is active").toBe(true)
    expect(riserPulse !== null && riserPulse.enabled, "RiserPressurePulseRing is active in choked state").toBe(true)
    expect(impeller !== null && impeller.enabled, "ManifoldFlowImpeller is active").toBe(true)
    expect(purgePlume !== null && !purgePlume.enabled, "RegulatorPurgePlume is hidden before Step 2 purge").toBe(true)
    expect(overheatCrown !== null && overheatCrown.enabled, "RelayOverheatCrown pulses during 118C overheat").toBe(true)
    expect(causalBridge !== null && causalBridge.enabled, "CausalFlowBridge connects subsystems").toBe(true)

    // 2. Trigger Equipment Scan -> Verify Symptom Discovery at TR-309 (Trace 1/3)
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await sleep(1450)

    const scanSnap = interactor.getSnapshot()
    expect(scanSnap.phase, "Phase after scan is DIAGNOSING").toBe("DIAGNOSING")
    expect(scanSnap.selectedHotspot, "Scan focuses symptom at TR-309 relay").toBe("relay")
    expect(scanSnap.faultTraceCount, "TR-309 symptom is traced (1/3)").toBe(1)
    expect(scanSnap.nextTraceTarget, "Next upstream trace target is regulator (PR-204)").toBe("regulator")
    expect(scanSnap.xrayMode, "X-Ray remains off immediately after scan").toBe(false)

    // 3. Follow 3D Chevron Upstream -> Pinch Hotspot_PressureRegulator (Trace 2/3 + Auto-X-Ray)
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const regTraceSnap = interactor.getSnapshot()
    expect(regTraceSnap.selectedHotspot, "3D pinch selects regulator").toBe("regulator")
    expect(regTraceSnap.faultTraceCount, "Upstream trace count increments to 2/3").toBe(2)
    expect(regTraceSnap.nextTraceTarget, "Next upstream trace target is valve (CV-101)").toBe("valve")
    expect(regTraceSnap.xrayMode, "Tracing 3D hotspot in DIAGNOSING auto-enables 3D X-Ray cutaway").toBe(true)
    expect(regTraceSnap.focusedXrayHotspot, "Focused X-Ray hotspot is regulator").toBe("regulator")

    // Verify manual BtnToggleXray off-toggle genuinely closes X-Ray and clears focusedXrayHotspot, then re-open
    await interactor.triggerNamedInteractable("BtnToggleXray")
    const xrayClosedSnap = interactor.getSnapshot()
    expect(xrayClosedSnap.xrayMode, "BtnToggleXray closes Auto-X-Ray").toBe(false)
    expect(xrayClosedSnap.focusedXrayHotspot, "Closing X-Ray clears focusedXrayHotspot").toBeNull()
    await interactor.triggerNamedInteractable("BtnToggleXray")
    expect(interactor.getSnapshot().xrayMode, "BtnToggleXray re-enables X-Ray").toBe(true)

    // 4. Attempt Out-of-Order Purge on PR-204 before Step 1 LOTO -> Blocked by Safety Interlock
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const interlockSnap = interactor.getSnapshot()
    expect(interlockSnap.completedCount, "LOTO Safety Interlock blocks out-of-order Step 2 purge").toBe(0)
    expect(interlockSnap.safetyViolations, "Safety violation recorded").toBe(1)
    expect(interlockSnap.selectedHotspot, "Interlock redirects focus upstream to CV-101 valve").toBe("valve")
    expect(interlockSnap.currentStepIndex, "Interlock redirects step index to Step 1 (0)").toBe(0)

    // 5. Execute all 4 Steps via Direct 3D Machine Pinches & Verify Cause-and-Effect Visual Recovery
    // Step 1: Isolate CV-101 Valve
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const step1Snap = interactor.getSnapshot()
    expect(step1Snap.completedCount, "Step 1 completed").toBe(1)
    expect(step1Snap.flowBottleneckStage, "Flow stage transitions to isolated_trapped_psi").toBe("isolated_trapped_psi")

    // Step 2: Purge PR-204 Regulator -> Verify 3D Vapor Purge Plume bursts upward
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const step2Snap = interactor.getSnapshot()
    expect(step2Snap.completedCount, "Step 2 completed").toBe(2)
    expect(step2Snap.systemPressurePsi, "Pressure drops from 142 to 38 PSI").toBe(38)
    expect(purgePlume !== null && purgePlume.enabled, "RegulatorPurgePlume bursts upward on Step 2 purge").toBe(true)

    // Step 3: Reseat TR-309 Thermal Relay Core -> Verify Overheat Crown extinguishes
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    const step3Snap = interactor.getSnapshot()
    expect(step3Snap.completedCount, "Step 3 completed").toBe(3)
    expect(step3Snap.systemTempC, "Temperature cools from 82C to 46C").toBe(46)
    expect(step3Snap.flowBottleneckStage, "Flow stage transitions to purged_cooled_ready").toBe("purged_cooled_ready")
    expect(overheatCrown !== null && !overheatCrown.enabled, "RelayOverheatCrown extinguishes once cooled").toBe(true)

    // Step 4: Remove LOTO & Re-open CV-101 Valve -> Verify 100% Nominal Flow Restoration
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const finalSnap = interactor.getSnapshot()
    expect(finalSnap.completedCount, "All 4 steps completed").toBe(4)
    expect(finalSnap.phase, "Phase is COMPLETED").toBe("COMPLETED")
    expect(finalSnap.flowBottleneckStage, "Flow stage is nominal_100pct").toBe("nominal_100pct")
    expect(finalSnap.faultTraceComplete, "All 3 subsystems traced and verified").toBe(true)
    expect(finalSnap.trainingScorePct, "Trainee score with 1 LOTO violation is 85%").toBe(85)

    // 6. Reset & Verify Clean Restoration
    await interactor.triggerNamedInteractable("BtnResetUnit")
    await sleep(100)
    const resetSnap = interactor.getSnapshot()
    expect(resetSnap.phase, "Reset restores READY_TO_SCAN").toBe("READY_TO_SCAN")
    expect(resetSnap.faultTraceCount, "Reset clears faultTraceCount to 0").toBe(0)
    expect(overheatCrown !== null && overheatCrown.enabled, "RelayOverheatCrown re-enabled on reset").toBe(true)

    print("[LEAF] FieldFixTraceTheFaultSignatureScenario PASSED all assertions.")
  }
}
