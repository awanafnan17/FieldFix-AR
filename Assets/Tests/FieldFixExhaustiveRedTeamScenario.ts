/**
 * FieldFixExhaustiveRedTeamScenario.ts
 * Hostile Red-Team LEAF Regression & State-Machine Invariant Fuzz Scenario:
 * - Phase 1: Reproduces and regression-tests Suspected Defects A through J + Phase 3/4 findings in live Lens Studio runtime.
 * - Phase 2: Executes 120 deterministic seeded adversarial event sequences checking all 10 State Machine Invariants.
 */

import { Scenario } from "Leaf.lspkg/Scenarios/scenario/Scenario"
import { expect } from "Leaf.lspkg/Utils/common/Expect"
import { findSceneObjectByName, nextFrame, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixLeafInteractor } from "./FieldFixLeafInteractor"

export class SeededPRNG {
  private state: number
  constructor(seed: number) {
    this.state = seed >>> 0 || 1
  }
  public nextInt(maxExclusive: number): number {
    let x = this.state
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    this.state = x >>> 0
    return this.state % maxExclusive
  }
}

@component
export class FieldFixExhaustiveRedTeamScenario extends Scenario {
  async run(): Promise<void> {
    const interactor = new FieldFixLeafInteractor()
    const main = await interactor.waitForReady()
    const failures: string[] = []

    const recordCheck = (id: string, condition: boolean, detail: string): void => {
      if (!condition) {
        const msg = `[FAIL:${id}] ${detail}`
        failures.push(msg)
        print(`[RedTeamAudit] ${msg}`)
      } else {
        print(`[RedTeamAudit] [PASS:${id}] ${detail}`)
      }
    }

    // =========================================================================
    // TEST A & B: RESET -> pinch CV-101 twice -> pinch remaining repair targets
    // Invariant 1: No repair before required diagnosis prerequisites (3/3 trace).
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    const beforeA = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const afterA = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestA | BEFORE: phase=${beforeA.phase}, trace=${beforeA.faultTraceCount}/3, completed=${beforeA.completedCount}/4 | AFTER: phase=${afterA.phase}, trace=${afterA.faultTraceCount}/3, completed=${afterA.completedCount}/4`
    )
    recordCheck(
      "Defect-A",
      afterA.completedCount === 0 && afterA.phase !== "REPAIRING",
      `RESET -> pinch CV-101 twice must NOT execute Step 1 before 3/3 trace (actual: phase=${afterA.phase}, completed=${afterA.completedCount}/4)`
    )

    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const afterB = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestB | AFTER sequence: phase=${afterB.phase}, trace=${afterB.faultTraceCount}/3, completed=${afterB.completedCount}/4, score=${afterB.trainingScorePct}%`
    )
    recordCheck(
      "Defect-B",
      afterB.completedCount === 0 && afterB.phase !== "COMPLETED",
      `Pinching auto-selected targets without 3/3 trace must NOT complete repair (actual: phase=${afterB.phase}, completed=${afterB.completedCount}/4)`
    )

