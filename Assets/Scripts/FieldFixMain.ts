// Timestamp: 1794071553.516151
/**
 * FieldFixMain.ts
 * Main coordinator for FieldFix AR — Spatial Equipment Diagnostic & Guided Repair Assistant.
 *
 * Strictly adheres to CLAD architecture:
 * - Zero direct SpectaclesUIKit or Component.Text usage in Main.
 * - Coordinates FieldFixStateMachine, FieldFixEquipmentMesh, FieldFixDiagnosticUI, and FieldFixAudioController.
 */

import { FieldFixAudioController } from "./FieldFixAudioController"
import { FieldFixDiagnosticUI } from "./FieldFixDiagnosticUI"
import { FieldFixEquipmentMesh } from "./FieldFixEquipmentMesh"
import { FieldFixStateMachine, FieldFixUISnapshot, HotspotId } from "./FieldFixState"

@component
export class FieldFixMain extends BaseScriptComponent {
  private static _instance: FieldFixMain | null = null

  public static getInstance(): FieldFixMain | null {
    return FieldFixMain._instance
  }

  @input
  @allowUndefined
  @hint("3D procedural Cryo-Coolant Pump & Relay Unit mesh controller")
  public equipmentMesh: FieldFixEquipmentMesh

  @input
  @allowUndefined
  @hint("World-space SpectaclesUIKit diagnostic & repair UI panel")
  public diagnosticUI: FieldFixDiagnosticUI

  @input
  @allowUndefined
  @hint("Spatial audio feedback controller")
  public audioController: FieldFixAudioController

  @input
  @hint("Duration of the laser telemetry scan sweep in seconds")
  public scanDurationSec: number = 1.2

  @input
  public autoPacedShowcase: boolean = true
  private showcaseTime: number = 0
  private showcaseStep: number = 0
  private showcaseActive: boolean = true

  private stateMachine: FieldFixStateMachine = new FieldFixStateMachine()
  private scanCountdown: number = -1
  private eventsBound: boolean = false
  private lastConfirmStepTimeSec: number = -10
  private stepExplicitlyTargeted: boolean = true
  private lastConfirmedHotspotId: HotspotId | null = null
  public minConfirmStepIntervalSec: number = 0.24
  public verboseLogging: boolean = true

  private logInfo(msg: string): void {
    if (this.verboseLogging) {
      print(msg)
    }
  }

  private get sfx(): FieldFixAudioController | null {
    return this.verboseLogging ? this.audioController : null
  }

  public onAwake(): void {
    FieldFixMain._instance = this

    this.createEvent("OnStartEvent").bind(() => {
      this.resolveSubComponents()
      this.bindEvents()
      const initialSnapshot = this.stateMachine.reset()
      this.syncAll(initialSnapshot)
      print(
        `[FieldFixAR] Initialized | phase=${initialSnapshot.phase} | temp=${initialSnapshot.systemTempC}C | psi=${initialSnapshot.systemPressurePsi}`
      )
    })

    this.createEvent("UpdateEvent").bind((ev) => {
      const dt = Math.min(ev.getDeltaTime(), 0.05)
      if (this.scanCountdown > 0) {
        this.scanCountdown -= dt
        if (this.scanCountdown <= 0) {
          this.scanCountdown = -1
          const snap = this.stateMachine.completeScan()
          this.audioController?.playAlert()
          this.syncAll(snap)
          print(
            `[FieldFixAR] ScanComplete | phase=${snap.phase} | hotspot=${snap.selectedHotspot} | step=${snap.currentStep.stepNumber}/${snap.totalSteps}`
          )
        }
      }

      if (this.autoPacedShowcase && this.showcaseActive) {
        this.showcaseTime += dt
        this.tickShowcase()
      }
    })

    this.createEvent("OnDestroyEvent").bind(() => {
      if (FieldFixMain._instance === this) {
        FieldFixMain._instance = null
      }
    })
  }

  private resolveSubComponents(): void {
    if (!this.audioController) {
      this.audioController = this.findScriptInHierarchy(
        this.sceneObject,
        FieldFixAudioController.getTypeName()
      )
    }
    if (!this.equipmentMesh) {
      this.equipmentMesh = this.findScriptInHierarchy(
        this.sceneObject,
        FieldFixEquipmentMesh.getTypeName()
      )
    }
    if (!this.diagnosticUI) {
      this.diagnosticUI = this.findScriptInHierarchy(
        this.sceneObject,
        FieldFixDiagnosticUI.getTypeName()
      )
    }
  }

