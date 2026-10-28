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

    // Select a hotspot pill button from standby: enters DIAGNOSING at Trace 1/3 without skipping ahead
    await interactor.triggerNamedInteractable("BtnHotspotValve")
    const valveSnap = interactor.getSnapshot()
    expect(valveSnap.phase, "Selecting hotspot pill from standby enters DIAGNOSING").toBe("DIAGNOSING")
    expect(valveSnap.selectedHotspot, "Selected hotspot should be valve").toBe("valve")
    expect(valveSnap.faultTraceCount, "Standby shortcut starts at Trace 1/3 without skipping PR-204").toBe(1)

    // Subsequent pinch on PR-204 advances to Trace 2/3 and auto-enables X-Ray cutaway
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const regSnap = interactor.getSnapshot()
    expect(regSnap.faultTraceCount, "Inspecting PR-204 after standby entry advances to Trace 2/3").toBe(2)
    expect(regSnap.xrayMode, "Inspecting PR-204 at Trace 2/3 enables Auto-X-Ray").toBe(true)

    // Reset back to clean state
    await interactor.triggerNamedInteractable("BtnResetUnit")
    await sleep(100)
    expect(interactor.getSnapshot().phase, "Final reset returns to READY_TO_SCAN").toBe("READY_TO_SCAN")

    print("[LEAF] FieldFixResetAndReplayScenario PASSED all assertions.")
  }
}
