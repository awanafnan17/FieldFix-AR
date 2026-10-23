/**
 * FieldFixState.ts
 * Domain state machine, telemetry definitions, component hotspot profiles,
 * 4-step guided repair sequence, LOTO safety interlock, X-Ray inspection state,
 * and Before/After comparison telemetry for FieldFix AR.
 */

export type DiagnosticPhase =
  | "READY_TO_SCAN"
  | "SCANNING"
  | "DIAGNOSING"
  | "REPAIRING"
  | "COMPLETED"

export type HotspotId = "valve" | "regulator" | "relay"

export type FaultSeverity = "nominal" | "warning" | "fault" | "critical"

export interface ComponentDiagnosticInfo {
  id: HotspotId
  name: string
  shortName: string
  subsystemCode: string
  faultStatusLabel: string
  nominalStatusLabel: string
  initialSeverity: FaultSeverity
  faultTelemetry: string
  nominalTelemetry: string
  rootCause: string
  xrayInternalSummary: string
  lockedOutSummary?: string
  repairedSummary: string
  safetyCallout: string
}

export interface RepairStepInfo {
  stepIndex: number // 0..3
  stepNumber: number // 1..4
  targetHotspot: HotspotId
  title: string
  actionInstruction: string
  safetyWarning: string
  verificationMetric: string
  confirmButtonLabel: string
  interlockReason: string
}

export interface FieldFixUISnapshot {
  phase: DiagnosticPhase
  selectedHotspot: HotspotId
  selectedComponent: ComponentDiagnosticInfo
  currentStepIndex: number
  currentStep: RepairStepInfo
  completedSteps: boolean[]
  completedCount: number
  totalSteps: number
  systemTempC: number
  systemPressurePsi: number
  coolantFlowPct: number
  headerBadgeText: string
  headerSeverity: FaultSeverity
  statusSummaryText: string
  canConfirmCurrentStep: boolean
  isCurrentStepDone: boolean
  xrayMode: boolean
  comparisonFaultPreview: boolean
  safetyViolations: number
  advisoryCount: number
  trainingScorePct: number
  traineeGrade: string
  activeFeedbackText: string
  activeFeedbackSeverity: FaultSeverity
  interlockFlashHotspot: HotspotId | null
}

export const HOTSPOT_CATALOG: Record<HotspotId, ComponentDiagnosticInfo> = {
  valve: {
    id: "valve",
    name: "Primary Coolant Isolation Valve",
    shortName: "VALVE",
    subsystemCode: "CV-101",
    faultStatusLabel: "WARN: FLOW RESTRICTED (18%)",
    nominalStatusLabel: "NOMINAL: 100% BALANCED FLOW",
    initialSeverity: "warning",
    faultTelemetry: "FLOW: 18% | INTAKE: 68C",
    nominalTelemetry: "FLOW: 100% | INTAKE: 39C",
    rootCause: "Simulated intake cavitation & bypass restriction starving the relay cooling jacket.",
    xrayInternalSummary:
      "X-RAY CUTAWAY [CV-101]: Internal cryo-ball seal & intake venturi exposed — cavitation micro-vortices visible across seat ring.",
    lockedOutSummary: "Simulated LOTO clasp engaged; intake line isolated (0% flow) for safe downstream bleed.",
    repairedSummary: "Simulated cryo-coolant flow restored to 100% balanced flow across manifold jacket.",
    safetyCallout: "TRAINING RULE: Close isolation valve 90 deg and apply LOTO clasp before bleeding pressure."
  },
  regulator: {
    id: "regulator",
    name: "High-Pressure Bypass Regulator",
    shortName: "REGULATOR",
    subsystemCode: "PR-204",
    faultStatusLabel: "FAULT: OVER-PRESSURE (142 PSI)",
    nominalStatusLabel: "NOMINAL: REGULATED (45 PSI)",
    initialSeverity: "fault",
    faultTelemetry: "LINE: 142 PSI | LIMIT: 65 PSI",
    nominalTelemetry: "LINE: 45 PSI | LIMIT: 65 PSI",
    rootCause: "Simulated vapor lock spike trapped upstream of thermal relay manifold.",
    xrayInternalSummary:
      "X-RAY CUTAWAY [PR-204]: Internal relief spring & diaphragm spool exposed — 142 PSI vapor pocket compressing upper bellows.",
    repairedSummary: "Simulated bypass relief purge complete; manifold pressure regulated at 38-45 PSI.",
    safetyCallout: "TRAINING WARNING: Purge bypass vent slowly to 38 PSI before unseating relay core."
  },
  relay: {
    id: "relay",
    name: "Thermal Relay Core Assembly",
    shortName: "RELAY CORE",
    subsystemCode: "TR-309",
    faultStatusLabel: "CRITICAL: CORE OVERHEAT (118C)",
    nominalStatusLabel: "NOMINAL: CORE STABLE (42C)",
    initialSeverity: "critical",
    faultTelemetry: "CORE: 118C | TRIP: 105C",
    nominalTelemetry: "CORE: 42C | TRIP: 105C",
    rootCause: "Simulated thermal latch tripped due to coolant starvation; requires core reseat.",
    xrayInternalSummary:
      "X-RAY CUTAWAY [TR-309]: Internal copper stator windings & bimetallic trip plunger lifted +1.35 cm above cooling sleeve.",
    repairedSummary: "Simulated thermal relay plunger reseated and latch locked; core cooled to nominal range.",
    safetyCallout: "THERMAL TRAINING HAZARD: Complete Steps 1 & 2 before reseating relay core."
  }
}

