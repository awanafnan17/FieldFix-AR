/**
 * FieldFixState.ts
 * Domain state machine, telemetry definitions, component hotspot profiles,
 * and 4-step guided repair sequence for FieldFix AR.
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
    confirmButtonLabel: "EXECUTE STEP 1: LOCK VALVE"
  },
  {
    stepIndex: 1,
    stepNumber: 2,
    targetHotspot: "regulator",
    title: "STEP 2/4: PURGE BYPASS REGULATOR",
    actionInstruction: "Open Regulator PR-204 relief vent to bleed trapped pressure from 142 PSI to 38 PSI.",
    safetyWarning: "SAFETY: Stand clear of upward relief vent plume.",
    verificationMetric: "Target: Manifold Pressure <= 40 PSI",
    confirmButtonLabel: "EXECUTE STEP 2: PURGE PSI"
  },
  {
    stepIndex: 2,
    stepNumber: 3,
    targetHotspot: "relay",
    title: "STEP 3/4: RESEAT THERMAL RELAY CORE",
    actionInstruction: "Disengage tripped thermal latch on TR-309, reseat core cylinder, and flush cooling jacket.",
    safetyWarning: "SAFETY: Confirm pressure bleed complete before unlatching core.",
    verificationMetric: "Target: Core Temp < 50C & Latch Seated",
    confirmButtonLabel: "EXECUTE STEP 3: RESEAT CORE"
  },
  {
    stepIndex: 3,
    stepNumber: 4,
    targetHotspot: "valve",
    title: "STEP 4/4: RE-PRESSURIZE & VERIFY",
    actionInstruction: "Re-open Coolant Valve CV-101 and verify balanced 100% flow across all subsystems.",
    safetyWarning: "SAFETY: Monitor gauge stability at 45 PSI nominal.",
    verificationMetric: "Target: 42C | 45 PSI | 100% Nominal Flow",
    confirmButtonLabel: "EXECUTE STEP 4: VERIFY FLOW"
  }
]

export class FieldFixStateMachine {
  private _phase: DiagnosticPhase = "READY_TO_SCAN"
  private _selectedHotspot: HotspotId = "relay"
  private _currentStepIndex: number = 0
  private _completedSteps: boolean[] = [false, false, false, false]

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

  public reset(): FieldFixUISnapshot {
    this._phase = "READY_TO_SCAN"
    this._selectedHotspot = "relay"
    this._currentStepIndex = 0
    this._completedSteps = [false, false, false, false]
    return this.getSnapshot()
  }

  public startScan(): FieldFixUISnapshot {
    this._phase = "SCANNING"
    return this.getSnapshot()
  }

  public completeScan(): FieldFixUISnapshot {
    this._phase = "DIAGNOSING"
    this._selectedHotspot = "relay"
    this._currentStepIndex = 0
    return this.getSnapshot()
  }

  public selectHotspot(hotspotId: HotspotId): FieldFixUISnapshot {
    this._selectedHotspot = hotspotId
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
    return this.getSnapshot()
  }

  public nextStep(): FieldFixUISnapshot {
    if (this._phase === "READY_TO_SCAN") {
      this.completeScan()
    }
    if (this._currentStepIndex < REPAIR_STEPS.length - 1) {
      this._currentStepIndex++
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
      if (this._phase === "DIAGNOSING") {
        this._phase = "REPAIRING"
      }
    }
    return this.getSnapshot()
  }

  public prevStep(): FieldFixUISnapshot {
    if (this._currentStepIndex > 0) {
      this._currentStepIndex--
      this._selectedHotspot = REPAIR_STEPS[this._currentStepIndex].targetHotspot
    }
    return this.getSnapshot()
  }

  public confirmCurrentStep(): { snapshot: FieldFixUISnapshot; stepExecuted: number; newlyCompletedAll: boolean } {
    if (this._phase === "READY_TO_SCAN" || this._phase === "SCANNING") {
      this.completeScan()
      return {
        snapshot: this.getSnapshot(),
        stepExecuted: -1,
        newlyCompletedAll: false
      }
    }

    const executedStep = this._currentStepIndex
    this._completedSteps[executedStep] = true
    this._phase = "REPAIRING"

    const allDone = this._completedSteps.every((v) => v)
    if (allDone) {
      this._phase = "COMPLETED"
    } else {
      // Advance to the next incomplete step automatically for smooth hands-free workflow
      for (let i = 0; i < REPAIR_STEPS.length; i++) {
        const candidate = (executedStep + 1 + i) % REPAIR_STEPS.length
        if (!this._completedSteps[candidate]) {
          this._currentStepIndex = candidate
          this._selectedHotspot = REPAIR_STEPS[candidate].targetHotspot
          break
        }
      }
    }

    return {
      snapshot: this.getSnapshot(),
      stepExecuted: executedStep,
      newlyCompletedAll: allDone
    }
  }

  public isHotspotRepaired(hotspotId: HotspotId): boolean {
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

    // Calculate live simulated equipment telemetry based on completed repair steps
    let tempC = 118
    let pressurePsi = 142
    let flowPct = 18

    if (this._phase === "READY_TO_SCAN") {
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
      if (this._completedSteps[1]) {
        // Regulator purged
        pressurePsi = 38
        tempC = 82
      }
      if (this._completedSteps[2]) {
        // Thermal relay core reseated
        tempC = 46
      }
      if (this._completedSteps[3]) {
        // Re-pressurized & verified
        tempC = 42
        pressurePsi = 45
        flowPct = 100
      }
    }

    let headerBadgeText = "STANDBY: CRYO-PUMP UNIT #04"
    let headerSeverity: FaultSeverity = "warning"
    let statusSummaryText = "Pinch [SCAN EQUIPMENT] or any 3D hotspot to localize faults."

    if (this._phase === "SCANNING") {
      headerBadgeText = "SCANNING SUBSYSTEM TELEMETRY..."
      headerSeverity = "warning"
      statusSummaryText = "Sweeping CV-101 Valve, PR-204 Regulator, and TR-309 Relay Core..."
    } else if (this._phase === "DIAGNOSING") {
      headerBadgeText = "CRITICAL FAULT: TR-309 OVERHEAT"
      headerSeverity = "critical"
      statusSummaryText = "3 Subsystem Alerts Localized. Follow 4-Step Guided Repair."
    } else if (this._phase === "REPAIRING") {
      headerBadgeText = `REPAIR IN PROGRESS (${completedCount}/4 VERIFIED)`
      headerSeverity = completedCount >= 2 ? "warning" : "fault"
      statusSummaryText = `Active Target: ${comp.name} [${comp.subsystemCode}]`
    } else if (this._phase === "COMPLETED") {
      headerBadgeText = "SYSTEM NOMINAL - REPAIR VERIFIED"
      headerSeverity = "nominal"
      statusSummaryText = "All 4 lockout & repair steps verified. Unit cleared for service."
    }

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
      isCurrentStepDone: this._completedSteps[this._currentStepIndex]
    }
  }
}
