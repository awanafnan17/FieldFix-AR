/**
 * FieldFixAdversarialSafetyAndXRayScenario.ts
 * Automated Adversarial LEAF Scenario verifying:
 * 1. Scan-interrupt immunity (pinching BtnPrimaryAction mid-scan does not abort sweep)
 * 2. 3D Spatial X-Ray / Exploded Sub-Assembly Inspection Mode (BtnToggleXray)
 * 3. Out-of-Order LOTO Safety Interlock (blocks un-isolated TR-309 / PR-204 execution & redirects to Step 1)
 * 4. Direct 3D Hotspot Guided Repair Execution & Trainee Competency Scorecard
 * 5. Before / After Spatial Comparison Mode (BtnToggleComparison)
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

@component
export class FieldFixAdversarialSafetyAndXRayScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    const main = await interactor.waitForReady()

    main.resetExperience()
    await sleep(100)

    // 1. Trigger Scan & Verify Mid-Scan Duplicate Pinch Immunity
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await sleep(250)
    expect(interactor.getSnapshot().phase, "Phase during sweep should be SCANNING").toBe("SCANNING")

    // Adversarial mid-scan pinch on BtnPrimaryAction — must NOT abort scan early
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    expect(interactor.getSnapshot().phase, "Mid-scan pinch must not abort SCANNING phase").toBe("SCANNING")

    await sleep(1250)
    const afterScan = interactor.getSnapshot()
    expect(afterScan.phase, "Phase after scan completes should be DIAGNOSING").toBe("DIAGNOSING")
    expect(afterScan.completedCount, "No steps completed yet").toBe(0)

    // 2. Verify 3D Spatial X-Ray / Exploded Inspection Mode (Progressive Disclosure -> Full Trace)
    await interactor.triggerNamedInteractable("BtnToggleXray")
    const xraySnap = interactor.getSnapshot()
    expect(xraySnap.xrayMode, "X-Ray mode should be active").toBe(true)

    const valveInt = findSceneObjectByName("ValveInternalCryoSeal")
    const regInt = findSceneObjectByName("RegulatorInternalDiaphragm")
    const relayInt = findSceneObjectByName("RelayInternalStatorCoil")
    expect(
      relayInt !== null && relayInt.enabled,
      "At Trace 1/3, traced RelayInternalStatorCoil should be enabled in X-Ray mode"
    ).toBe(true)
    expect(
      regInt !== null && !regInt.enabled,
      "At Trace 1/3, uninspected RegulatorInternalDiaphragm remains concealed"
    ).toBe(true)
    expect(
      valveInt !== null && !valveInt.enabled,
      "At Trace 1/3, uninspected ValveInternalCryoSeal remains concealed"
    ).toBe(true)

    // Trace upstream through PR-204 (Trace 2/3) and CV-101 (Trace 3/3) so all 3 internals are inspected
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    expect(interactor.getSnapshot().faultTraceComplete, "Upstream fault trace complete (3/3)").toBe(true)
    expect(valveInt !== null && valveInt.enabled, "ValveInternalCryoSeal should be enabled once traced").toBe(true)
    expect(regInt !== null && regInt.enabled, "RegulatorInternalDiaphragm should be enabled once traced").toBe(true)
    expect(relayInt !== null && relayInt.enabled, "RelayInternalStatorCoil should be enabled once traced").toBe(true)

    // 3. Adversarial Out-of-Order LOTO Safety Interlock Check:
    // Select 3D Thermal Relay Core (jumps to Step 3/4, index 2), then pinch again to attempt execution before Step 1 LOTO
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    expect(interactor.getSnapshot().currentStepIndex, "Inspecting TR-309 previews Step 3 (index 2)").toBe(2)

    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    const interlockedSnap = interactor.getSnapshot()
    expect(interlockedSnap.completedCount, "Safety Interlock must block out-of-order Step 3 execution").toBe(0)
    expect(interlockedSnap.safetyViolations, "Safety violation count should increment to 1").toBe(1)
    expect(interlockedSnap.currentStepIndex, "Safety Interlock must redirect trainee to Step 1 (index 0)").toBe(0)
    expect(interlockedSnap.selectedHotspot, "Safety Interlock must focus valve hotspot").toBe("valve")

    // 4. Execute all 4 steps in valid LOTO sequence via direct 3D Hotspot pinches
    // Since selectedHotspot is already "valve" and currentStepIndex is 0, pinching Hotspot_CoolantValve executes Step 1!
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    expect(interactor.getSnapshot().completedCount, "Step 1 executed via 3D Valve pinch").toBe(1)
    expect(interactor.getSnapshot().coolantFlowPct, "Flow isolated to 0%").toBe(0)

    // Step 2: Regulator is now auto-selected (selectedHotspot="regulator", stepIndex=1), so 1st pinch executes Step 2!
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    expect(interactor.getSnapshot().completedCount, "Step 2 executed via 3D Regulator pinch").toBe(2)
    expect(interactor.getSnapshot().systemPressurePsi, "Pressure purged to 38 PSI").toBe(38)

    // Step 3: Relay Core is now auto-selected (selectedHotspot="relay", stepIndex=2), so 1st pinch executes Step 3!
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    expect(interactor.getSnapshot().completedCount, "Step 3 executed via 3D Relay Core pinch").toBe(3)
    expect(interactor.getSnapshot().systemTempC, "Core cooled to 46C").toBe(46)

    // Step 4: Valve is now auto-selected (selectedHotspot="valve", stepIndex=3), so 1st pinch executes Step 4!
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const completedSnap = interactor.getSnapshot()
    expect(completedSnap.completedCount, "All 4 steps completed").toBe(4)
    expect(completedSnap.phase, "Phase is COMPLETED").toBe("COMPLETED")
    expect(completedSnap.trainingScorePct, "Trainee score with 1 interlock redirect is 85%").toBe(85)

    // 5. Verify Before / After Spatial Comparison Mode
    await interactor.triggerNamedInteractable("BtnToggleComparison")
    const compareFaultSnap = interactor.getSnapshot()
    expect(compareFaultSnap.comparisonFaultPreview, "Comparison fault preview should be active").toBe(true)
    expect(compareFaultSnap.systemTempC, "Comparison fault preview shows 118C").toBe(118)
    expect(compareFaultSnap.systemPressurePsi, "Comparison fault preview shows 142 PSI").toBe(142)
    expect(compareFaultSnap.completedCount, "Completed count remains 4 during comparison").toBe(4)

    await interactor.triggerNamedInteractable("BtnToggleComparison")
    const compareNominalSnap = interactor.getSnapshot()
    expect(compareNominalSnap.comparisonFaultPreview, "Comparison fault preview turned off").toBe(false)
    expect(compareNominalSnap.systemTempC, "Restored nominal 42C").toBe(42)
    expect(compareNominalSnap.systemPressurePsi, "Restored nominal 45 PSI").toBe(45)
    expect(compareNominalSnap.coolantFlowPct, "Restored nominal 100% flow").toBe(100)

    // Turn off X-Ray mode
    await interactor.triggerNamedInteractable("BtnToggleXray")
    expect(interactor.getSnapshot().xrayMode, "X-Ray mode turned off").toBe(false)

    print("[LEAF] FieldFixAdversarialSafetyAndXRayScenario PASSED all assertions.")
  }
}