export const REPAIR_STEPS: RepairStepInfo[] = [
  {
    stepIndex: 0,
    stepNumber: 1,
    targetHotspot: "valve",
    title: "STEP 1/4: LOCKOUT ISOLATION VALVE",
    actionInstruction: "Rotate Primary Coolant Valve CV-101 90 deg clockwise to isolate intake line.",
    safetyWarning: "SAFETY: Verify LOTO tag & hand clearance on intake wheel.",
    verificationMetric: "Target: Valve Closed (0% Intake, Line Isolated)",
    confirmButtonLabel: "EXECUTE STEP 1: LOCK VALVE",
    interlockReason: "Step 1 is the initial LOTO isolation step."
  },
  {
    stepIndex: 1,
    stepNumber: 2,
    targetHotspot: "regulator",
    title: "STEP 2/4: PURGE BYPASS REGULATOR",
    actionInstruction: "Open Regulator PR-204 relief vent to bleed trapped pressure from 142 PSI to 38 PSI.",
    safetyWarning: "SAFETY: Stand clear of upward relief vent plume.",
    verificationMetric: "Target: Manifold Pressure <= 40 PSI",
    confirmButtonLabel: "EXECUTE STEP 2: PURGE PSI",
    interlockReason: "Cannot bleed PR-204 Regulator while CV-101 Intake Valve is un-isolated (LOTO Step 1 required)."
  },
  {
    stepIndex: 2,
    stepNumber: 3,
    targetHotspot: "relay",
    title: "STEP 3/4: RESEAT THERMAL RELAY CORE",
    actionInstruction: "Disengage tripped thermal latch on TR-309, reseat core cylinder, and flush cooling jacket.",
    safetyWarning: "SAFETY: Confirm pressure bleed complete before unlatching core.",
    verificationMetric: "Target: Core Temp < 50C & Latch Seated",
    confirmButtonLabel: "EXECUTE STEP 3: RESEAT CORE",
    interlockReason: "HIGH-PRESSURE / THERMAL HAZARD: Cannot unlatch TR-309 at 142 PSI! Complete LOTO & Purge first."
  },
  {
    stepIndex: 3,
    stepNumber: 4,
    targetHotspot: "valve",
    title: "STEP 4/4: RE-PRESSURIZE & VERIFY",
    actionInstruction: "Re-open Coolant Valve CV-101 and verify balanced 100% flow across all subsystems.",
    safetyWarning: "SAFETY: Monitor gauge stability at 45 PSI nominal.",
    verificationMetric: "Target: 42C | 45 PSI | 100% Nominal Flow",
    confirmButtonLabel: "EXECUTE STEP 4: VERIFY FLOW",
    interlockReason: "Cannot re-pressurize CV-101 before PR-204 purge and TR-309 core reseat are verified."
  }
]

