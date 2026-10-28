/**
 * FieldFixState.ts
 * Domain state machine, telemetry definitions, component hotspot profiles,
 * "TRACE THE FAULT" causal chain engine, 4-step guided repair sequence,
 * LOTO safety interlock, Auto-X-Ray inspection state, progressive UI disclosure mode,
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

export type FlowBottleneckStage =
  | "choked_142psi"
  | "isolated_trapped_psi"
  | "purged_cooled_ready"
  | "nominal_100pct"

export type UIDisclosureMode =
  | "onboarding"
  | "active_diagnosis"
  | "active_repair"
  | "completed_review"

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
  causalTraceSummary: string
  causalLinkHint: string
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
  spatialPinchPrompt: string
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
  focusedXrayHotspot: HotspotId | null
  comparisonFaultPreview: boolean
  safetyViolations: number
  advisoryCount: number
  trainingScorePct: number
  traineeGrade: string
  activeFeedbackText: string
  activeFeedbackSeverity: FaultSeverity
  interlockFlashHotspot: HotspotId | null
  flowBottleneckStage: FlowBottleneckStage
  causalChainText: string
  whatChangedSummary: string
  tracedHotspots: Record<HotspotId, boolean>
  tracedCount: number
  faultTraceCount: number
  faultTraceComplete: boolean
  nextTraceTarget: HotspotId | null
  uiDisclosureMode: UIDisclosureMode
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
    causalTraceSummary:
      "ROOT CAUSE FOUND [CV-101]: Partially fouled ball-seal restricts intake to 18%, causing PR-204 vapor lock (142 PSI) & TR-309 overheat (118C).",
    causalLinkHint:
      "ROOT CAUSE TRACED [3/3]: CV-101 intake cavitation (18% flow) is the root cause! Pinch 3D [CV-101] or [EXECUTE STEP 1] to lock LOTO.",
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
    causalTraceSummary:
      "BOTTLENECK FOUND [PR-204]: 142 PSI vapor pocket blocks manifold flow to TR-309. Inspect upstream component [CV-101] to find the source.",
    causalLinkHint:
      "TRACE [2/3]: Bottleneck found at PR-204 (142 PSI vapor lock) -> Follow 3D chevron upstream and pinch [CV-101] to inspect intake.",
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
    rootCause: "Simulated thermal latch tripped due to coolant starvation. Inspect the next component upstream [PR-204] to see why.",
    causalTraceSummary:
      "SYMPTOM [TR-309]: Thermal relay core overheated to 118C from coolant starvation. Inspect the next component upstream to find why.",
    causalLinkHint:
      "TRACE [1/3]: Symptom confirmed at TR-309 (118C overheat) -> Follow 3D chevron and pinch upstream component [PR-204] to inspect.",
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
    spatialPinchPrompt: "[STEP 1/4] PINCH CV-101 VALVE TO LOCK LOTO (-90°)",
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
    spatialPinchPrompt: "[STEP 2/4] PINCH PR-204 REGULATOR TO PURGE 142 PSI",
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
    spatialPinchPrompt: "[STEP 3/4] PINCH TR-309 RELAY CORE TO RESEAT",
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
    spatialPinchPrompt: "[STEP 4/4] PINCH CV-101 VALVE TO RESTORE 100% FLOW",
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
  private _tracedHotspots: Record<HotspotId, boolean> = {
    valve: false,
    regulator: false,
    relay: false
  }
  private _whatChangedSummary: string =
    "VISIBLE SYMPTOM: [TR-309] Thermal Relay Core is overheating (116C). Upstream components [PR-204] & [CV-101] are uninspected."
  private _activeFeedbackText: string =
    "FIRST-RUN GUIDE: Only the TR-309 overheat symptom (116C) is visible. Pinch [SCAN] to begin tracing upstream."
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

  private computeFaultTraceCount(): number {
    return (
      (this._tracedHotspots.valve ? 1 : 0) +
      (this._tracedHotspots.regulator ? 1 : 0) +
      (this._tracedHotspots.relay ? 1 : 0)
    )
  }

  private computeNextTraceTarget(): HotspotId | null {
    if (this._phase !== "DIAGNOSING") return null
    if (!this._tracedHotspots.relay) return "relay"
    if (!this._tracedHotspots.regulator) return "regulator"
    if (!this._tracedHotspots.valve) return "valve"
    return null
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
    this._tracedHotspots = {
      valve: false,
      regulator: false,
      relay: false
    }
    this._interlockFlashHotspot = null
    this._whatChangedSummary =
      "VISIBLE SYMPTOM: [TR-309] Thermal Relay Core is overheating (116C). Upstream components [PR-204] & [CV-101] are uninspected."
    this._activeFeedbackText =
      "FIRST-RUN GUIDE: Only the TR-309 overheat symptom (116C) is visible. Pinch [SCAN] to begin tracing upstream."
    this._activeFeedbackSeverity = "warning"
    return this.getSnapshot()
  }

  public startScan(): FieldFixUISnapshot {
    if (this._phase !== "READY_TO_SCAN") {
      return this.getSnapshot()
    }
    this._phase = "SCANNING"
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null
    this._whatChangedSummary =
      "SWEEPING UNIT #04: Confirming TR-309 thermal symptom (118C) and mapping upstream manifold components..."
    this._activeFeedbackText =
      "ACTIVE TELEMETRY SWEEP: Localizing TR-309 overheat symptom and preparing upstream inspection path..."
    this._activeFeedbackSeverity = "warning"
    return this.getSnapshot()
  }

  public completeScan(): FieldFixUISnapshot {
    if (this._phase !== "READY_TO_SCAN" && this._phase !== "SCANNING") {
      return this.getSnapshot()
    }
    this._phase = "DIAGNOSING"
    this._selectedHotspot = "relay"
    this._currentStepIndex = 0
    this._xrayMode = false
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null
    this._tracedHotspots = {
      valve: false,
      regulator: false,
      relay: true
    }
    this._whatChangedSummary =
      "SYMPTOM CONFIRMED [1/3]: TR-309 is overheating (118C). Pinch upstream component [PR-204] to inspect for blockage."
    this._activeFeedbackText = HOTSPOT_CATALOG.relay.causalLinkHint
    this._activeFeedbackSeverity = "critical"
    return this.getSnapshot()
  }

  private computeTraineeGrade(): string {
    if (this._safetyViolations === 0) return "A+ FLAWLESS LOTO"
    if (this._safetyViolations === 1) return "B+ SAFETY REDIRECTED"
    if (this._safetyViolations === 2) return "C LOTO REVIEW REQUIRED"
    return "D UNSAFE PROCEDURE"
  }

  public toggleXrayMode(): FieldFixUISnapshot {
    if (this._phase === "SCANNING") {
      return this.getSnapshot()
    }
    this._interlockFlashHotspot = null
    this._xrayMode = !this._xrayMode
    const comp = HOTSPOT_CATALOG[this._selectedHotspot]
    if (this._xrayMode) {
      this._activeFeedbackText = this._tracedHotspots[this._selectedHotspot]
        ? comp.xrayInternalSummary
        : "X-RAY ACTIVE: Follow the 3D chevron upstream ([TR-309] -> [PR-204] -> [CV-101]) to inspect each component."
      this._activeFeedbackSeverity = "warning"
    } else {
      this._activeFeedbackText = `X-RAY CLOSED: Standard exterior view restored for [${comp.subsystemCode}].`
      this._activeFeedbackSeverity = this._phase === "COMPLETED" ? "nominal" : "warning"
    }
    return this.getSnapshot()
  }

  public toggleComparisonMode(): FieldFixUISnapshot {
    if (this._phase === "SCANNING") {
      return this.getSnapshot()
    }
    const anyStepDone = this._completedSteps.some((v) => v)
    if (this._phase !== "COMPLETED" && !anyStepDone) {
      this._comparisonFaultPreview = false
      this._interlockFlashHotspot = null
      this._activeFeedbackText =
        "COMPARE LOCKED: Complete diagnosis and at least 1 repair step before comparing Before vs After states."
      this._activeFeedbackSeverity = "warning"
      return this.getSnapshot()
    }
    this._interlockFlashHotspot = null
    this._comparisonFaultPreview = !this._comparisonFaultPreview
    if (this._comparisonFaultPreview) {
      this._whatChangedSummary =
        "BEFORE REPAIR (FAULT SNAPSHOT): CV-101 at 18% -> PR-204 blocked at 142 PSI -> TR-309 overheated at 118C."
      this._activeFeedbackText =
        "BEFORE/AFTER COMPARE: Previewing initial FAULT state (118C | 142 PSI | 18% Flow) vs repaired state."
      this._activeFeedbackSeverity = "fault"
    } else {
      this._whatChangedSummary =
        this._phase === "COMPLETED"
          ? "AFTER REPAIR (NOMINAL): CV-101 100% open -> PR-204 regulated at 45 PSI -> TR-309 cooled to 42C."
          : "Returned to live repair telemetry."
      this._activeFeedbackText =
        this._phase === "COMPLETED"
          ? "BEFORE/AFTER COMPARE: Viewing verified NOMINAL state (42C | 45 PSI | 100% Flow)."
          : "BEFORE/AFTER COMPARE: Returned to live repair telemetry."
      this._activeFeedbackSeverity = this._phase === "COMPLETED" ? "nominal" : "warning"
    }
    return this.getSnapshot()
  }

  public selectHotspot(hotspotId: HotspotId): FieldFixUISnapshot {
    if (this._phase === "SCANNING") {
      return this.getSnapshot()
    }
    const wasInStandby = this._phase === "READY_TO_SCAN"
    const hadTracedRelayBefore = this._tracedHotspots.relay
    this._selectedHotspot = hotspotId
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (wasInStandby) {
      this._phase = "DIAGNOSING"
      this._tracedHotspots.relay = true
    }

    // Progressive discovery rule:
    // 1. TR-309 (relay) is the initial visible symptom (1/3).
    // 2. PR-204 (regulator) bottleneck is revealed only after inspecting regulator once relay is traced (2/3).
    // 3. CV-101 (valve) root cause is revealed only after inspecting valve once both relay & regulator are traced (3/3).
    let skippedUpstreamOrder = false
    if (hotspotId === "relay") {
      this._tracedHotspots.relay = true
    } else if (hotspotId === "regulator") {
      if (hadTracedRelayBefore) {
        this._tracedHotspots.regulator = true
      } else {
        skippedUpstreamOrder = true
      }
    } else if (hotspotId === "valve") {
      if (hadTracedRelayBefore && this._tracedHotspots.regulator) {
        this._tracedHotspots.valve = true
      } else {
        skippedUpstreamOrder = true
      }
    }

    if (!wasInStandby && this._phase === "DIAGNOSING") {
      if (skippedUpstreamOrder) {
        this._xrayMode = false
      } else {
        // Auto-reveal 3D X-Ray internal cutaways when tracing a valid upstream hotspot in DIAGNOSING phase
        this._xrayMode = true
      }
    }

    const firstIncomplete = this.getFirstIncompleteStepIndex()
    const comp = HOTSPOT_CATALOG[hotspotId]
    const traceCount = this.computeFaultTraceCount()
    const traceComplete = traceCount >= 3

    // Update _currentStepIndex ONLY after 3/3 upstream fault trace is complete:
    // - During incomplete tracing (1/3 or 2/3), keep _currentStepIndex = 0 (Defect F).
    // - After Step 1 LOTO is completed, selecting CV-101 ("valve") while Steps 2 or 3 are incomplete
    //   inspects the completed Step 1 LOTO state rather than jumping to Step 4 (SO-01).
    if (!traceComplete) {
      this._currentStepIndex = 0
    } else if (this._phase !== "COMPLETED") {
      if (hotspotId === "valve" && this._completedSteps[0] && firstIncomplete >= 0 && firstIncomplete < 3) {
        this._currentStepIndex = firstIncomplete
      } else if (this.isHotspotRepaired(hotspotId) && firstIncomplete >= 0) {
        this._currentStepIndex = firstIncomplete
      } else {
        for (let i = 0; i < REPAIR_STEPS.length; i++) {
          if (REPAIR_STEPS[i].targetHotspot === hotspotId && !this._completedSteps[i]) {
            this._currentStepIndex = i
            break
          }
        }
      }
    }

    if (this._phase === "COMPLETED") {
      this._whatChangedSummary = comp.repairedSummary
      this._activeFeedbackText = `INSPECTING [${comp.subsystemCode}]: ${comp.repairedSummary}`
      this._activeFeedbackSeverity = "nominal"
    } else if (skippedUpstreamOrder) {
      if (!wasInStandby) {
        this._advisoryCount++
      }
      if (hotspotId === "regulator") {
        this._whatChangedSummary =
          "SYMPTOM CONFIRMED [1/3]: TR-309 is overheating (118C). Pinch [PR-204] again to inspect its internal regulator state."
        this._activeFeedbackText =
          "TRACE [1/3]: TR-309 overheat localized -> Pinch [PR-204] again to inspect upstream regulator."
      } else {
        this._whatChangedSummary =
          "TRACE ORDER INCOMPLETE: Inspect midstream component [PR-204] upstream from [TR-309] before diagnosing [CV-101]."
        this._activeFeedbackText =
          "TRACE GUIDANCE: Do not skip ahead! Follow the 3D chevron and pinch midstream component [PR-204] first."
      }
      this._activeFeedbackSeverity = "warning"
    } else if (
      traceComplete &&
      hotspotId === "valve" &&
      this._completedSteps[0] &&
      !this._completedSteps[3] &&
      firstIncomplete >= 0 &&
      firstIncomplete < 3
    ) {
      const nextReqStep = REPAIR_STEPS[firstIncomplete]
      const nextReqCode = HOTSPOT_CATALOG[nextReqStep.targetHotspot].subsystemCode
      this._whatChangedSummary = comp.lockedOutSummary || comp.repairedSummary
      this._activeFeedbackText =
        `LOTO VERIFIED [CV-101]: Intake locked at 0% Flow (${this._completedSteps[1] ? 38 : 128} PSI). Next -> Step ${nextReqStep.stepNumber}/4 [${nextReqCode}].`
      this._activeFeedbackSeverity = "nominal"
    } else if (traceComplete && this.isHotspotRepaired(hotspotId)) {
      const nextReqStep = firstIncomplete >= 0 ? REPAIR_STEPS[firstIncomplete] : REPAIR_STEPS[3]
      const nextReqCode = HOTSPOT_CATALOG[nextReqStep.targetHotspot].subsystemCode
      this._whatChangedSummary = comp.repairedSummary
      this._activeFeedbackText =
        `REPAIRED [${comp.subsystemCode}]: ${comp.repairedSummary} Next -> Step ${nextReqStep.stepNumber}/4 [${nextReqCode}].`
      this._activeFeedbackSeverity = "nominal"
    } else if (traceComplete && firstIncomplete >= 0 && this._currentStepIndex > firstIncomplete) {
      this._advisoryCount++
      this._whatChangedSummary = comp.causalTraceSummary
      const reqStep = REPAIR_STEPS[firstIncomplete]
      const reqComp = HOTSPOT_CATALOG[reqStep.targetHotspot]
      this._activeFeedbackText =
        `LOTO RULE: Complete Step ${reqStep.stepNumber}/4 [${reqComp.subsystemCode}] before actuating [${comp.subsystemCode}].`
      this._activeFeedbackSeverity = "warning"
    } else if (traceComplete && firstIncomplete === 0 && this._currentStepIndex === 0) {
      this._whatChangedSummary = comp.causalTraceSummary
      this._activeFeedbackText = HOTSPOT_CATALOG.valve.causalLinkHint
      this._activeFeedbackSeverity = "nominal"
    } else if (traceComplete && firstIncomplete > 0 && this._currentStepIndex === firstIncomplete) {
      const activeStep = REPAIR_STEPS[firstIncomplete]
      this._whatChangedSummary =
        hotspotId === "valve" && comp.lockedOutSummary ? comp.lockedOutSummary : comp.causalTraceSummary
      this._activeFeedbackText =
        `ACTIVE TARGET [${comp.subsystemCode}]: ${activeStep.safetyWarning} (${activeStep.verificationMetric})`
      this._activeFeedbackSeverity = "warning"
    } else {
      this._whatChangedSummary = comp.causalTraceSummary
      this._activeFeedbackText = `${comp.causalLinkHint}`
      this._activeFeedbackSeverity = "warning"
    }

    return this.getSnapshot()
  }

  public nextStep(): FieldFixUISnapshot {
    if (this._phase === "SCANNING") {
      return this.getSnapshot()
    }
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (this._phase === "READY_TO_SCAN") {
      this._activeFeedbackText =
        "SCAN REQUIRED: Pinch [SCAN EQUIPMENT TELEMETRY] before navigating repair steps."
      this._activeFeedbackSeverity = "warning"
      return this.getSnapshot()
    }

    if (this.computeFaultTraceCount() < 3 && this._phase === "DIAGNOSING") {
      this._activeFeedbackText =
        "TRACE INCOMPLETE: Inspect [TR-309] -> [PR-204] -> [CV-101] upstream before navigating repair steps."
      this._activeFeedbackSeverity = "warning"
      return this.getSnapshot()
    }

    if (this._currentStepIndex < REPAIR_STEPS.length - 1) {
      this._currentStepIndex++
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
      this._whatChangedSummary = HOTSPOT_CATALOG[this._selectedHotspot].causalTraceSummary
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
    if (this._phase === "SCANNING") {
      return this.getSnapshot()
    }
    this._comparisonFaultPreview = false
    this._interlockFlashHotspot = null

    if (this._phase === "READY_TO_SCAN") {
      this._activeFeedbackText =
        "SCAN REQUIRED: Pinch [SCAN EQUIPMENT TELEMETRY] before navigating repair steps."
      this._activeFeedbackSeverity = "warning"
      return this.getSnapshot()
    }

    if (this.computeFaultTraceCount() < 3 && this._phase === "DIAGNOSING") {
      this._activeFeedbackText =
        "TRACE INCOMPLETE: Inspect [TR-309] -> [PR-204] -> [CV-101] upstream before navigating repair steps."
      this._activeFeedbackSeverity = "warning"
      return this.getSnapshot()
    }

    if (this._currentStepIndex > 0) {
      this._currentStepIndex--
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
      this._whatChangedSummary = HOTSPOT_CATALOG[this._selectedHotspot].causalTraceSummary
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
    if (this._phase === "COMPLETED" || this._phase === "SCANNING") {
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: false
      }
    }

    if (this._phase === "READY_TO_SCAN") {
      this._activeFeedbackText =
        "SCAN REQUIRED: Pinch [SCAN EQUIPMENT TELEMETRY] to begin upstream fault diagnosis."
      this._activeFeedbackSeverity = "warning"
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false,
        interlockBlocked: false
      }
    }

    if (this.computeFaultTraceCount() < 3) {
      const nextTarget = this.computeNextTraceTarget() || "regulator"
      const nextCode = HOTSPOT_CATALOG[nextTarget].subsystemCode
      this._activeFeedbackText =
        `TRACE INCOMPLETE: Inspect upstream [${nextCode}] before executing repair steps.`
      this._activeFeedbackSeverity = "warning"
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
      this._whatChangedSummary =
        `INTERLOCK BLOCKED [${HOTSPOT_CATALOG[blockedStep.targetHotspot].subsystemCode}]: ${blockedStep.interlockReason}`
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

    // Record exact cause-and-effect physical change from this intervention
    if (executedStep === 0) {
      this._whatChangedSummary =
        "STEP 1 CAUSE->EFFECT: CV-101 rotated -90° & LOTO locked -> Intake flow halted (18% -> 0%), isolating trapped 128 PSI in PR-204."
    } else if (executedStep === 1) {
      this._whatChangedSummary =
        "STEP 2 CAUSE->EFFECT: PR-204 relief valve purged -> Trapped vapor lock vented (142 -> 38 PSI), clearing manifold blockage."
    } else if (executedStep === 2) {
      this._whatChangedSummary =
        "STEP 3 CAUSE->EFFECT: TR-309 thermal plunger reseated (-1.35 cm) -> Overheat cleared (118C -> 46C), ready for flow restore."
    } else if (executedStep === 3) {
      this._whatChangedSummary =
        "STEP 4 CAUSE->EFFECT: LOTO removed & CV-101 opened (+90°) -> 100% laminar cryo-flow restored (42C | 45 PSI Nominal)."
    }

    const allDone = this._completedSteps.every((v) => v)
    if (allDone) {
      this._phase = "COMPLETED"
      const score = Math.max(60, 100 - this._safetyViolations * 15)
      const gradeLabel = this.computeTraineeGrade()
      this._activeFeedbackText =
        `TRAINING SCORECARD: ${score}% (${gradeLabel}) | Violations: ${this._safetyViolations} | Pinch [COMPARE] to review.`
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

    // Determine deterministic 3D flow bottleneck stage for cause-and-effect fluid/pressure visualization
    let flowBottleneckStage: FlowBottleneckStage = "choked_142psi"
    let causalChainText =
      "FAULT CHAIN: [CV-101] 18% Choked -> [PR-204] 142 PSI Blockage -> [TR-309] 118C Starved"

    if (this._comparisonFaultPreview) {
      flowBottleneckStage = "choked_142psi"
      causalChainText =
        "BEFORE (FAULT): [CV-101] 18% Choked -> [PR-204] 142 PSI Vapor Lock -> [TR-309] 118C Overheat"
    } else if (this._phase === "COMPLETED" || this._completedSteps[3]) {
      flowBottleneckStage = "nominal_100pct"
      causalChainText =
        "RECOVERED: [CV-101] 100% Open -> [PR-204] 45 PSI Regulated -> [TR-309] 42C Cooled"
    } else if (this._completedSteps[0] && this._completedSteps[1]) {
      flowBottleneckStage = "purged_cooled_ready"
      causalChainText = this._completedSteps[2]
        ? "READY FOR FLOW: [PR-204] 38 PSI Safe + [TR-309] Reseated (46C) -> Open [CV-101] Next"
        : "PRESSURE CLEARED: [PR-204] Vented to 38 PSI -> Safe to Reseat [TR-309] Core (82C)"
    } else if (this._completedSteps[0]) {
      flowBottleneckStage = "isolated_trapped_psi"
      causalChainText =
        "LOTO ISOLATED: [CV-101] Locked (0% Flow) -> 128 PSI Trapped in [PR-204] -> Purge Next"
    }

    // Determine localized Auto-X-Ray focus (opens internal cutaway on selected faulted component only if it has been traced)
    let focusedXrayHotspot: HotspotId | null = null
    if (
      this._xrayMode &&
      (this._phase === "DIAGNOSING" || this._phase === "REPAIRING") &&
      this._tracedHotspots[this._selectedHotspot]
    ) {
      if (!this.isHotspotRepaired(this._selectedHotspot)) {
        focusedXrayHotspot = this._selectedHotspot
      }
    }

    // Determine Progressive Disclosure UI mode
    let uiDisclosureMode: UIDisclosureMode = "onboarding"
    if (this._phase === "COMPLETED") {
      uiDisclosureMode = "completed_review"
    } else if (this._phase === "REPAIRING") {
      uiDisclosureMode = "active_repair"
    } else if (this._phase === "DIAGNOSING") {
      uiDisclosureMode = "active_diagnosis"
    }

    const faultTraceCount = this.computeFaultTraceCount()
    const faultTraceComplete = faultTraceCount >= 3
    const nextTraceTarget = this.computeNextTraceTarget()

    let headerBadgeText = "ALERT: CRYO-PUMP #04 — OVERHEAT ALARM"
    let headerSeverity: FaultSeverity = "warning"
    let statusSummaryText = "Only the TR-309 overheat symptom (116C) is visible. Pinch [SCAN] to trace upstream."

    if (this._comparisonFaultPreview) {
      headerBadgeText = "COMPARE MODE: INITIAL FAULT SNAPSHOT"
      headerSeverity = "fault"
      statusSummaryText = "Showing pre-repair fault state (118C / 142 PSI / 18% Flow)."
    } else if (this._phase === "SCANNING") {
      headerBadgeText = "SCANNING & TRACING FLOW PATH..."
      headerSeverity = "warning"
      statusSummaryText = "Confirming TR-309 overheat symptom and mapping upstream manifold..."
    } else if (this._phase === "DIAGNOSING") {
      headerBadgeText = faultTraceComplete
        ? "ROOT CAUSE TRACED: START STEP 1 LOTO"
        : `TRACE FAULT PATH (${faultTraceCount}/3 INSPECTED)`
      headerSeverity = "critical"
      statusSummaryText = faultTraceComplete
        ? "Root cause traced to CV-101 (18% flow). Execute Step 1 LOTO isolation."
        : "Follow the 3D chevron upstream to inspect the next component in the coolant loop."
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
    const traineeGrade = this.computeTraineeGrade()

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
      focusedXrayHotspot,
      comparisonFaultPreview: this._comparisonFaultPreview,
      safetyViolations: this._safetyViolations,
      advisoryCount: this._advisoryCount,
      trainingScorePct,
      traineeGrade,
      activeFeedbackText: this._activeFeedbackText,
      activeFeedbackSeverity: this._activeFeedbackSeverity,
      interlockFlashHotspot: this._interlockFlashHotspot,
      flowBottleneckStage,
      causalChainText,
      whatChangedSummary: this._whatChangedSummary,
      tracedHotspots: { ...this._tracedHotspots },
      tracedCount: faultTraceCount,
      faultTraceCount,
      faultTraceComplete,
      nextTraceTarget,
      uiDisclosureMode
    }
  }
}
