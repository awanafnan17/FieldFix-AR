/**
 * FieldFixResetAndReplayScenario.ts
 * Automated LEAF scenario verifying Reset & Replay and UI Hotspot Pill Selection.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

@component
export class FieldFixResetAndReplayScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    await interactor.waitForReady()

    // Trigger Reset button via SIK/UIKit
    await interactor.triggerNamedInteractable("BtnResetUnit")
    await sleep(100)

    const resetSnap = interactor.getSnapshot()
    expect(resetSnap.phase, "Reset should restore phase to READY_TO_SCAN").toBe("READY_TO_SCAN")
    expect(resetSnap.completedCount, "Reset should clear completed steps to 0").toBe(0)
    expect(interactor.getLabelText("ProgressLabelText"), "Reset progress label should be 0 / 4 DONE").toBe(
      "0 / 4 DONE"
    )

    // Select a hotspot pill button and confirm immediate transition to DIAGNOSING
    await interactor.triggerNamedInteractable("BtnHotspotValve")
    const valveSnap = interactor.getSnapshot()
    expect(valveSnap.phase, "Selecting hotspot pill from standby enters DIAGNOSING").toBe("DIAGNOSING")
    expect(valveSnap.selectedHotspot, "Selected hotspot should be valve").toBe("valve")

    // Reset back to clean state
    await interactor.triggerNamedInteractable("BtnResetUnit")
    await sleep(100)
    expect(interactor.getSnapshot().phase, "Final reset returns to READY_TO_SCAN").toBe("READY_TO_SCAN")

    print("[LEAF] FieldFixResetAndReplayScenario PASSED all assertions.")
  }
}