export class FieldFixStateMachine {
  private _phase: DiagnosticPhase = "READY_TO_SCAN"
  private _selectedHotspot: HotspotId = "relay"
  private _currentStepIndex: number = 0
  private _completedSteps: boolean[] = [false, false, false, false]
  private _xrayMode: boolean = false
  private _comparisonFaultPreview: boolean = false
  private _safetyViolations: number = 0
  private _advisoryCount: number = 0
  private _activeFeedbackText: string =
    "STANDBY: Pinch [SCAN EQUIPMENT TELEMETRY] or any 3D component to begin spatial inspection."
  private _activeFeedbackSeverity: FaultSeverity = "warning"
  private _interlockFlashHotspot: HotspotId | null = null

  public get phase(): DiagnosticPhase {
    return this._phase
  }

  public get selectedHotspot(): HotspotId {
    return this._selectedHotspot
  }

  public get currentStepIndex(): number {
    return this._currentStepIndex
  }

  public get completedSteps(): ReadonlyArray<boolean> {
    return this._completedSteps
  }

  public get xrayMode(): boolean {
    return this._xrayMode
  }

  public get comparisonFaultPreview(): boolean {
    return this._comparisonFaultPreview
  }

  public get safetyViolations(): number {
    return this._safetyViolations
  }

  private getFirstIncompleteStepIndex(): number {
    for (let i = 0; i < this._completedSteps.length; i++) {
      if (!this._completedSteps[i]) return i
    }
    return -1
  }

  public reset(): FieldFixUISnapshot {
    this._phase = "READY_TO_SCAN"
    this._selectedHotspot = "relay"
    this._currentStepIndex = 0
    this._completedSteps = [false, false, false, false]
    this._xrayMode = false
    this._comparisonFaultPreview = false
    this._safetyViolations = 0
    this._advisoryCount = 0
    this._interlockFlashHotspot = null
    this._activeFeedbackText =
      "STANDBY: Pinch [SCAN EQUIPMENT TELEMETRY] or any 3D component to begin spatial inspection."
    this._activeFeedbackSeverity = "warning"
    return this.getSnapshot()
  }

  public startScan(): FieldFixUISnapshot {
    this._phase = "SCANNING"
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null
    this._activeFeedbackText =
      "ACTIVE TELEMETRY SWEEP: Localizing thermal, pressure, and cavitation faults across Unit #04..."
    this._activeFeedbackSeverity = "warning"
    return this.getSnapshot()
  }

  public completeScan(): FieldFixUISnapshot {
    this._phase = "DIAGNOSING"
    this._selectedHotspot = "relay"
    this._currentStepIndex = 0
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null
    this._activeFeedbackText =
      "DIAGNOSTIC LOCK: 3 faults localized. Begin Step 1/4 on CV-101 Isolation Valve (LOTO required)."
    this._activeFeedbackSeverity = "critical"
    return this.getSnapshot()
  }

  public toggleXrayMode(): FieldFixUISnapshot {
    this._xrayMode = !this._xrayMode
    const comp = HOTSPOT_CATALOG[this._selectedHotspot]
    if (this._xrayMode) {
      this._activeFeedbackText = comp.xrayInternalSummary
      this._activeFeedbackSeverity = "warning"
    } else {
      this._activeFeedbackText = `X-RAY CLOSED: Standard exterior view restored for [${comp.subsystemCode}].`
      this._activeFeedbackSeverity = this._phase === "COMPLETED" ? "nominal" : "warning"
    }
    return this.getSnapshot()
  }

  public toggleComparisonMode(): FieldFixUISnapshot {
    this._comparisonFaultPreview = !this._comparisonFaultPreview
    if (this._comparisonFaultPreview) {
      this._activeFeedbackText =
        "BEFORE/AFTER COMPARE: Previewing initial FAULT state (118C | 142 PSI | 18% Flow) vs repaired state."
      this._activeFeedbackSeverity = "fault"
    } else {
      this._activeFeedbackText =
        this._phase === "COMPLETED"
          ? "BEFORE/AFTER COMPARE: Viewing verified NOMINAL state (42C | 45 PSI | 100% Flow)."
          : "BEFORE/AFTER COMPARE: Returned to live repair telemetry."
      this._activeFeedbackSeverity = this._phase === "COMPLETED" ? "nominal" : "warning"
    }
    return this.getSnapshot()
  }

