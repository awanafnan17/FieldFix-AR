/**
 * FieldFixLeafScenario.ts
 * Automated LEAF end-to-end scenarios verifying all FieldFix AR Done Criteria:
 * 1. Initialization & Standby Telemetry
 * 2. Equipment Telemetry Scan (Preview Stand-In)
 * 3. Direct 3D Hotspot Selection (Valve, Regulator, Relay Core)
 * 4. Bidirectional Step Navigation (Next Step / Prev Step)
 * 5. 4-Step Guided Repair Execution & Telemetry Verification
 * 6. Completion State & Reset Replay
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

@component
export class FieldFixFullDiagnosticRepairScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    const main = await interactor.waitForReady()

    // Ensure clean starting state
    main.resetExperience()
    await sleep(100)

    // 1. Verify Initial Standby State
    const initSnap = interactor.getSnapshot()
    expect(initSnap.phase, "Initial phase should be READY_TO_SCAN").toBe("READY_TO_SCAN")
    expect(initSnap.completedCount, "Initial completed step count should be 0").toBe(0)
    expect(interactor.getLabelText("ProgressLabelText"), "Progress label should show 0 / 4 DONE").toBe("0 / 4 DONE")

    // 2. Trigger Equipment Scan via UIKit Primary Action Button
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    // Wait for scan sweep (1.2s) to finish and enter DIAGNOSING phase
    await sleep(1450)

    const scannedSnap = interactor.getSnapshot()
    expect(scannedSnap.phase, "Phase after scan should be DIAGNOSING").toBe("DIAGNOSING")
    expect(scannedSnap.systemTempC, "Fault temperature should be 118C").toBe(118)
    expect(scannedSnap.systemPressurePsi, "Fault pressure should be 142 PSI").toBe(142)

    // 3. Test Direct 3D Hotspot Selection on the 3D Equipment Assembly
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    expect(interactor.getSnapshot().selectedHotspot, "3D Valve hotspot should select valve").toBe("valve")

    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    expect(interactor.getSnapshot().selectedHotspot, "3D Regulator hotspot should select regulator").toBe("regulator")

    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    expect(interactor.getSnapshot().selectedHotspot, "3D Relay hotspot should select relay").toBe("relay")

    // 4. Test Bidirectional Step Navigation (Prev / Next)
    // Relay hotspot jumps to Step 3 (index 2); step back to Step 1 (index 0)
    await interactor.triggerNamedInteractable("BtnPrevStep")
    expect(interactor.getSnapshot().currentStepIndex, "Prev step should move to index 1").toBe(1)

    await interactor.triggerNamedInteractable("BtnPrevStep")
    expect(interactor.getSnapshot().currentStepIndex, "Prev step should move to index 0").toBe(0)

    await interactor.triggerNamedInteractable("BtnNextStep")
    expect(interactor.getSnapshot().currentStepIndex, "Next step should move to index 1").toBe(1)

    await interactor.triggerNamedInteractable("BtnPrevStep")
    expect(interactor.getSnapshot().currentStepIndex, "Back to Step 1 (index 0) to begin repair").toBe(0)

    // 5. Execute all 4 Guided Repair Steps via BtnPrimaryAction
    // Step 1: Lockout Isolation Valve
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const afterStep1 = interactor.getSnapshot()
    expect(afterStep1.completedCount, "After Step 1, completedCount should be 1").toBe(1)
    expect(afterStep1.coolantFlowPct, "After Step 1 valve lockout, flow should be 0%").toBe(0)

    // Step 2: Purge Bypass Regulator
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const afterStep2 = interactor.getSnapshot()
    expect(afterStep2.completedCount, "After Step 2, completedCount should be 2").toBe(2)
    expect(afterStep2.systemPressurePsi, "After Step 2 purge, pressure should drop to 38 PSI").toBe(38)

    // Step 3: Reseat Thermal Relay Core
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const afterStep3 = interactor.getSnapshot()
    expect(afterStep3.completedCount, "After Step 3, completedCount should be 3").toBe(3)
    expect(afterStep3.systemTempC, "After Step 3 core reseat, temp should cool to 46C").toBe(46)

    // Step 4: Re-Pressurize & Verify Nominal Flow
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const afterStep4 = interactor.getSnapshot()
    expect(afterStep4.completedCount, "After Step 4, completedCount should be 4").toBe(4)
    expect(afterStep4.phase, "Final phase should be COMPLETED").toBe("COMPLETED")
    expect(afterStep4.systemTempC, "Final nominal temp should be 42C").toBe(42)
    expect(afterStep4.systemPressurePsi, "Final nominal pressure should be 45 PSI").toBe(45)
    expect(afterStep4.coolantFlowPct, "Final nominal flow should be 100%").toBe(100)
    expect(interactor.getLabelText("ProgressLabelText"), "Progress label should show 4 / 4 DONE").toBe("4 / 4 DONE")

    print("[LEAF] FieldFixFullDiagnosticRepairScenario PASSED all assertions.")
  }
}

export { FieldFixResetAndReplayScenario } from "./FieldFixResetAndReplayScenario"
