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
        this.scanCountdown -= ev.getDeltaTime()
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
   *   pinching the 3D component directly executes that physical repair step!
   * - Otherwise, it selects that component for inspection.
   */
  public handle3DHotspotPinch(id: HotspotId): FieldFixUISnapshot {
    const current = this.stateMachine.getSnapshot()
    if (
      (current.phase === "DIAGNOSING" || current.phase === "REPAIRING") &&
      current.selectedHotspot === id &&
      current.currentStep.targetHotspot === id &&
      !current.isCurrentStepDone
    ) {
      print(
        `[FieldFixAR] Direct3DHotspotAction | hotspot=${id} | step=${current.currentStep.stepNumber}/${current.totalSteps}`
      )
      return this.confirmCurrentStep()
    }
    return this.selectHotspot(id)
  }

  public triggerScan(immediate: boolean = false): FieldFixUISnapshot {
    this.audioController?.playScan()
    if (immediate || this.scanDurationSec <= 0.05) {
      this.scanCountdown = -1
      const snap = this.stateMachine.completeScan()
      this.audioController?.playAlert()
      this.syncAll(snap)
      print(`[FieldFixAR] ScanComplete(Immediate) | phase=${snap.phase} | hotspot=${snap.selectedHotspot}`)
      return snap
    }

    const scanningSnap = this.stateMachine.startScan()
    this.scanCountdown = this.scanDurationSec
    this.syncAll(scanningSnap)
    print(`[FieldFixAR] ScanStarted | duration=${this.scanDurationSec}s`)
    return scanningSnap
  }

  public selectHotspot(id: HotspotId): FieldFixUISnapshot {
    this.scanCountdown = -1
    this.audioController?.playClick()
    const snap = this.stateMachine.selectHotspot(id)
    this.syncAll(snap)
    print(
      `[FieldFixAR] HotspotSelected | hotspot=${snap.selectedHotspot} | code=${snap.selectedComponent.subsystemCode} | step=${snap.currentStep.stepNumber}/4`
    )
    return snap
  }

  public nextStep(): FieldFixUISnapshot {
    this.scanCountdown = -1
    this.audioController?.playClick()
    const snap = this.stateMachine.nextStep()
    this.syncAll(snap)
    print(
      `[FieldFixAR] StepNavigated(Next) | step=${snap.currentStep.stepNumber}/${snap.totalSteps} | target=${snap.selectedHotspot}`
    )
    return snap
  }

  public prevStep(): FieldFixUISnapshot {
    this.scanCountdown = -1
    this.audioController?.playClick()
    const snap = this.stateMachine.prevStep()
    this.syncAll(snap)
    print(
      `[FieldFixAR] StepNavigated(Prev) | step=${snap.currentStep.stepNumber}/${snap.totalSteps} | target=${snap.selectedHotspot}`
    )
    return snap
  }

  public confirmCurrentStep(): FieldFixUISnapshot {
    this.scanCountdown = -1
    const result = this.stateMachine.confirmCurrentStep()
    if (result.newlyCompletedAll) {
      this.audioController?.playComplete()
    } else {
      this.audioController?.playStepConfirm()
    }
    this.syncAll(result.snapshot)
    print(
      `[FieldFixAR] StepConfirmed | executedStep=${result.stepExecuted + 1} | completed=${result.snapshot.completedCount}/${result.snapshot.totalSteps} | phase=${result.snapshot.phase} | temp=${result.snapshot.systemTempC}C | psi=${result.snapshot.systemPressurePsi} | flow=${result.snapshot.coolantFlowPct}%`
    )
    return result.snapshot
  }

  public resetExperience(): FieldFixUISnapshot {
    this.scanCountdown = -1
    this.audioController?.playClick()
    const snap = this.stateMachine.reset()
    this.syncAll(snap)
    print(
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