  public selectHotspot(hotspotId: HotspotId): FieldFixUISnapshot {
    this._selectedHotspot = hotspotId
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (this._phase === "READY_TO_SCAN" || this._phase === "SCANNING") {
      this._phase = "DIAGNOSING"
    }

    // Jump to the first incomplete repair step associated with this hotspot if in DIAGNOSING/REPAIRING
    if (this._phase !== "COMPLETED") {
      for (let i = 0; i < REPAIR_STEPS.length; i++) {
        if (REPAIR_STEPS[i].targetHotspot === hotspotId && !this._completedSteps[i]) {
          this._currentStepIndex = i
          break
        }
      }
    }

    const firstIncomplete = this.getFirstIncompleteStepIndex()
    const comp = HOTSPOT_CATALOG[hotspotId]
    if (this._xrayMode) {
      this._activeFeedbackText = comp.xrayInternalSummary
      this._activeFeedbackSeverity = "warning"
    } else if (this._phase !== "COMPLETED" && firstIncomplete >= 0 && this._currentStepIndex > firstIncomplete) {
      this._advisoryCount++
      const reqStep = REPAIR_STEPS[firstIncomplete]
      const reqComp = HOTSPOT_CATALOG[reqStep.targetHotspot]
      this._activeFeedbackText =
        `ADVISORY: Inspecting ${comp.subsystemCode} (Step ${this._currentStepIndex + 1}/4). Execute Step ${reqStep.stepNumber}/4 [${reqComp.subsystemCode}] first.`
      this._activeFeedbackSeverity = "warning"
    } else if (this._phase === "COMPLETED") {
      this._activeFeedbackText = `INSPECTING [${comp.subsystemCode}]: Subsystem verified nominal.`
      this._activeFeedbackSeverity = "nominal"
    } else {
      this._activeFeedbackText = `TARGET READY [${comp.subsystemCode}]: ${REPAIR_STEPS[this._currentStepIndex].title}`
      this._activeFeedbackSeverity = "warning"
    }

    return this.getSnapshot()
  }

  public nextStep(): FieldFixUISnapshot {
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (this._phase === "READY_TO_SCAN" || this._phase === "SCANNING") {
      this.completeScan()
    }
    if (this._currentStepIndex < REPAIR_STEPS.length - 1) {
      this._currentStepIndex++
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
      if (this._phase === "DIAGNOSING") {
        this._phase = "REPAIRING"
      }
    }

    const firstIncomplete = this.getFirstIncompleteStepIndex()
    if (this._phase !== "COMPLETED" && firstIncomplete >= 0 && this._currentStepIndex > firstIncomplete) {
      this._advisoryCount++
      const reqStep = REPAIR_STEPS[firstIncomplete]
      this._activeFeedbackText =
        `STEP PREVIEW ONLY: Step ${this._currentStepIndex + 1}/4 requires Step ${reqStep.stepNumber}/4 (${HOTSPOT_CATALOG[reqStep.targetHotspot].subsystemCode}) first.`
      this._activeFeedbackSeverity = "warning"
    } else if (this._phase !== "COMPLETED") {
      this._activeFeedbackText = `ACTIVE STEP: ${REPAIR_STEPS[this._currentStepIndex].title}`
      this._activeFeedbackSeverity = "warning"
    }
    return this.getSnapshot()
  }

  public prevStep(): FieldFixUISnapshot {
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (this._phase === "READY_TO_SCAN" || this._phase === "SCANNING") {
      this.completeScan()
    }
    if (this._currentStepIndex > 0) {
      this._currentStepIndex--
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
    }
    if (this._phase !== "COMPLETED") {
      this._activeFeedbackText = `ACTIVE STEP: ${REPAIR_STEPS[this._currentStepIndex].title}`
      this._activeFeedbackSeverity = "warning"
    }
    return this.getSnapshot()
  }

  public confirmCurrentStep(): {
    snapshot: FieldFixUISnapshot
    stepExecuted: number
    newlyCompletedAll: boolean
    interlockBlocked: boolean
  } {
    if (this._phase === "COMPLETED") {
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: false
      }
    }

