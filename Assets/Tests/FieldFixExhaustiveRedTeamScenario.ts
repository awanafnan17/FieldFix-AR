/**
 * FieldFixExhaustiveRedTeamScenario.ts
 * Hostile Red-Team LEAF Regression & State-Machine Invariant Fuzz Scenario:
 * - Phase 1: Reproduces and regression-tests Suspected Defects A through J, Phase 3/4 findings, and Stress Defects SO-01..SO-05 in live Lens Studio runtime.
 * - Phase 2: Executes 120 deterministic seeded adversarial event sequences checking all 12 State Machine Invariants.
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
    // Also verify selecting TR-309 during Trace 2/3 keeps currentStepIndex === 0 and keeps TR-309 halo crimson red
    main.selectHotspot("relay")
    const afterFRelay = interactor.getSnapshot()
    const relayHaloObj = findSceneObjectByName("RelayDiagnosticHalo")
    const relayHaloVis = relayHaloObj ? (relayHaloObj.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null) : null
    const redHaloRef = (main.equipmentMesh as any)?.haloMeshRed
    const relayHaloStaysRed = Boolean(relayHaloVis && redHaloRef && relayHaloVis.mesh === redHaloRef)
    print(
      `[RedTeamAudit] TestF | BEFORE 2nd pinch: phase=${beforeF2.phase}, stepIdx=${beforeF2.currentStepIndex}, trace=${beforeF2.faultTraceCount}/3, violations=${beforeF2.safetyViolations} | AFTER 2nd pinch: phase=${afterF.phase}, stepIdx=${afterF.currentStepIndex}, trace=${afterF.faultTraceCount}/3, violations=${afterF.safetyViolations}, relayHaloRed=${relayHaloStaysRed}`
    )
    recordCheck(
      "Defect-F",
      afterF.phase === "DIAGNOSING" &&
        afterF.safetyViolations === 0 &&
        afterF.completedCount === 0 &&
        beforeF2.currentStepIndex === 0 &&
        afterF.currentStepIndex === 0 &&
        afterFRelay.currentStepIndex === 0 &&
        relayHaloStaysRed,
      `Second pinch on PR-204 at Trace 2/3 must NOT attempt repair, mutate currentStepIndex, or turn TR-309 halo cyan (actual: phase=${afterF.phase}, stepIdx=${afterF.currentStepIndex}, violations=${afterF.safetyViolations}, relayHaloRed=${relayHaloStaysRed})`
    )

    // =========================================================================
    // TEST G & SO-05: Deterministic mid-scan & boundary hotspot interruption test
    // Tests both 0.75s and 1.2s scanDurationSec configurations across 5 repeated runs
    // using deterministic state-transition synchronization (Invariant 4 & 10).
    // =========================================================================
    const scanRingObj = findSceneObjectByName("LaserScanSweepRing")
    const savedScanDuration = main.scanDurationSec
    const scanConfigs = [0.75, 1.2, 0.75, 1.2, 0.75]
    let testGAllPassed = true
    const testGOutcomes: string[] = []

    for (let runIdx = 0; runIdx < scanConfigs.length; runIdx++) {
      const cfgSec = scanConfigs[runIdx]
      main.scanDurationSec = cfgSec
      main.resetExperience()
      await nextFrame()
      await interactor.triggerNamedInteractable("BtnPrimaryAction")
      // 1. Early & mid-scan SIK hotspot interruption checks (~180ms each via DefaultLeafInteractor.trigger)
      const earlySnap = interactor.getSnapshot()
      await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
      const afterMidValve = interactor.getSnapshot()
      await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
      const afterMidReg = interactor.getSnapshot()
      await interactor.triggerNamedInteractable("Hotspot_ThermalRelayCore")
      const afterMidRelay = interactor.getSnapshot()
      const ringMidEnabled = Boolean(scanRingObj && scanRingObj.enabled)

      // 2. Boundary interruption check (~75-80% into scan duration, before countdown expires)
      if (cfgSec > 1.0) {
        await sleep(320)
      }
      const boundaryBeforePinch = interactor.getSnapshot()
      main.handle3DHotspotPinch("valve")
      main.nextStep()
      main.prevStep()
      main.confirmCurrentStep()
      const boundaryAfterPinch = interactor.getSnapshot()

      // 3. Deterministically synchronize with actual transition out of SCANNING -> DIAGNOSING
      let waitedMs = 0
      while (interactor.getSnapshot().phase === "SCANNING" && waitedMs < 1200) {
        await sleep(40)
        waitedMs += 40
      }
      const completedScanSnap = interactor.getSnapshot()
      const ringAfterScanDisabled = Boolean(scanRingObj && !scanRingObj.enabled)

      const runPass =
        earlySnap.phase === "SCANNING" &&
        afterMidValve.phase === "SCANNING" &&
        afterMidReg.phase === "SCANNING" &&
        afterMidRelay.phase === "SCANNING" &&
        ringMidEnabled &&
        boundaryBeforePinch.phase === "SCANNING" &&
        boundaryAfterPinch.phase === "SCANNING" &&
        completedScanSnap.phase === "DIAGNOSING" &&
        completedScanSnap.faultTraceCount === 1 &&
        ringAfterScanDisabled

      if (!runPass) {
        testGAllPassed = false
      }
      testGOutcomes.push(
        `run${runIdx + 1}(${cfgSec}s):${runPass ? "PASS" : "FAIL"}[mid=${afterMidRelay.phase},bnd=${boundaryAfterPinch.phase},end=${completedScanSnap.phase}]`
      )
    }
    main.scanDurationSec = savedScanDuration
    print(`[RedTeamAudit] TestG_SO05 | outcomes=${testGOutcomes.join(" | ")}`)
    recordCheck(
      "Defect-G",
      testGAllPassed,
      `All 5 deterministic scan runs (0.75s & 1.2s + boundary interruptions) must keep SCANNING until completion (outcomes: ${testGOutcomes.join(", ")})`
    )

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
    // Invariant 9: Reset completely restores the initial state & 3D transforms immediately,
    // while blocked button presses during standby preserve active hover scale (Defect J).
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

    // J2: Verify active hover scale in READY_TO_SCAN is preserved across blocked standby button clicks,
    // and then immediately restored to 1.0 upon Reset from completed + X-Ray + hover + mechanical articulation.
    const hotspotValveObj = findSceneObjectByName("Hotspot_CoolantValve")
    if (hotspotValveObj) {
      hotspotValveObj.getTransform().setLocalScale(new vec3(1.08, 1.08, 1.08))
    }
    main.nextStep()
    main.prevStep()
    main.toggleComparisonMode()
    const hoverScaleDuringStandbyBlock = hotspotValveObj ? hotspotValveObj.getTransform().getLocalScale().x : -999

    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator")
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 1
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 2 (starts purge plume)
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 3
    await interactor.triggerNamedInteractable("BtnPrimaryAction") // Step 4 (COMPLETED)
    await sleep(300) // Allow 3D pivots to move toward completed angles (+90 deg valve, -38 deg gauge, 0.0 cm relay lift)
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
      `[RedTeamAudit] TestJ2 | hoverStandbyPreserved=${hoverScaleDuringStandbyBlock.toFixed(3)} | Immediate post-reset: wheelPosZ=${wheelPosZ.toFixed(3)}, relayPosY=${relayPosY.toFixed(3)}, valveScaleX=${valveHoverScaleX.toFixed(3)}, plume=${plumeAfterReset}`
    )
    recordCheck(
      "Defect-J2",
      Math.abs(hoverScaleDuringStandbyBlock - 1.08) < 0.01 &&
        Math.abs(wheelPosZ - 0.5) < 0.05 &&
        relayPosY > 1.15 &&
        Math.abs(valveHoverScaleX - 1.0) < 0.01 &&
        !plumeAfterReset &&
        !Boolean(valveInt && valveInt.enabled) &&
        !Boolean(regInt && regInt.enabled) &&
        !Boolean(relayInt && relayInt.enabled),
      `Standby blocked clicks must preserve 1.08x hover scale while Reset immediately restores 1.0x hover scale, 3D transforms, X-Ray internals, and timers (actual: standbyHover=${hoverScaleDuringStandbyBlock.toFixed(3)}, wheelPosZ=${wheelPosZ.toFixed(3)}, relayPosY=${relayPosY.toFixed(3)}, valveScaleX=${valveHoverScaleX.toFixed(3)})`
    )

    // =========================================================================
    // THIRD-ORDER STRESS DEFECT REGRESSION TESTS (SO-01, SO-02, SO-03, SO-04, F-04, F-11, PRES-02)
    // =========================================================================

    // SO-01: Repeated CV-101 pinch after LOTO must NOT jump to Step 4 or log a false safety violation
    main.resetExperience()
    await nextFrame()
    // Also verify F-04 (selecting uninspected PR-204 from standby gives accurate PR-204 instruction) and F-11 (no advisory penalty on standby entry)
    const standbyRegSnap = main.selectHotspot("regulator")
    const f04StepInstruction = interactor.getLabelText("StepInstructionText")
    const f04AndF11Pass =
      standbyRegSnap.advisoryCount === 0 &&
      f04StepInstruction.indexOf("Confirm [TR-309] overheat symptom first") >= 0 &&
      f04StepInstruction.indexOf("before inspecting [CV-101]") < 0
    recordCheck(
      "Defect-F04-F11",
      f04AndF11Pass,
      `Standby regulator selection must not increment advisoryCount (${standbyRegSnap.advisoryCount}) and must display accurate PR-204 instruction ("${f04StepInstruction}")`
    )

    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Trace 2/3
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve") // Trace 3/3
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve") // Execute Step 1 (CV-101 LOTO)
    const afterStep1Loto = interactor.getSnapshot()
    // Pinch CV-101 twice again after LOTO:
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const afterRepeatPinch1 = interactor.getSnapshot()
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve")
    const afterRepeatPinch2 = interactor.getSnapshot()
    const so01Warning = interactor.getLabelText("SafetyWarningText")
    print(
      `[RedTeamAudit] TestSO01 | step1Done=${afterStep1Loto.completedSteps[0]} | pinch1: stepIdx=${afterRepeatPinch1.currentStepIndex}, violations=${afterRepeatPinch1.safetyViolations} | pinch2: stepIdx=${afterRepeatPinch2.currentStepIndex}, violations=${afterRepeatPinch2.safetyViolations} | feedback="${so01Warning}"`
    )
    recordCheck(
      "Stress-SO-01",
      afterRepeatPinch1.currentStepIndex === 1 &&
        afterRepeatPinch2.currentStepIndex === 1 &&
        afterRepeatPinch1.safetyViolations === 0 &&
        afterRepeatPinch2.safetyViolations === 0 &&
        afterRepeatPinch2.completedCount === 1 &&
        so01Warning.indexOf("LOTO VERIFIED [CV-101]") >= 0,
      `Repeated CV-101 pinches after Step 1 LOTO must stay on Step 2 (index 1) with 0 violations and LOTO VERIFIED feedback (actual: stepIdx=${afterRepeatPinch2.currentStepIndex}, violations=${afterRepeatPinch2.safetyViolations}, feedback="${so01Warning}")`
    )

    // SO-03: Rapid double-tap on BtnPrimaryAction must NOT execute two different repair steps back-to-back
    main.resetExperience()
    await nextFrame()
    main.triggerScan(true)
    await nextFrame()
    await interactor.triggerNamedInteractable("Hotspot_PressureRegulator") // Trace 2/3
    await interactor.triggerNamedInteractable("Hotspot_CoolantValve") // Trace 3/3
    // Fire two rapid consecutive primary button taps without the 130ms inter-step pause:
    await interactor.triggerNamedInteractable("BtnPrimaryAction", true)
    await interactor.triggerNamedInteractable("BtnPrimaryAction", true)
    const afterRapidDoubleTap = interactor.getSnapshot()
    // Now wait 140ms and perform a deliberate tap for Step 2:
    await sleep(140)
    await interactor.triggerNamedInteractable("BtnPrimaryAction", true)
    const afterDeliberateTap = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestSO03 | afterRapidDoubleTap=${afterRapidDoubleTap.completedCount}/4 (step=${afterRapidDoubleTap.currentStep.stepNumber}/4) | afterDeliberateTap=${afterDeliberateTap.completedCount}/4`
    )
    recordCheck(
      "Stress-SO-03",
      afterRapidDoubleTap.completedCount === 1 &&
        afterRapidDoubleTap.currentStepIndex === 1 &&
        afterDeliberateTap.completedCount === 2,
      `Rapid double-tap on BtnPrimaryAction must execute only Step 1 (actual=${afterRapidDoubleTap.completedCount}), while deliberate tap after 140ms executes Step 2 (actual=${afterDeliberateTap.completedCount})`
    )

    // SO-02: Selecting repaired/LOTO components during REPAIRING must show current repaired status, never stale TRACE [1/3] or [2/3]
    // Currently at 2/4 DONE (Step 1 CV-101 LOTO + Step 2 PR-204 purged to 38 PSI)
    await interactor.triggerNamedInteractable("BtnHotspotRegulator")
    const so02RegSnap = interactor.getSnapshot()
    const so02RegWarning = interactor.getLabelText("SafetyWarningText")
    const so02RegTitle = interactor.getLabelText("ComponentTitleText")
    await interactor.triggerNamedInteractable("BtnHotspotValve")
    const so02ValveWarning = interactor.getLabelText("SafetyWarningText")
    await interactor.triggerNamedInteractable("BtnHotspotRelay")
    const so02RelayActiveWarning = interactor.getLabelText("SafetyWarningText")
    // Execute Step 3 (TR-309 reseated to 46C) and re-select TR-309:
    await interactor.triggerNamedInteractable("BtnPrimaryAction")
    await interactor.triggerNamedInteractable("BtnHotspotRelay")
    const so02RelayRepairedWarning = interactor.getLabelText("SafetyWarningText")
    print(
      `[RedTeamAudit] TestSO02 | regWarning="${so02RegWarning}" | valveWarning="${so02ValveWarning}" | relayActive="${so02RelayActiveWarning}" | relayRepaired="${so02RelayRepairedWarning}"`
    )
    recordCheck(
      "Stress-SO-02",
      so02RegSnap.systemPressurePsi === 38 &&
        so02RegTitle.indexOf("NOMINAL: REGULATOR AT 38 PSI") >= 0 &&
        so02RegWarning.indexOf("REPAIRED [PR-204]") >= 0 &&
        so02RegWarning.indexOf("TRACE [") < 0 &&
        so02ValveWarning.indexOf("LOTO VERIFIED [CV-101]") >= 0 &&
        so02ValveWarning.indexOf("TRACE [") < 0 &&
        so02RelayActiveWarning.indexOf("ACTIVE TARGET [TR-309]") >= 0 &&
        so02RelayActiveWarning.indexOf("TRACE [") < 0 &&
        so02RelayRepairedWarning.indexOf("REPAIRED [TR-309]") >= 0 &&
        so02RelayRepairedWarning.indexOf("TRACE [") < 0,
      `Inspecting components during REPAIRING must display current repaired/LOTO/active status without stale TRACE [1/3] or [2/3] strings`
    )

    // SO-04: Comparison mode at 3/4 DONE must be strictly read-only (no [PINCH: LOTO/PURGE/RESEAT] badges, primary button exits compare)
    await interactor.triggerNamedInteractable("BtnToggleComparison") // COMPARE ON at 3/4 DONE
    const so04Snap = interactor.getSnapshot()
    const so04ValveBadge = interactor.getLabelText("CalloutValveBadge")
    const so04RegBadge = interactor.getLabelText("CalloutRegulatorBadge")
    const so04RelayBadge = interactor.getLabelText("CalloutRelayBadge")
    const so04StepHeader = interactor.getLabelText("StepHeaderText")
    const so04BtnLabel = interactor.getLabelText("BtnPrimaryAction_Label")
    // Verify pinching 3D hotspot in comparison mode does NOT execute Step 4, and clicking BtnPrimaryAction exits comparison mode without executing Step 4:
    await interactor.triggerNamedInteractable("BtnPrimaryAction", true)
    const afterSo04ExitCompare = interactor.getSnapshot()
    print(
      `[RedTeamAudit] TestSO04 | valveBadge="${so04ValveBadge}" | regBadge="${so04RegBadge}" | relayBadge="${so04RelayBadge}" | header="${so04StepHeader}" | btn="${so04BtnLabel}" | afterPrimaryExitCompare: compare=${afterSo04ExitCompare.comparisonFaultPreview}, completed=${afterSo04ExitCompare.completedCount}/4`
    )
    recordCheck(
      "Stress-SO-04",
      so04Snap.comparisonFaultPreview === true &&
        so04ValveBadge === "CV-101: 18% FLOW [CAVITATION]" &&
        so04RegBadge === "PR-204: 142 PSI [142 PSI BLOCK]" &&
        so04RelayBadge === "TR-309: 118C [OVERHEAT]" &&
        so04StepHeader === "COMPARE MODE: INITIAL FAULT SNAPSHOT (READ-ONLY)" &&
        so04BtnLabel === "EXIT COMPARE TO RESUME REPAIR" &&
        afterSo04ExitCompare.comparisonFaultPreview === false &&
        afterSo04ExitCompare.completedCount === 3,
      `Comparison mode at 3/4 DONE must show read-only fault badges without [PINCH: LOTO/PURGE/RESEAT] and exit comparison before executing Step 4`
    )

    // PRES-02: Verify actual runtime SceneObject identifiers match documented names
    const chevronObj = findSceneObjectByName("ActiveStepTargetChevron")
    let allPulseRingsFound = true
    for (let ringIdx = 0; ringIdx < 6; ringIdx++) {
      if (!findSceneObjectByName(`CoolantFlowPulseRing_${ringIdx}`)) {
        allPulseRingsFound = false
      }
    }
    recordCheck(
      "PRES-02-SceneObjectNames",
      chevronObj !== null && allPulseRingsFound,
      `Runtime SceneObjects ActiveStepTargetChevron and CoolantFlowPulseRing_0..5 must exist in scene`
    )

    // =========================================================================
    // PHASE 2: 120 DETERMINISTIC SEEDED ADVERSARIAL EVENT SEQUENCES (INVARIANTS 1-12)
    // Covers M1-M8 mutations including sequential steps (M4), mid-sequence Reset (M6),
    // repeated completed-component pinches (M7 / SO-01), and rapid double-taps (M8 / SO-03).
    // =========================================================================
    let invariantFailures = 0
    const failingSeeds: string[] = []
    const totalSeeds = 120
    main.verboseLogging = false

    for (let seed = 1; seed <= totalSeeds; seed++) {
      const rng = new SeededPRNG(seed * 7919)
      main.resetExperience()
      const seqLen = 8 + rng.nextInt(15) // 8..22 actions per sequence
      const traceLog: string[] = ["RESET"]

      for (let stepIdx = 0; stepIdx < seqLen; stepIdx++) {
        const before = main.getSnapshot()
        const isFinalResetStep = stepIdx === seqLen - 1
        const actionId = isFinalResetStep ? 14 : rng.nextInt(14)
        let actionName = ""
        let rapidDoubleDelta = 0

        // Simulate 350ms of elapsed time between distinct fuzzer steps so deliberate single actions are not debounced,
        // while actionId === 12 ("RapidDoubleConfirm") tests sub-240ms back-to-back double taps!
        ;(main as any).lastConfirmStepTimeSec -= 0.35

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
            if (rng.nextInt(2) === 0) {
              actionName = "NextStep"
              main.nextStep()
            } else {
              actionName = "NextStep+Confirm"
              main.nextStep()
              ;(main as any).lastConfirmStepTimeSec -= 0.35
              main.confirmCurrentStep()
            }
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
          case 12: {
            actionName = "RapidDoubleConfirm"
            const c0 = main.getSnapshot().completedCount
            main.confirmCurrentStep()
            main.confirmCurrentStep()
            const c1 = main.getSnapshot().completedCount
            rapidDoubleDelta = c1 - c0
            break
          }
          case 13: {
            actionName = "RepeatValvePinch"
            main.handle3DHotspotPinch("valve")
            main.handle3DHotspotPinch("valve")
            break
          }
          case 14: {
            actionName = "ResetMidSequence"
            if (hotspotValveObj) {
              hotspotValveObj.getTransform().setLocalScale(new vec3(1.08, 1.08, 1.08))
            }
            if (valveWheelPivot) {
              valveWheelPivot.getTransform().setLocalPosition(new vec3(0, 0, 1.25))
            }
            main.resetExperience()
            break
          }
        }
        traceLog.push(actionName)
        const after = main.getSnapshot()

        // Invariant 1 (M1): No repair step may be completed unless all 3 upstream components were traced
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
        // Invariant 3 (M4): Strict sequential LOTO repair order (Step i cannot be completed while Step i-1 is incomplete)
        if (
          (after.completedSteps[1] && !after.completedSteps[0]) ||
          (after.completedSteps[2] && !after.completedSteps[1]) ||
          (after.completedSteps[3] && !after.completedSteps[2])
        ) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv3:OutOfOrderStepCompleted] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 4: Once a component is traced (without Reset), faultTraceCount cannot decrease and trace order (relay >= regulator >= valve) holds
        if (
          (actionName !== "ResetMidSequence" && after.faultTraceCount < before.faultTraceCount) ||
          (after.tracedHotspots.regulator && !after.tracedHotspots.relay) ||
          (after.tracedHotspots.valve && !after.tracedHotspots.regulator)
        ) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv4:TraceCorrupted] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 5 (M2 & M3): Hidden diagnostic values (142 PSI, 18%) and uninspected 3D X-Ray internals stay hidden until inspected
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
        if (
          (!after.tracedHotspots.valve &&
            after.completedCount === 0 &&
            !after.comparisonFaultPreview &&
            after.phase !== "SCANNING" &&
            Boolean(valveInt && valveInt.enabled)) ||
          (!after.tracedHotspots.regulator &&
            after.completedCount === 0 &&
            !after.comparisonFaultPreview &&
            after.phase !== "SCANNING" &&
            Boolean(regInt && regInt.enabled))
        ) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv5:XrayInternalSpoiler] via ${traceLog.join(" -> ")}`)
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
        if (actionName !== "ResetMidSequence" && !before.faultTraceComplete && after.safetyViolations > before.safetyViolations) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv7:PrematureViolationDuringTrace] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 8 (M5): Scores and grades reflect competency (>=2 violations cannot receive A or B grade)
        if (after.safetyViolations >= 2 && (after.traineeGrade.startsWith("A") || after.traineeGrade.startsWith("B"))) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv8:InflatedGrade:${after.traineeGrade}] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 9 (M6): ResetMidSequence immediately restores phase, telemetry, 3D mechanical transforms, hover scale, and plume
        if (actionName === "ResetMidSequence") {
          const wZ = valveWheelPivot ? valveWheelPivot.getTransform().getLocalPosition().z : -999
          const hScale = hotspotValveObj ? hotspotValveObj.getTransform().getLocalScale().x : -999
          if (
            after.phase !== "READY_TO_SCAN" ||
            after.completedCount !== 0 ||
            after.faultTraceCount !== 0 ||
            Math.abs(wZ - 0.5) >= 0.05 ||
            Math.abs(hScale - 1.0) >= 0.01 ||
            Boolean(purgePlumeObj && purgePlumeObj.enabled)
          ) {
            invariantFailures++
            failingSeeds.push(
              `Seed ${seed} [Inv9:ResetIncomplete:wZ=${wZ.toFixed(2)},hScale=${hScale.toFixed(2)}] via ${traceLog.join(" -> ")}`
            )
            break
          }
        }
        // Invariant 10: SCANNING phase cannot be aborted into DIAGNOSING/REPAIRING by hotspots, navigation, or confirmStep
        if (
          before.phase === "SCANNING" &&
          actionName !== "Scan(Immediate)" &&
          actionName !== "ResetMidSequence" &&
          after.phase !== "SCANNING"
        ) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv10:ScanAbortedBy:${actionName}] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 11 (M8 / SO-03): RapidDoubleConfirm must never execute more than 1 repair step in a single unacknowledged burst
        if (actionName === "RapidDoubleConfirm" && rapidDoubleDelta > 1) {
          invariantFailures++
          failingSeeds.push(`Seed ${seed} [Inv11:RapidDoubleConfirmExecuted:${rapidDoubleDelta}] via ${traceLog.join(" -> ")}`)
          break
        }
        // Invariant 12 (M7 / SO-01): Selecting/pinching CV-101 after Step 1 LOTO while Steps 2 or 3 are incomplete must not jump to Step 4 or log a safety violation
        if (
          (actionName === "Pinch3D(valve)" || actionName === "SelectPill(valve)" || actionName === "RepeatValvePinch") &&
          before.completedSteps[0] &&
          (!before.completedSteps[1] || !before.completedSteps[2])
        ) {
          if (after.currentStepIndex === 3 || after.safetyViolations > before.safetyViolations) {
            invariantFailures++
            failingSeeds.push(
              `Seed ${seed} [Inv12:CompletedValveJumpedToStep4:stepIdx=${after.currentStepIndex},viol=${after.safetyViolations}] via ${traceLog.join(" -> ")}`
            )
            break
          }
        }
      }

      if (seed % 10 === 0) {
        await nextFrame()
      }
    }

    main.verboseLogging = true
    main.resetExperience()
    await nextFrame()

    print(
      `[RedTeamAudit] InvariantFuzzSummary | seedsRun=${totalSeeds} | failingSeeds=${invariantFailures}/${totalSeeds} | sampleFailures=${failingSeeds.slice(0, 8).join(" || ")}`
    )
    recordCheck(
      "Phase2-120-Seeds",
      invariantFailures === 0,
      `All ${totalSeeds} deterministic adversarial sequences must satisfy Invariants 1-12 (failingSeeds=${invariantFailures}/${totalSeeds})`
    )

    expect(
      failures.length,
      `Exhaustive Red-Team Scenario found ${failures.length} failure(s): ${failures.join(" ; ")}`
    ).toBe(0)
  }
}
