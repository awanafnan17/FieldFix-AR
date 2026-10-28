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
      if (this.scanCountdown > 0) {
        this.scanCountdown -= Math.min(ev.getDeltaTime(), 0.05)
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

  public resetExperience(): FieldFixUISnapshot {
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

  public getSnapshot(): FieldFixUISnapshot {
    return this.stateMachine.getSnapshot()
  }

  private syncAll(snapshot: FieldFixUISnapshot): void {
    this.equipmentMesh?.applySnapshot(snapshot)
    this.diagnosticUI?.renderSnapshot(snapshot)
  }
}