    if (this._phase === "READY_TO_SCAN" || this._phase === "SCANNING") {
      this.completeScan()
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: false
      }
    }

    this._comparisonFaultPreview = false
    const firstIncomplete = this.getFirstIncompleteStepIndex()

    // Enforce Sequential Industrial LOTO Safety Interlock (Steps 1 -> 2 -> 3 -> 4)
    if (firstIncomplete >= 0 && this._currentStepIndex > firstIncomplete) {
      this._safetyViolations++
      this._advisoryCount++
      const blockedStep = REPAIR_STEPS[this._currentStepIndex]
      const reqStep = REPAIR_STEPS[firstIncomplete]
      const reqComp = HOTSPOT_CATALOG[reqStep.targetHotspot]
      this._interlockFlashHotspot = blockedStep.targetHotspot
      this._activeFeedbackText =
        `SAFETY INTERLOCK [LOTO VIOLATION]: ${blockedStep.interlockReason} Redirected to Step ${reqStep.stepNumber}/4 [${reqComp.subsystemCode}].`
      this._activeFeedbackSeverity = "critical"

      // Auto-redirect trainee to the required prerequisite step
      this._currentStepIndex = firstIncomplete
      this._selectedHotspot = reqStep.targetHotspot
      this._phase = "REPAIRING"

      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: true
      }
    }

    // If current step was already completed and user re-confirms, advance to first incomplete step
    if (this._completedSteps[this._currentStepIndex]) {
      if (firstIncomplete >= 0) {
        this._currentStepIndex = firstIncomplete
        this._selectedHotspot = REPAIR_STEPS[firstIncomplete].targetHotspot
      }
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: false
      }
    }

    const executedStep = this._currentStepIndex
    this._completedSteps[executedStep] = true
    this._interlockFlashHotspot = null
    this._phase = "REPAIRING"

    const allDone = this._completedSteps.every((v) => v)
    if (allDone) {
      this._phase = "COMPLETED"
      const score = Math.max(60, 100 - this._safetyViolations * 15)
      this._activeFeedbackText =
        `TRAINING SCORECARD: ${score}% (${this._safetyViolations === 0 ? "A+ FLAWLESS LOTO" : "B VERIFIED"}) | Violations: ${this._safetyViolations} | Pinch [COMPARE] to review.`
      this._activeFeedbackSeverity = "nominal"
    } else {
      // Advance to the next incomplete step automatically for smooth hands-free workflow
      const nextInc = this.getFirstIncompleteStepIndex()
      if (nextInc >= 0) {
        this._currentStepIndex = nextInc
        this._selectedHotspot = REPAIR_STEPS[nextInc].targetHotspot
      }
      const nextStepObj = REPAIR_STEPS[this._currentStepIndex]
      this._activeFeedbackText =
        `STEP ${executedStep + 1}/4 VERIFIED: Next -> ${nextStepObj.title} [${HOTSPOT_CATALOG[nextStepObj.targetHotspot].subsystemCode}].`
      this._activeFeedbackSeverity = "nominal"
    }

    return {
      snapshot: this.getSnapshot(),
      stepExecuted: executedStep,
      newlyCompletedAll: allDone,
      interlockBlocked: false
    }
  }

  public isHotspotRepaired(hotspotId: HotspotId): boolean {
    if (this._comparisonFaultPreview) return false
    if (this._phase === "COMPLETED") return true
    if (hotspotId === "valve") {
      return this._completedSteps[0] && this._completedSteps[3]
    }
    if (hotspotId === "regulator") {
      return this._completedSteps[1]
    }
    if (hotspotId === "relay") {
      return this._completedSteps[2]
    }
    return false
  }

  public getSnapshot(): FieldFixUISnapshot {
    const completedCount = this._completedSteps.filter((v) => v).length
    const step = REPAIR_STEPS[this._currentStepIndex]
    const comp = HOTSPOT_CATALOG[this._selectedHotspot]

    // Calculate live simulated equipment telemetry based on sequentially verified repair steps
    let tempC = 118
    let pressurePsi = 142
    let flowPct = 18

    if (this._comparisonFaultPreview) {
      tempC = 118
      pressurePsi = 142
      flowPct = 18
    } else if (this._phase === "READY_TO_SCAN") {
      tempC = 116
      pressurePsi = 140
      flowPct = 18
    } else {
      if (this._completedSteps[0]) {
        // Valve locked out
        flowPct = 0
        pressurePsi = 128
        tempC = 104
      }
      if (this._completedSteps[0] && this._completedSteps[1]) {
        // Regulator purged after LOTO
        pressurePsi = 38
        tempC = 82
      }
      if (this._completedSteps[0] && this._completedSteps[1] && this._completedSteps[2]) {
        // Thermal relay core reseated
        tempC = 46
      }
      if (
        this._completedSteps[0] &&
        this._completedSteps[1] &&
        this._completedSteps[2] &&
        this._completedSteps[3]
      ) {
        // Re-pressurized & verified
        tempC = 42
        pressurePsi = 45
        flowPct = 100
      }
    }

    let headerBadgeText = "STANDBY: CRYO-PUMP UNIT #04"
    let headerSeverity: FaultSeverity = "warning"
    let statusSummaryText = "Pinch [SCAN EQUIPMENT] or any 3D hotspot to localize faults."

    if (this._comparisonFaultPreview) {
      headerBadgeText = "COMPARE MODE: INITIAL FAULT SNAPSHOT"
      headerSeverity = "fault"
      statusSummaryText = "Showing pre-repair fault state (118C / 142 PSI / 18% Flow)."
    } else if (this._phase === "SCANNING") {
      headerBadgeText = "SCANNING SUBSYSTEM TELEMETRY..."
      headerSeverity = "warning"
      statusSummaryText = "Sweeping CV-101 Valve, PR-204 Regulator, and TR-309 Relay Core..."
    } else if (this._phase === "DIAGNOSING") {
      headerBadgeText = "CRITICAL FAULT: TR-309 OVERHEAT"
      headerSeverity = "critical"
      statusSummaryText = "3 Subsystem Alerts Localized. Follow 4-Step Guided Repair."
    } else if (this._phase === "REPAIRING") {
      if (this._interlockFlashHotspot) {
        headerBadgeText = "SAFETY INTERLOCK: LOTO SEQUENCE BLOCKED"
        headerSeverity = "critical"
      } else {
        headerBadgeText = `REPAIR IN PROGRESS (${completedCount}/4 VERIFIED)`
        headerSeverity = completedCount >= 2 ? "warning" : "fault"
      }
      statusSummaryText = `Active Target: ${comp.name} [${comp.subsystemCode}]`
    } else if (this._phase === "COMPLETED") {
      headerBadgeText = "SYSTEM NOMINAL - REPAIR VERIFIED"
      headerSeverity = "nominal"
      statusSummaryText = "All 4 lockout & repair steps verified. Unit cleared for service."
    }

    const trainingScorePct = Math.max(60, 100 - this._safetyViolations * 15)
    const traineeGrade =
      this._safetyViolations === 0
        ? "A+ FLAWLESS LOTO"
        : this._safetyViolations === 1
          ? "B+ SAFETY REDIRECTED"
          : "B VERIFIED"

    return {
      phase: this._phase,
      selectedHotspot: this._selectedHotspot,
      selectedComponent: comp,
      currentStepIndex: this._currentStepIndex,
      currentStep: step,
      completedSteps: [...this._completedSteps],
      completedCount,
      totalSteps: REPAIR_STEPS.length,
      systemTempC: tempC,
      systemPressurePsi: pressurePsi,
      coolantFlowPct: flowPct,
      headerBadgeText,
      headerSeverity,
      statusSummaryText,
      canConfirmCurrentStep: this._phase !== "COMPLETED",
      isCurrentStepDone: this._completedSteps[this._currentStepIndex],
      xrayMode: this._xrayMode,
      comparisonFaultPreview: this._comparisonFaultPreview,
      safetyViolations: this._safetyViolations,
      advisoryCount: this._advisoryCount,
      trainingScorePct,
      traineeGrade,
      activeFeedbackText: this._activeFeedbackText,
      activeFeedbackSeverity: this._activeFeedbackSeverity,
      interlockFlashHotspot: this._interlockFlashHotspot
    }
  }
}
