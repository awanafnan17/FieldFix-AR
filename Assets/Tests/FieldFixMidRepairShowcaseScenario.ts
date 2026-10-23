/**
 * FieldFixMidRepairShowcaseScenario.ts
 * Automated LEAF scenario verifying scan -> fault localization -> Step 1 & Step 2 execution,
 * pausing at Step 3/4 (Thermal Relay Core Reseat) with 2/4 steps completed so mid-repair
 * mechanical articulation and telemetry (38 PSI, 82C, 0% Flow) are verified in Preview.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

@component
export class FieldFixMidRepairShowcaseScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    const main = await interactor.waitForReady()

    main.resetExperience()
    await sleep(100)

    // 1. Trigger Equipment Scan
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await sleep(1450)
    expect(interactor.getSnapshot().phase, "Scan enters DIAGNOSING").toBe("DIAGNOSING")

    // 2. Execute Step 1 (Lockout Valve CV-101)
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    expect(interactor.getSnapshot().completedCount, "Step 1 complete").toBe(1)

    // 3. Execute Step 2 (Purge Regulator PR-204 to 38 PSI)
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const midSnap = interactor.getSnapshot()
    expect(midSnap.completedCount, "Step 2 complete (2/4)").toBe(2)
    expect(midSnap.phase, "Phase is REPAIRING").toBe("REPAIRING")
    expect(midSnap.currentStep.stepNumber, "Active step is Step 3/4").toBe(3)
    expect(midSnap.selectedHotspot, "Active target is relay").toBe("relay")
    expect(midSnap.systemPressurePsi, "Pressure purged to 38 PSI").toBe(38)

    print("[LEAF] FieldFixMidRepairShowcaseScenario PASSED all assertions.")
  }
}