  private findScriptInHierarchy<T extends BaseScriptComponent>(
    root: SceneObject,
    typeName: TypeName<T>
  ): T | null {
    const direct = root.getComponent(typeName as any) as unknown as T | null
    if (direct) return direct
    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const found = this.findScriptInHierarchy(root.getChild(i), typeName)
      if (found) return found
    }
    return null
  }

  private bindEvents(): void {
    if (this.eventsBound) return
    this.eventsBound = true
    if (this.diagnosticUI) {
      this.diagnosticUI.onScanRequested.add(() => {
        this.triggerScan()
      })
      this.diagnosticUI.onSelectHotspot.add((id: HotspotId) => {
        this.selectHotspot(id)
      })
      this.diagnosticUI.onPrevStep.add(() => {
        this.prevStep()
      })
      this.diagnosticUI.onNextStep.add(() => {
        this.nextStep()
      })
      this.diagnosticUI.onConfirmStep.add(() => {
        this.confirmCurrentStep()
      })
      this.diagnosticUI.onResetRequested.add(() => {
        this.resetExperience()
      })
      this.diagnosticUI.onToggleXray.add(() => {
        this.toggleXrayMode()
      })
      this.diagnosticUI.onToggleComparison.add(() => {
        this.toggleComparisonMode()
      })
    }

    if (this.equipmentMesh) {
      this.equipmentMesh.onHotspotTriggered.add((id: HotspotId) => {
        this.handle3DHotspotPinch(id)
      })
    }
  }

  /**
   * Handles a direct 3D pinch on one of the equipment's SIK Interactable hotspots.
   * - If the pinched 3D component is the active repair step's target during DIAGNOSING/REPAIRING,
   *   pinching the 3D component directly executes that physical repair step (or triggers LOTO Safety Interlock if out-of-order)!
   * - Otherwise, it selects that component for inspection.
   */
  public handle3DHotspotPinch(id: HotspotId): FieldFixUISnapshot {
    const current = this.stateMachine.getSnapshot()
    if (current.phase === "SCANNING") {
      return current
    }
    if (
      (current.phase === "DIAGNOSING" || current.phase === "REPAIRING") &&
      !current.comparisonFaultPreview &&
      current.faultTraceComplete &&
      current.selectedHotspot === id &&
      current.currentStep.targetHotspot === id &&
      !current.isCurrentStepDone &&
      !(id === "valve" && current.completedSteps[0] && (!current.completedSteps[1] || !current.completedSteps[2]))
    ) {
      if (id !== this.lastConfirmedHotspotId) {
        this.stepExplicitlyTargeted = true
      }
      this.logInfo(
        `[FieldFixAR] Direct3DHotspotAction | hotspot=${id} | step=${current.currentStep.stepNumber}/${current.totalSteps}`
      )
      return this.confirmCurrentStep()
    }
    return this.selectHotspot(id)
  }

  public triggerScan(immediate: boolean = false): FieldFixUISnapshot {
    const currentPhase = this.stateMachine.phase
    if (currentPhase !== "READY_TO_SCAN" && !(currentPhase === "SCANNING" && immediate)) {
      return this.stateMachine.getSnapshot()
    }
    this.stepExplicitlyTargeted = true
    this.lastConfirmedHotspotId = null
    if (immediate || this.scanDurationSec <= 0.05) {
      this.scanCountdown = -1
      this.sfx?.stopScan()
      const snap = this.stateMachine.completeScan()
      this.sfx?.playAlert()
      this.syncAll(snap)
      this.logInfo(`[FieldFixAR] ScanComplete(Immediate) | phase=${snap.phase} | hotspot=${snap.selectedHotspot}`)
      return snap
    }

    this.sfx?.playScan()
    const scanningSnap = this.stateMachine.startScan()
    this.scanCountdown = this.scanDurationSec
    this.syncAll(scanningSnap)
    this.logInfo(`[FieldFixAR] ScanStarted | duration=${this.scanDurationSec}s`)
    return scanningSnap
  }

  public selectHotspot(id: HotspotId): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    this.stepExplicitlyTargeted = true
    this.lastConfirmedHotspotId = null
    this.sfx?.playClick()
    const snap = this.stateMachine.selectHotspot(id)
    this.syncAll(snap)
    this.logInfo(
      `[FieldFixAR] HotspotSelected | hotspot=${snap.selectedHotspot} | code=${snap.selectedComponent.subsystemCode} | step=${snap.currentStep.stepNumber}/4`
    )
    return snap
  }

  public nextStep(): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    this.stepExplicitlyTargeted = true
    this.lastConfirmedHotspotId = null
    this.sfx?.playClick()
    const snap = this.stateMachine.nextStep()
    this.syncAll(snap)
    this.logInfo(
      `[FieldFixAR] StepNavigated(Next) | step=${snap.currentStep.stepNumber}/${snap.totalSteps} | target=${snap.selectedHotspot}`
    )
    return snap
  }

  public prevStep(): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    this.stepExplicitlyTargeted = true
    this.lastConfirmedHotspotId = null
    this.sfx?.playClick()
    const snap = this.stateMachine.prevStep()
    this.syncAll(snap)
    this.logInfo(
      `[FieldFixAR] StepNavigated(Prev) | step=${snap.currentStep.stepNumber}/${snap.totalSteps} | target=${snap.selectedHotspot}`
    )
    return snap
  }

  public confirmCurrentStep(): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    const preSnap = this.stateMachine.getSnapshot()
    if (
      preSnap.phase !== "READY_TO_SCAN" &&
      preSnap.phase !== "COMPLETED" &&
      preSnap.faultTraceComplete &&
      !preSnap.isCurrentStepDone
    ) {
      const nowSec = getTime()
      if (
        !this.stepExplicitlyTargeted &&
        this.minConfirmStepIntervalSec > 0 &&
        nowSec - this.lastConfirmStepTimeSec < this.minConfirmStepIntervalSec
      ) {
        this.logInfo(
          `[FieldFixAR] RapidDoubleTapBlocked | dt=${(nowSec - this.lastConfirmStepTimeSec).toFixed(3)}s | step=${preSnap.currentStep.stepNumber}/4`
        )
        return preSnap
      }
    }

    const result = this.stateMachine.confirmCurrentStep()
    if (result.interlockBlocked) {
      this.stepExplicitlyTargeted = true
      this.lastConfirmedHotspotId = null
      this.sfx?.playAlert()
      this.syncAll(result.snapshot)
      this.logInfo(
        `[FieldFixAR] SafetyInterlockBlocked | violations=${result.snapshot.safetyViolations} | redirectedStep=${result.snapshot.currentStep.stepNumber}/4 | target=${result.snapshot.selectedHotspot}`
      )
      return result.snapshot
    }
    if (result.stepExecuted >= 0) {
      this.lastConfirmStepTimeSec = getTime()
      this.stepExplicitlyTargeted = false
      this.lastConfirmedHotspotId = preSnap.currentStep.targetHotspot
    }
    if (result.newlyCompletedAll) {
      this.sfx?.playComplete()
    } else if (result.stepExecuted >= 0) {
      this.sfx?.playStepConfirm()
    } else {
      this.sfx?.playClick()
    }
    this.syncAll(result.snapshot)
    this.logInfo(
      `[FieldFixAR] StepConfirmed | executedStep=${result.stepExecuted + 1} | completed=${result.snapshot.completedCount}/${result.snapshot.totalSteps} | phase=${result.snapshot.phase} | temp=${result.snapshot.systemTempC}C | psi=${result.snapshot.systemPressurePsi} | flow=${result.snapshot.coolantFlowPct}% | score=${result.snapshot.trainingScorePct}%`
    )
    return result.snapshot
  }

  public toggleXrayMode(): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    this.sfx?.playClick()
    const snap = this.stateMachine.toggleXrayMode()
    this.syncAll(snap)
    this.logInfo(`[FieldFixAR] XrayToggled | xrayMode=${snap.xrayMode} | hotspot=${snap.selectedHotspot}`)
    return snap
  }

  public toggleComparisonMode(): FieldFixUISnapshot {
    if (this.stateMachine.phase === "SCANNING") {
      return this.stateMachine.getSnapshot()
    }
    this.sfx?.playClick()
    const snap = this.stateMachine.toggleComparisonMode()
    this.syncAll(snap)
    this.logInfo(
      `[FieldFixAR] ComparisonToggled | faultPreview=${snap.comparisonFaultPreview} | temp=${snap.systemTempC}C | psi=${snap.systemPressurePsi}`
    )
    return snap
  }

  public resetExperience(preserveShowcase: boolean = false): FieldFixUISnapshot {
    if (!preserveShowcase) {
      this.showcaseActive = false
    }
    this.scanCountdown = -1
    this.lastConfirmStepTimeSec = -10
    this.stepExplicitlyTargeted = true
    this.lastConfirmedHotspotId = null
    this.sfx?.stopScan()
    this.sfx?.playClick()
    this.equipmentMesh?.resetTransforms()
    const snap = this.stateMachine.reset()
    this.syncAll(snap)
    this.logInfo(
      `[FieldFixAR] Reset | phase=${snap.phase} | completed=${snap.completedCount}/${snap.totalSteps}`
    )
    return snap
  }

  public restartShowcase(): void {
    this.showcaseTime = 0
    this.showcaseStep = 0
    this.showcaseActive = true
    this.resetExperience(true)
    print("[Showcase] Restarted continuous journey from t=0.0s")
  }

  private tickShowcase(): void {
    if (!this.showcaseActive) return

    // Step 1: Trigger Scan at t = 3.5s (Laser sweep 1.2s -> DIAGNOSING at t=4.7s)
    if (this.showcaseStep === 0 && this.showcaseTime >= 3.5) {
      this.showcaseStep = 1
      print("[Showcase] t=3.5s: Triggering Telemetry Scan...")
      this.triggerScan()
    }
    // Step 2: Early skip guard check on CV-101 at t = 8.5s
    else if (this.showcaseStep === 1 && this.showcaseTime >= 8.5) {
      this.showcaseStep = 2
      print("[Showcase] t=8.5s: Trainee attempts early pinch on CV-101 (Skip Guard)...")
      this.selectHotspot("valve")
    }
    // Step 3: Upstream Trace 2/3 on PR-204 at t = 12.0s (Auto-X-Ray & 142 PSI Bottleneck)
    else if (this.showcaseStep === 2 && this.showcaseTime >= 12.0) {
      this.showcaseStep = 3
      print("[Showcase] t=12.0s: Trainee traces PR-204 (Auto-X-Ray & 142 PSI Bottleneck)...")
      this.selectHotspot("regulator")
    }
    // Step 4: Upstream Trace 3/3 on CV-101 at t = 17.5s (18% Flow Root Cause Discovered)
    else if (this.showcaseStep === 3 && this.showcaseTime >= 17.5) {
      this.showcaseStep = 4
      print("[Showcase] t=17.5s: Trainee traces CV-101 (18% Flow Root Cause Discovered)...")
      this.selectHotspot("valve")
    }
    // Step 5: Unsafe Out-of-Order Action on PR-204 (LOTO Safety Interlock) at t = 23.0s
    else if (this.showcaseStep === 4 && this.showcaseTime >= 23.0) {
      this.showcaseStep = 5
      print("[Showcase] t=23.0s: Trainee attempts out-of-order PR-204 purge (LOTO Interlock Block)...")
      this.selectHotspot("regulator")
      this.confirmCurrentStep()
    }
    // Step 6: Correct Step 1: Isolate CV-101 Valve at t = 28.5s
    else if (this.showcaseStep === 5 && this.showcaseTime >= 28.5) {
      this.showcaseStep = 6
      print("[Showcase] t=28.5s: Step 1: Isolate CV-101 Valve (LOTO Lock Snap)...")
      this.selectHotspot("valve")
      this.confirmCurrentStep()
    }
    // Step 7: Correct Step 2: Purge PR-204 Regulator at t = 34.5s
    else if (this.showcaseStep === 6 && this.showcaseTime >= 34.5) {
      this.showcaseStep = 7
      print("[Showcase] t=34.5s: Step 2: Purge PR-204 Regulator (Plume Burst & 38 PSI)...")
      this.selectHotspot("regulator")
      this.confirmCurrentStep()
    }
    // Step 8: Correct Step 3: Reseat TR-309 Relay Core at t = 40.5s
    else if (this.showcaseStep === 7 && this.showcaseTime >= 40.5) {
      this.showcaseStep = 8
      print("[Showcase] t=40.5s: Step 3: Reseat TR-309 Relay (Plunger Retract & Cool 46C)...")
      this.selectHotspot("relay")
      this.confirmCurrentStep()
    }
    // Step 9: Correct Step 4: Restore CV-101 Coolant Flow at t = 46.5s
    else if (this.showcaseStep === 8 && this.showcaseTime >= 46.5) {
      this.showcaseStep = 9
      print("[Showcase] t=46.5s: Step 4: Remove LOTO & Open CV-101 (100% Flow & 85% Scorecard)...")
      this.selectHotspot("valve")
      this.confirmCurrentStep()
    }
    // Step 10: Reset Unit at t = 53.0s
    else if (this.showcaseStep === 9 && this.showcaseTime >= 53.0) {
      this.showcaseStep = 10
      print("[Showcase] t=53.0s: Reset Unit to Standby...")
      this.resetExperience(true)
    }
    // Step 11: Run 2 Clean Scan at t = 54.5s
    else if (this.showcaseStep === 10 && this.showcaseTime >= 54.5) {
      this.showcaseStep = 11
      print("[Showcase] t=54.5s: Run 2 Clean Scan...")
      this.triggerScan(true)
    }
    // Step 12: Run 2 Trace PR-204 at t = 56.0s
    else if (this.showcaseStep === 11 && this.showcaseTime >= 56.0) {
      this.showcaseStep = 12
      this.selectHotspot("regulator")
    }
    // Step 13: Run 2 Trace CV-101 at t = 57.5s
    else if (this.showcaseStep === 12 && this.showcaseTime >= 57.5) {
      this.showcaseStep = 13
      this.selectHotspot("valve")
    }
    // Step 14: Run 2 Step 1 at t = 59.0s
    else if (this.showcaseStep === 13 && this.showcaseTime >= 59.0) {
      this.showcaseStep = 14
      this.selectHotspot("valve")
      this.confirmCurrentStep()
    }
    // Step 15: Run 2 Step 2 at t = 60.5s
    else if (this.showcaseStep === 14 && this.showcaseTime >= 60.5) {
      this.showcaseStep = 15
      this.selectHotspot("regulator")
      this.confirmCurrentStep()
    }
    // Step 16: Run 2 Step 3 at t = 62.0s
    else if (this.showcaseStep === 15 && this.showcaseTime >= 62.0) {
      this.showcaseStep = 16
      this.selectHotspot("relay")
      this.confirmCurrentStep()
    }
    // Step 17: Run 2 Step 4 at t = 63.5s (100% Scorecard)
    else if (this.showcaseStep === 16 && this.showcaseTime >= 63.5) {
      this.showcaseStep = 17
      print("[Showcase] t=63.5s: Run 2 Step 4 Complete (100% Scorecard)...")
      this.selectHotspot("valve")
      this.confirmCurrentStep()
    }
    // Step 18: Toggle Compare Mode (Fault Snapshot) at t = 66.5s
    else if (this.showcaseStep === 17 && this.showcaseTime >= 66.5) {
      this.showcaseStep = 18
      print("[Showcase] t=66.5s: Toggle Compare Mode (Fault Snapshot)...")
      this.toggleComparisonMode()
    }
    // Step 19: Toggle Compare Mode (Nominal State) at t = 69.5s
    else if (this.showcaseStep === 18 && this.showcaseTime >= 69.5) {
      this.showcaseStep = 19
      print("[Showcase] t=69.5s: Toggle Compare Mode (Nominal State)...")
      this.toggleComparisonMode()
    }
    // Step 20: Done at t = 72.0s
    else if (this.showcaseStep === 19 && this.showcaseTime >= 72.0) {
      this.showcaseStep = 20
      this.showcaseActive = false
      print("[Showcase] Continuous Journey Complete at t=72.0s!")
    }
  }

  public getSnapshot(): FieldFixUISnapshot {
    return this.stateMachine.getSnapshot()
  }

  private syncAll(snapshot: FieldFixUISnapshot): void {
    this.equipmentMesh?.applySnapshot(snapshot)
    this.diagnosticUI?.renderSnapshot(snapshot)
  }
}