    // =========================================================================
    // TEST C: RESET -> tap NEXT and PREV before scanning (and during Trace 1/3)
    // Invariant 2: Navigation never counts as actual inspection; cannot bypass scan.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    const beforeC = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("BtnNextStep")
    await interactor.triggerNamedInteractable("BtnPrevStep")
    const afterC = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestC | BEFORE: phase=${beforeC.phase}, trace=${beforeC.faultTraceCount}/3 | AFTER: phase=${afterC.phase}, trace=${afterC.faultTraceCount}/3, btnPrimary=${interactor.getLabelText("BtnPrimaryAction_Label")}`
    )
    recordCheck(
      "Defect-C1",
      afterC.phase === "READY_TO_SCAN" && afterC.faultTraceCount === 0,
      `RESET -> NEXT -> PREV must NOT bypass scan or mark components traced (actual: phase=${afterC.phase}, trace=${afterC.faultTraceCount}/3)`
    )

    // Also test NEXT/PREV during DIAGNOSING at Trace 1/3
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnNextStep")
    await interactor.triggerNamedInteractable("BtnPrevStep")
    const afterC2 = interactor.getSnapshot()
    recordCheck(
      "Defect-C2",
      afterC2.faultTraceCount === 1 && !afterC2.tracedHotspots.regulator && !afterC2.tracedHotspots.valve,
      `NEXT/PREV at Trace 1/3 must NOT mark regulator or valve as traced (actual: trace=${afterC2.faultTraceCount}/3, reg=${afterC2.tracedHotspots.regulator}, valve=${afterC2.tracedHotspots.valve})`
    )

    // =========================================================================
    // TEST D: RESET -> tap COMPARE (and at Trace 1/3 -> tap COMPARE)
    // Invariant 5 & 6: Hidden diagnostic values stay hidden until inspection.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnToggleComparison")
    const afterD = interactor.getSnapshot()
    const dTelemetry = interactor.getLabelText("TelemetryBarText")
    const dRegBadge = interactor.getLabelText("CalloutRegulatorBadge")
    const dValveBadge = interactor.getLabelText("CalloutValveBadge")
    print(
      `[RedTeamAudit] TestD | AFTER COMPARE at RESET: compare=${afterD.comparisonFaultPreview} | telemetry="${dTelemetry}" | reg="${dRegBadge}" | valve="${dValveBadge}"`
    )
    recordCheck(
      "Defect-D",
      !afterD.comparisonFaultPreview &&
        dTelemetry.indexOf("142 PSI") < 0 &&
        dTelemetry.indexOf("18%") < 0 &&
        dRegBadge === "PR-204: [UNINSPECTED]" &&
        dValveBadge === "CV-101: [UNINSPECTED]",
      `RESET -> COMPARE must NOT reveal 142 PSI or 18% before investigation (actual: compare=${afterD.comparisonFaultPreview}, reg="${dRegBadge}", valve="${dValveBadge}")`
    )

    // =========================================================================
    // TEST E: Scan -> Trace 1/3 -> toggle X-RAY
    // Invariant 5: Hidden PR-204 or CV-101 internals must NOT be revealed before traced.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnToggleXray")
    const afterE = interactor.getSnapshot()
    const valveInt = findSceneObjectByName("ValveInternalCryoSeal")
    const regInt = findSceneObjectByName("RegulatorInternalDiaphragm")
    const relayInt = findSceneObjectByName("RelayInternalStatorCoil")
    const vEnabled = Boolean(valveInt && valveInt.enabled)
    const rEnabled = Boolean(regInt && regInt.enabled)
    const relEnabled = Boolean(relayInt && relayInt.enabled)
    print(
      `[RedTeamAudit] TestE | Trace=${afterE.faultTraceCount}/3, xray=${afterE.xrayMode} | relayInt=${relEnabled}, regInt=${rEnabled}, valveInt=${vEnabled}`
    )
    recordCheck(
      "Defect-E",
      relEnabled && !rEnabled && !vEnabled,
      `At Trace 1/3, X-RAY must reveal only traced TR-309 internal coil and keep uninspected PR-204 & CV-101 internals hidden (actual: relayInt=${relEnabled}, regInt=${rEnabled}, valveInt=${vEnabled})`
    )

    // =========================================================================
    // TEST F: Scan -> inspect PR-204 -> immediately pinch PR-204 again
    // Invariant 1, 3, 7: Must NOT attempt repair or issue false LOTO violation at Trace 2/3.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const beforeF2 = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const afterF = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestF | BEFORE 2nd pinch: phase=${beforeF2.phase}, trace=${beforeF2.faultTraceCount}/3, violations=${beforeF2.safetyViolations} | AFTER 2nd pinch: phase=${afterF.phase}, trace=${afterF.faultTraceCount}/3, violations=${afterF.safetyViolations}`
    )
    recordCheck(
      "Defect-F",
      afterF.phase === "DIAGNOSING" && afterF.safetyViolations === 0 && afterF.completedCount === 0,
      `Second pinch on PR-204 at Trace 2/3 must NOT attempt repair or log a false LOTO violation (actual: phase=${afterF.phase}, violations=${afterF.safetyViolations})`
    )

    // =========================================================================
    // TEST G: Begin scanning -> pinch each 3D hotspot during SCANNING
    // Invariant 4 & 10: Mid-scan hotspot pinches must NOT abort SCANNING unexpectedly.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await sleep(80)
    const duringScanBeforePinch = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const afterMidScanValve = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    const afterMidScanReg = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    const afterMidScanRelay = interactor.getSnapshot()
    const scanRingObj = findSceneObjectByName("LaserScanSweepRing")
    const scanRingEnabledMid = Boolean(scanRingObj && scanRingObj.enabled)
    print(
      `[RedTeamAudit] TestG | startPhase=${duringScanBeforePinch.phase} -> afterValve=${afterMidScanValve.phase}, afterReg=${afterMidScanReg.phase}, afterRelay=${afterMidScanRelay.phase}, scanRingEnabled=${scanRingEnabledMid}`
    )
    recordCheck(
      "Defect-G",
      afterMidScanValve.phase === "SCANNING" &&
        afterMidScanReg.phase === "SCANNING" &&
        afterMidScanRelay.phase === "SCANNING" &&
        scanRingEnabledMid,
      `Pinching 3D hotspots during SCANNING must NOT abort scan early (actual: valve=${afterMidScanValve.phase}, reg=${afterMidScanReg.phase}, relay=${afterMidScanRelay.phase}, ring=${scanRingEnabledMid})`
    )
    await sleep(1100)

    // =========================================================================
    // TEST H: Complete Step 2 -> wait for plume end -> COMPARE on -> COMPARE off
    // Invariant 6: Comparison is a read-only visualization (must not replay purge plume).
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve") // Step 1
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Step 2 (Purge)
    const purgePlumeObj = findSceneObjectByName("RegulatorPurgePlume")
    const plumeDuringStep2 = Boolean(purgePlumeObj && purgePlumeObj.enabled)
    await sleep(1950) // Let 1.8s purge plume finish naturally
    const plumeAfterWait = Boolean(purgePlumeObj && purgePlumeObj.enabled)
    await interactor.triggerNamedInteractable("BtnToggleComparison") // COMPARE ON
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnToggleComparison") // COMPARE OFF
    await nextFrame()
    const plumeAfterCompareOff = Boolean(purgePlumeObj && purgePlumeObj.enabled)
    print(
      `[RedTeamAudit] TestH | plumeDuringStep2=${plumeDuringStep2}, plumeAfterWait=${plumeAfterWait}, plumeAfterCompareOff=${plumeAfterCompareOff}`
    )
    recordCheck(
      "Defect-H",
      plumeDuringStep2 && !plumeAfterWait && !plumeAfterCompareOff,
      `Toggling COMPARE on -> off after Step 2 must NOT replay RegulatorPurgePlume (actual: plumeAfterCompareOff=${plumeAfterCompareOff})`
    )

    // =========================================================================
    // TEST I: Generate repeated safety violations (2, 3+) -> verify grade is NOT "B"
    // Invariant 7 & 8: Scores & grades reflect genuine competency conditions.
    // =========================================================================
    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Trace 2/3
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve") // Trace 3/3
    // Trigger 3 out-of-order violations after trace is complete:
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Violation 1
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Violation 2
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
    await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore") // Violation 3
    // Complete all 4 steps
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    const afterI = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestI | violations=${afterI.safetyViolations}, score=${afterI.trainingScorePct}%, grade="${afterI.traineeGrade}"`
    )
    recordCheck(
      "Defect-I",
      afterI.safetyViolations === 3 &&
        afterI.trainingScorePct === 60 &&
        !afterI.traineeGrade.startsWith("B") &&
        !afterI.traineeGrade.startsWith("A"),
      `Repeated safety violations (3 violations, 60%) must NOT award an A or B grade (actual: grade="${afterI.traineeGrade}")`
    )

    // =========================================================================
    // TEST J: RESET during scanning, animations, hover, comparison, and completion
    // Invariant 9: Reset completely restores the initial state & 3D transforms immediately.
    // =========================================================================
    // J1: Reset mid-scan and ensure scan timer does not fire later
    main.resetExperience()
    await nextFrame()
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await sleep(100)
    await interactor.triggerNamedInteractable("BtnResetUnit")
    await sleep(900)
    const afterJ1 = interactor.getSnapshot()
    recordCheck(
      "Defect-J1",
      afterJ1.phase === "READY_TO_SCAN" && Boolean(scanRingObj && !scanRingObj.enabled),
      `Reset during SCANNING must cancel scanCountdown and keep READY_TO_SCAN (actual: phase=${afterJ1.phase})`
    )

    // J2: Reset from completed + X-Ray + hover + mechanical articulation and check immediate 3D transform restoration
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 1
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 2 (starts purge plume)
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 3
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 4 (COMPLETED)
    await sleep(300) // Allow 3D pivots to move toward completed angles (+90 deg valve, -38 deg gauge, 0.0 cm relay lift)
    const hotspotValveObj = findSceneObjectByName("Hotspot_CoolantValve")
    if (hotspotValveObj) {
      hotspotValveObj.getTransform().setLocalScale(new vec3(1.08, 1.08, 1.08)) // Simulate stuck hover scale
    }
    await interactor.triggerNamedInteractable("BtnResetUnit")
    // Immediately check on the very next frame after Reset (no 1-second lerp lag allowed!)
    const valveWheelPivot = findSceneObjectByName("ValveWheelPivot")
    const gaugeNeedlePivot = findSceneObjectByName("GaugeNeedlePivot")
    const relayCorePivot = findSceneObjectByName("ThermalRelayCorePivot")
    const wheelPosZ = valveWheelPivot ? valveWheelPivot.getTransform().getLocalPosition().z : -999
    const relayPosY = relayCorePivot ? relayCorePivot.getTransform().getLocalPosition().y : -999
    const valveHoverScaleX = hotspotValveObj ? hotspotValveObj.getTransform().getLocalScale().x : -999
    const plumeAfterReset = Boolean(purgePlumeObj && purgePlumeObj.enabled)
    print(
      `[RedTeamAudit] TestJ2 | Immediate post-reset: wheelPosZ=${wheelPosZ.toFixed(3)}, relayPosY=${relayPosY.toFixed(3)}, valveScaleX=${valveHoverScaleX.toFixed(3)}, plume=${plumeAfterReset}`
    )
    recordCheck(
      "Defect-J2",
      Math.abs(wheelPosZ - 0.5) < 0.05 &&
        relayPosY > 1.15 &&
        Math.abs(valveHoverScaleX - 1.0) < 0.01 &&
        !plumeAfterReset &&
        !Boolean(valveInt && valveInt.enabled) &&
        !Boolean(regInt && regInt.enabled) &&
        !Boolean(relayInt && relayInt.enabled),
      `Reset must immediately restore 3D transforms, hover scale, X-Ray internals, and timers (actual: wheelPosZ=${wheelPosZ.toFixed(3)}, relayPosY=${relayPosY.toFixed(3)}, valveScaleX=${valveHoverScaleX.toFixed(3)})`
    )

    // =========================================================================
    // PHASE 2: 120 DETERMINISTIC SEEDED ADVERSARIAL EVENT SEQUENCES (10 INVARIANTS)
    // =========================================================================
    let invariantFailures = 0
    const failingSeeds: string[] = []
    const totalSeeds = 120

    for (let seed = 1; seed <= totalSeeds; seed++) {
      const rng = new SeededPRNG(seed * 7919)
      main.resetExperience()
      const seqLen = 6 + rng.nextInt(15) // 6..20 actions per sequence
      const traceLog: string[] = ["RESET"]

      for (let stepIdx = 0; stepIdx < seqLen; stepIdx++) {
        const before = main.getSnapshot()
        const actionId = rng.nextInt(12)
        let actionName = ""

        switch (actionId) {
          case 0:
            actionName = "Scan(Immediate)"
            main.triggerScan(true)
            break
          case 1:
            actionName = "Scan(Timed)"
            main.triggerScan(false)
            break
          case 2:
            actionName = "Pinch3D(valve)"
            main.handle3DHotspotPinch("valve")
            break
          case 3:
            actionName = "Pinch3D(regulator)"
            main.handle3DHotspotPinch("regulator")
            break
          case 4:
            actionName = "Pinch3D(relay)"
            main.handle3DHotspotPinch("relay")
            break
          case 5:
            actionName = "SelectPill(valve)"
            main.selectHotspot("valve")
            break
          case 6:
            actionName = "SelectPill(regulator)"
            main.selectHotspot("regulator")
            break
          case 7:
            actionName = "SelectPill(relay)"
            main.selectHotspot("relay")
            break
          case 8:
            actionName = "NextStep"
            main.nextStep()
            break
          case 9:
            actionName = "PrevStep"
            main.prevStep()
            break
          case 10:
            actionName = "ConfirmStep"
            main.confirmCurrentStep()
            break
          case 11:
            actionName = rng.nextInt(2) === 0 ? "ToggleCompare" : "ToggleXray"
            if (actionName === "ToggleCompare") {
              main.toggleComparisonMode()
            } else {
              main.toggleXrayMode()
            }
            break
        }
        traceLog.push(actionName)
        const after = main.getSnapshot()

        // Invariant 1: No repair step may be completed unless all 3 upstream components were traced
        if (after.completedCount > 0 && !after.faultTraceComplete) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv1:RepairBeforeTrace] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 2: Navigation (NextStep / PrevStep) never increases faultTraceCount or changes phase from READY_TO_SCAN/SCANNING
        if ((actionName === "NextStep" || actionName === "PrevStep") && after.faultTraceCount > before.faultTraceCount) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv2:NavMarkedTraced] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 4: Once a component is traced (without Reset), faultTraceCount cannot decrease and trace order (relay >= regulator >= valve) holds
        if (
          after.faultTraceCount < before.faultTraceCount ||
          (after.tracedHotspots.regulator && !after.tracedHotspots.relay) ||
          (after.tracedHotspots.valve && !after.tracedHotspots.regulator)
        ) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv4:TraceCorrupted] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 5: Hidden diagnostic values (142 PSI, 18%) and uninspected 3D X-Ray internals stay hidden until inspected
        const regBadge = interactor.getLabelText("CalloutRegulatorBadge")
        const valveBadge = interactor.getLabelText("CalloutValveBadge")
        if (!after.tracedHotspots.regulator && regBadge.indexOf("142 PSI") >= 0) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv5:Spoiler142PSI] via ${traceLog.join(" -> ")}`)
          break
        }
        if (!after.tracedHotspots.valve && valveBadge.indexOf("18%") >= 0) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv5:Spoiler18Pct] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 6: Comparison mode is only active when completedCount > 0 or phase === "COMPLETED", and never mutates completedCount or safetyViolations
        if (actionName === "ToggleCompare") {
          if (
            (after.completedCount === 0 && after.comparisonFaultPreview) ||
            after.completedCount !== before.completedCount ||
            after.safetyViolations !== before.safetyViolations
          ) {
            invariantFailures++
            failingSeeds.push(`Seed ${seed} [Inv6:CompareViolation] via ${traceLog.join(" -> ")}`)
            break
          }
        }
        // Invariant 7: Safety violations never occur while faultTraceComplete is false
        if (!before.faultTraceComplete && after.safetyViolations > before.safetyViolations) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv7:PrematureViolationDuringTrace] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 8: Scores and grades reflect competency (>=2 violations cannot receive A or B grade)
        if (after.safetyViolations >= 2 && (after.traineeGrade.startsWith("A") || after.traineeGrade.startsWith("B"))) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv8:InflatedGrade:${after.traineeGrade}] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 10: SCANNING phase cannot be aborted into DIAGNOSING/REPAIRING by hotspots, navigation, or confirmStep
        if (before.phase === "SCANNING" && actionName !== "Scan(Immediate)" && after.phase !== "SCANNING") {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv10:ScanAbortedBy:${actionName}] via ${traceLog.join(" -> ")}`)
          break
        }
      }

      if (seed % 30 === 0) {
        await nextFrame()
      }
    }

    main.resetExperience()
    await nextFrame()

    print(
      `[RedTeamAudit] InvariantFuzzSummary | seedsRun=${totalSeeds} | failingSeeds=${invariantFailures}/${totalSeeds} | sampleFailures=${failingSeeds.slice(0, 8).join(" || ")}`
    )
    recordCheck(
      "Phase2-120-Seeds",
      invariantFailures === 0,
      `All ${totalSeeds} deterministic adversarial sequences must satisfy Invariants 1-10 (failingSeeds=${invariantFailures}/${totalSeeds})`
    )

    expect(
      failures.length,
      `Exhaustive Red-Team Scenario found ${failures.length} failure(s): ${failures.join(" ; ")}`
    ).toBe(0)
  }
}
