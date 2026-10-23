/**
 * FieldFixDiagnosticUI.ts
 * World-space SpectaclesUIKit diagnostic & guided repair interface for FieldFix AR.
 *
 * Strictly adheres to CLAD Channel-A UI architecture:
 * - All UIKit primitives (Frame, Button, ProgressBar) and Component.Text live exclusively in this *UI.ts module.
 * - Exposes typed Event<T> emitters for user actions and renderSnapshot() for state updates.
 * - Includes high-contrast dark backing pills and dynamic component status descriptions for SPECS 27.
 */

import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import { Frame } from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import { ProgressBar } from "SpectaclesUIKit.lspkg/Scripts/Components/ProgressBar/ProgressBar"
import { FaultSeverity, FieldFixUISnapshot, HotspotId } from "./FieldFixState"

interface ButtonHandle {
  obj: SceneObject
  btn: Button
  label: Text
}

@component
export class FieldFixDiagnosticUI extends BaseScriptComponent {
  private onScanRequestedEvent = new Event<void>()
  public readonly onScanRequested: PublicApi<void> = this.onScanRequestedEvent.publicApi()

  private onSelectHotspotEvent = new Event<HotspotId>()
  public readonly onSelectHotspot: PublicApi<HotspotId> = this.onSelectHotspotEvent.publicApi()

  private onPrevStepEvent = new Event<void>()
  public readonly onPrevStep: PublicApi<void> = this.onPrevStepEvent.publicApi()

  private onNextStepEvent = new Event<void>()
  public readonly onNextStep: PublicApi<void> = this.onNextStepEvent.publicApi()

  private onConfirmStepEvent = new Event<void>()
  public readonly onConfirmStep: PublicApi<void> = this.onConfirmStepEvent.publicApi()

  private onResetRequestedEvent = new Event<void>()
  public readonly onResetRequested: PublicApi<void> = this.onResetRequestedEvent.publicApi()

  private frame: Frame | null = null
  private contentRoot: SceneObject | null = null
  private uiReady: boolean = false
  private pendingSnapshot: FieldFixUISnapshot | null = null

  // Panel Text elements
  private titleBrandText: Text | null = null
  private headerBadgeText: Text | null = null
  private telemetryBarText: Text | null = null
  private componentTitleText: Text | null = null
  private rootCauseText: Text | null = null
  private stepHeaderText: Text | null = null
  private stepInstructionText: Text | null = null
  private safetyWarningText: Text | null = null
  private stepChecklistStripText: Text | null = null
  private progressLabelText: Text | null = null

  // Floating 3D Spatial Equipment Callout Badges
  private calloutHeaderText: Text | null = null
  private calloutValveText: Text | null = null
  private calloutRegulatorText: Text | null = null
  private calloutRelayText: Text | null = null

  // ProgressBar
  private progressBar: ProgressBar | null = null

  // Interactive UIKit Buttons
  private btnValve: ButtonHandle | null = null
  private btnRegulator: ButtonHandle | null = null
  private btnRelay: ButtonHandle | null = null
  private btnPrimaryAction: ButtonHandle | null = null
  private btnPrev: ButtonHandle | null = null
  private btnNext: ButtonHandle | null = null
  private btnReset: ButtonHandle | null = null

  public onAwake(): void {
    const frame = this.sceneObject.createComponent(Frame.getTypeName()) as Frame
    frame.autoShowHide = false
    frame.autoScaleContent = false
    frame.allowScaling = false
    frame.allowTranslation = false
    this.frame = frame

    frame.onInitialized.add(() => {
      frame.innerSize = new vec2(28, 39)
      frame.padding = new vec2(0.8, 0.8)
      frame.syncScaleBaseline()

      // Since this HUD panel is stationary (allowTranslation=false, allowScaling=false),
      // disable Frame's own root Interactable/Manipulation/Billboard so its border collider
      // and yaw tilt never intercept SIK raycasts aimed at child UIKit buttons.
      const scripts = this.sceneObject.getComponents("Component.ScriptComponent")
      for (let i = 0; i < scripts.length; i++) {
        const s = scripts[i] as any
        const tName = s.getTypeName ? s.getTypeName() : ""
        if (s !== (this as any) && s !== (frame as any)) {
          if (
            s.onTriggerStart !== undefined ||
            s.canTranslate !== undefined ||
            s.xAxisEnabled !== undefined ||
            tName.indexOf("Interact") >= 0 ||
            tName.indexOf("Billboard") >= 0
          ) {
            s.enabled = false
          }
        }
      }
      this.sceneObject.getTransform().setLocalRotation(quat.quatIdentity())

      this.buildPanelContents()
      this.buildSpatialEquipmentCallouts()
      this.uiReady = true
      if (this.pendingSnapshot) {
        this.renderSnapshot(this.pendingSnapshot)
      }
    })
  }

  private buildPanelContents(): void {
    const root = global.scene.createSceneObject("DiagnosticPanelContent")
    root.setParent(this.sceneObject)
    root.getTransform().setLocalPosition(new vec3(0, 0, 0.8))
    this.contentRoot = root

    // 1. Top App Title & Status Badge
    this.titleBrandText = this.createTextLabel(
      root,
      "TitleBrandText",
      new vec3(0, 17.2, 0.1),
      new vec2(26.4, 2.3),
      "FIELDFIX AR  //  MAINTENANCE TRAINING SIMULATION",
      33,
      new vec4(0.62, 0.95, 1.0, 1.0),
      true,
      new vec4(0.04, 0.10, 0.18, 0.92)
    )

    this.headerBadgeText = this.createTextLabel(
      root,
      "HeaderBadgeText",
      new vec3(0, 14.8, 0.15),
      new vec2(26.4, 2.5),
      "STANDBY: CRYO-PUMP UNIT #04",
      44,
      new vec4(1.0, 0.84, 0.30, 1.0),
      true,
      new vec4(0.14, 0.08, 0.03, 0.94)
    )

    // 2. Live Telemetry Readout Row
    this.telemetryBarText = this.createTextLabel(
      root,
      "TelemetryBarText",
      new vec3(0, 12.3, 0.15),
      new vec2(26.4, 2.3),
      "SIM TELEMETRY: 118C  |  142 PSI  |  FLOW: 18%",
      36,
      new vec4(0.50, 0.96, 1.0, 1.0),
      true,
      new vec4(0.04, 0.11, 0.17, 0.92)
    )

    // 3. Subsystem Hotspot Selector Row (3 UIKit Buttons)
    this.btnValve = this.createUIButton(
      root,
      "BtnHotspotValve",
      new vec3(-8.6, 9.3, 0.95),
      new vec3(8.0, 3.4, 1.2),
      "CV-101 VALVE",
      31,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("valve")
      }
    )

    this.btnRegulator = this.createUIButton(
      root,
      "BtnHotspotRegulator",
      new vec3(0.0, 9.3, 0.95),
      new vec3(8.0, 3.4, 1.2),
      "PR-204 REG",
      31,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("regulator")
      }
    )

    this.btnRelay = this.createUIButton(
      root,
      "BtnHotspotRelay",
      new vec3(8.6, 9.3, 0.95),
      new vec3(8.0, 3.4, 1.2),
      "TR-309 RELAY",
      31,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("relay")
      }
    )

    // 4. Selected Component Diagnosis Section
    this.componentTitleText = this.createTextLabel(
      root,
      "ComponentTitleText",
      new vec3(0, 6.0, 0.15),
      new vec2(26.4, 2.3),
      "[TR-309] CRITICAL: CORE OVERHEAT (118C)",
      38,
      new vec4(1.0, 0.42, 0.42, 1.0),
      true,
      new vec4(0.15, 0.05, 0.06, 0.92)
    )

    this.rootCauseText = this.createTextLabel(
      root,
      "RootCauseText",
      new vec3(0, 3.4, 0.1),
      new vec2(26.2, 2.8),
      "Simulated thermal latch tripped due to coolant starvation.",
      32,
      new vec4(0.92, 0.97, 1.0, 1.0),
      true,
      new vec4(0.04, 0.08, 0.14, 0.88)
    )

    // 5. Guided 4-Step Repair Card Section
    this.stepHeaderText = this.createTextLabel(
      root,
      "StepHeaderText",
      new vec3(0, 0.6, 0.15),
      new vec2(26.4, 2.4),
      "STEP 1/4: LOCKOUT ISOLATION VALVE",
      40,
      new vec4(1.0, 0.88, 0.36, 1.0),
      true,
      new vec4(0.12, 0.10, 0.03, 0.92)
    )

    this.stepInstructionText = this.createTextLabel(
      root,
      "StepInstructionText",
      new vec3(0, -2.1, 0.1),
      new vec2(26.2, 3.0),
      "Pinch 3D CV-101 Valve or EXECUTE button to rotate valve 90 deg and apply LOTO clasp.",
      32,
      new vec4(1.0, 1.0, 1.0, 1.0),
      true,
      new vec4(0.04, 0.08, 0.14, 0.88)
    )

    this.safetyWarningText = this.createTextLabel(
      root,
      "SafetyWarningText",
      new vec3(0, -4.8, 0.1),
      new vec2(26.2, 2.1),
      "SAFETY: Verify LOTO tag & hand clearance on intake wheel.",
      29,
      new vec4(1.0, 0.78, 0.34, 1.0),
      true,
      new vec4(0.12, 0.08, 0.03, 0.88)
    )

    // 6. 4-Step Visual Checklist Strip + Progress Bar + Counter
    this.stepChecklistStripText = this.createTextLabel(
      root,
      "StepChecklistStripText",
      new vec3(0, -7.1, 0.15),
      new vec2(26.4, 2.0),
      "[1:LOTO ..]   [2:PURGE ..]   [3:RESEAT ..]   [4:FLOW ..]",
      30,
      new vec4(0.78, 0.95, 1.0, 1.0),
      true,
      new vec4(0.04, 0.10, 0.16, 0.92)
    )

    const progObj = global.scene.createSceneObject("RepairProgressBar")
    progObj.setParent(root)
    progObj.getTransform().setLocalPosition(new vec3(-3.6, -9.4, 0.15))
    const prog = progObj.createComponent(ProgressBar.getTypeName()) as ProgressBar
    prog.size = new vec3(17.5, 1.0, 1.0)
    prog.currentValue = 0
    this.progressBar = prog

    this.progressLabelText = this.createTextLabel(
      root,
      "ProgressLabelText",
      new vec3(9.2, -9.4, 0.15),
      new vec2(7.2, 2.1),
      "0 / 4 DONE",
      33,
      new vec4(0.45, 1.0, 0.70, 1.0),
      true,
      new vec4(0.04, 0.14, 0.08, 0.85)
    )

    // 7. Primary Confirm / Scan Action Button
    this.btnPrimaryAction = this.createUIButton(
      root,
      "BtnPrimaryAction",
      new vec3(0, -12.3, 0.75),
      new vec3(25.0, 3.6, 1.0),
      "SCAN EQUIPMENT TELEMETRY",
      37,
      "Primary",
      () => {
        if (this.pendingSnapshot && this.pendingSnapshot.phase === "READY_TO_SCAN") {
          this.onScanRequestedEvent.invoke()
        } else {
          this.onConfirmStepEvent.invoke()
        }
      }
    )

    // 8. Bottom Navigation Row: Prev Step | Next Step | Reset Unit
    this.btnPrev = this.createUIButton(
      root,
      "BtnPrevStep",
      new vec3(-8.6, -16.3, 1.15),
      new vec3(8.0, 3.4, 1.2),
      "< PREV STEP",
      30,
      "PrimaryNeutral",
      () => {
        this.onPrevStepEvent.invoke()
      }
    )

    this.btnNext = this.createUIButton(
      root,
      "BtnNextStep",
      new vec3(0.0, -16.3, 1.15),
      new vec3(8.0, 3.4, 1.2),
      "NEXT STEP >",
      30,
      "PrimaryNeutral",
      () => {
        this.onNextStepEvent.invoke()
      }
    )

    this.btnReset = this.createUIButton(
      root,
      "BtnResetUnit",
      new vec3(8.6, -16.3, 1.15),
      new vec3(8.0, 3.4, 1.2),
      "RESET UNIT",
      30,
      "Secondary",
      () => {
        this.onResetRequestedEvent.invoke()
      }
    )
  }

  private buildSpatialEquipmentCallouts(): void {
    const calloutsRoot = global.scene.createSceneObject("SpatialEquipmentCallouts")
    calloutsRoot.setParent(this.sceneObject)
    // Positioned in DiagnosticUIRoot space so badges float cleanly above/below the 3D Equipment Assembly on the left
    calloutsRoot.getTransform().setLocalPosition(new vec3(-30.5, -3.5, 3.0))

    this.calloutHeaderText = this.createTextLabel(
      calloutsRoot,
      "CalloutUnitHeader",
      new vec3(0, 14.5, 0.5),
      new vec2(23.5, 2.5),
      "UNIT #04: READY FOR SPATIAL SCAN",
      36,
      new vec4(0.55, 0.96, 1.0, 1.0),
      true,
      new vec4(0.04, 0.09, 0.16, 0.94)
    )

    this.calloutRegulatorText = this.createTextLabel(
      calloutsRoot,
      "CalloutRegulatorBadge",
      new vec3(1.6, 11.5, 1.0),
      new vec2(18.0, 2.3),
      "PR-204: 142 PSI [OVER-PRESSURE]",
      33,
      new vec4(1.0, 0.80, 0.28, 1.0),
      true,
      new vec4(0.14, 0.09, 0.03, 0.94)
    )

    this.calloutValveText = this.createTextLabel(
      calloutsRoot,
      "CalloutValveBadge",
      new vec3(-8.4, -5.9, 1.2),
      new vec2(15.8, 2.3),
      "CV-101: 18% FLOW [WARN]",
      33,
      new vec4(1.0, 0.80, 0.28, 1.0),
      true,
      new vec4(0.14, 0.09, 0.03, 0.94)
    )

    this.calloutRelayText = this.createTextLabel(
      calloutsRoot,
      "CalloutRelayBadge",
      new vec3(8.4, -5.9, 1.2),
      new vec2(15.8, 2.3),
      "TR-309: 118C [OVERHEAT]",
      33,
      new vec4(1.0, 0.40, 0.40, 1.0),
      true,
      new vec4(0.16, 0.04, 0.05, 0.94)
    )
  }

  private createTextLabel(
    parent: SceneObject,
    name: string,
    localPos: vec3,
    rectSize: vec2,
    initialText: string,
    fontSize: number,
    color: vec4,
    withPillBg: boolean = false,
    pillColor: vec4 = new vec4(0.05, 0.08, 0.14, 0.82)
  ): Text {
    const obj = global.scene.createSceneObject(name)
    obj.setParent(parent)
    obj.getTransform().setLocalPosition(localPos)

    const txt = obj.createComponent("Component.Text") as Text
    txt.text = initialText
    txt.size = fontSize
    txt.weight = 700
    txt.layoutRect = Rect.create(-rectSize.x * 0.5, rectSize.x * 0.5, -rectSize.y * 0.5, rectSize.y * 0.5)
    txt.horizontalAlignment = HorizontalAlignment.Center
    txt.verticalAlignment = VerticalAlignment.Center
    txt.horizontalOverflow = HorizontalOverflow.Wrap
    txt.verticalOverflow = VerticalOverflow.Overflow
    txt.textFill.mode = TextFillMode.Solid
    txt.textFill.color = color

    txt.dropshadowSettings.enabled = true
    txt.dropshadowSettings.offset = new vec2(0.12, -0.12)
    txt.dropshadowSettings.fill.mode = TextFillMode.Solid
    txt.dropshadowSettings.fill.color = new vec4(0.0, 0.0, 0.0, 0.9)

    if (withPillBg) {
      txt.backgroundSettings.enabled = true
      txt.backgroundSettings.fill.mode = TextFillMode.Solid
      txt.backgroundSettings.fill.color = pillColor
      txt.backgroundSettings.cornerRadius = 0.35
      txt.backgroundSettings.margins = Rect.create(-0.6, 0.6, -0.26, 0.26)
    }

    txt.renderOrder = 30
    return txt
  }

  private createUIButton(
    parent: SceneObject,
    name: string,
    localPos: vec3,
    size: vec3,
    labelText: string,
    fontSize: number,
    style: string,
    onPress: () => void
  ): ButtonHandle {
    const obj = global.scene.createSceneObject(name)
    obj.setParent(parent)
    obj.getTransform().setLocalPosition(localPos)

    const btn = obj.createComponent(Button.getTypeName()) as Button
    btn.setVariant({
      theme: "SnapOS2",
      shape: "Rectangle",
      style
    })
    btn.size = size
    btn.initialize()
    btn.onTriggerUp.add(() => {
      onPress()
    })

    const labelObj = global.scene.createSceneObject(name + "_Label")
    labelObj.setParent(obj)
    labelObj.getTransform().setLocalPosition(new vec3(0, 0, 0.35))

    const label = labelObj.createComponent("Component.Text") as Text
    label.text = labelText
    label.size = fontSize
    label.weight = 700
    label.layoutRect = Rect.create(-size.x * 0.48, size.x * 0.48, -size.y * 0.46, size.y * 0.46)
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Wrap
    label.verticalOverflow = VerticalOverflow.Overflow
    label.textFill.mode = TextFillMode.Solid
    label.textFill.color = new vec4(1, 1, 1, 1)
    label.dropshadowSettings.enabled = true
    label.dropshadowSettings.offset = new vec2(0.12, -0.12)
    label.dropshadowSettings.fill.mode = TextFillMode.Solid
    label.dropshadowSettings.fill.color = new vec4(0.0, 0.0, 0.0, 0.9)
    label.renderOrder = 35

    return { obj, btn, label }
  }

  private severityColor(severity: FaultSeverity): vec4 {
    switch (severity) {
      case "critical":
        return new vec4(1.0, 0.38, 0.38, 1.0)
      case "fault":
        return new vec4(1.0, 0.62, 0.24, 1.0)
      case "warning":
        return new vec4(1.0, 0.86, 0.32, 1.0)
      case "nominal":
        return new vec4(0.32, 0.98, 0.58, 1.0)
    }
  }

  public renderSnapshot(snapshot: FieldFixUISnapshot): void {
    this.pendingSnapshot = snapshot
    if (!this.uiReady) return

    // 1. Header Badge
    if (this.headerBadgeText) {
      this.headerBadgeText.text = snapshot.headerBadgeText
      this.headerBadgeText.textFill.color = this.severityColor(snapshot.headerSeverity)
    }

    // 2. Live Telemetry Bar
    if (this.telemetryBarText) {
      const flowStatus = snapshot.phase === "COMPLETED" ? "NOMINAL" : "SIMULATED"
      this.telemetryBarText.text =
        `SIM TELEMETRY: ${snapshot.systemTempC}C  |  ${snapshot.systemPressurePsi} PSI  |  FLOW: ${snapshot.coolantFlowPct}% (${flowStatus})`
      this.telemetryBarText.textFill.color =
        snapshot.phase === "COMPLETED"
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : new vec4(0.48, 0.96, 1.0, 1.0)
    }

    // 3. Hotspot Button Active Highlight Labels
    this.updateHotspotButtonLabel(this.btnValve, "valve", "CV-101 VALVE", snapshot)
    this.updateHotspotButtonLabel(this.btnRegulator, "regulator", "PR-204 REG", snapshot)
    this.updateHotspotButtonLabel(this.btnRelay, "relay", "TR-309 RELAY", snapshot)

    // 4. Selected Component Details
    const comp = snapshot.selectedComponent
    const compRepaired =
      snapshot.phase === "COMPLETED" ||
      (comp.id === "valve" && snapshot.completedSteps[0] && snapshot.completedSteps[3]) ||
      (comp.id === "regulator" && snapshot.completedSteps[1]) ||
      (comp.id === "relay" && snapshot.completedSteps[2])
    const valveLockedOutMidRepair =
      comp.id === "valve" && snapshot.completedSteps[0] && !snapshot.completedSteps[3]

    if (this.componentTitleText) {
      const statusText = compRepaired
        ? comp.nominalStatusLabel
        : valveLockedOutMidRepair
          ? "LOTO ISOLATED: INTAKE LOCKED (0% FLOW)"
          : comp.faultStatusLabel
      this.componentTitleText.text = `[${comp.subsystemCode}] ${statusText}`
      this.componentTitleText.textFill.color = compRepaired
        ? new vec4(0.32, 0.98, 0.58, 1.0)
        : valveLockedOutMidRepair
          ? new vec4(0.45, 0.96, 1.0, 1.0)
          : this.severityColor(comp.initialSeverity)
    }

    if (this.rootCauseText) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.rootCauseText.text =
          "Training Standby: Pinch [SCAN EQUIPMENT TELEMETRY] or any 3D hotspot on Unit #04 to localize simulated faults."
        this.rootCauseText.textFill.color = new vec4(0.90, 0.96, 1.0, 1.0)
      } else if (compRepaired) {
        this.rootCauseText.text = comp.repairedSummary
        this.rootCauseText.textFill.color = new vec4(0.62, 1.0, 0.80, 1.0)
      } else if (valveLockedOutMidRepair && comp.lockedOutSummary) {
        this.rootCauseText.text = comp.lockedOutSummary
        this.rootCauseText.textFill.color = new vec4(0.65, 0.96, 1.0, 1.0)
      } else {
        this.rootCauseText.text = comp.rootCause
        this.rootCauseText.textFill.color = new vec4(0.92, 0.97, 1.0, 1.0)
      }
    }

    // 5. Guided Step Instructions
    const step = snapshot.currentStep
    if (this.stepHeaderText) {
      if (snapshot.phase === "COMPLETED") {
        this.stepHeaderText.text = "REPAIR COMPLETE: ALL 4 STEPS VERIFIED"
        this.stepHeaderText.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else {
        const doneTag = snapshot.isCurrentStepDone ? " [DONE]" : ""
        this.stepHeaderText.text = `${step.title}${doneTag}`
        this.stepHeaderText.textFill.color = snapshot.isCurrentStepDone
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : new vec4(1.0, 0.88, 0.36, 1.0)
      }
    }

    if (this.stepInstructionText) {
      if (snapshot.phase === "COMPLETED") {
        this.stepInstructionText.text =
          "Cryo-Coolant Pump & Relay Unit #04 operating at nominal parameters (42C, 45 PSI, 100% Flow)."
      } else {
        this.stepInstructionText.text = `${step.actionInstruction} (Pinch 3D target or EXECUTE button)`
      }
    }

    if (this.safetyWarningText) {
      if (snapshot.phase === "COMPLETED") {
        this.safetyWarningText.text = "SERVICE LOGGED: Lockout tags cleared. Pinch RESET UNIT to replay scenario."
        this.safetyWarningText.textFill.color = new vec4(0.55, 0.98, 0.75, 1.0)
      } else {
        this.safetyWarningText.text = `${step.safetyWarning} (${step.verificationMetric})`
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.76, 0.32, 1.0)
      }
    }

    // 6. 4-Step Visual Checklist Strip + Progress Bar
    if (this.stepChecklistStripText) {
      const s0 = snapshot.completedSteps[0] ? "OK" : snapshot.currentStepIndex === 0 ? ">>" : ".."
      const s1 = snapshot.completedSteps[1] ? "OK" : snapshot.currentStepIndex === 1 ? ">>" : ".."
      const s2 = snapshot.completedSteps[2] ? "OK" : snapshot.currentStepIndex === 2 ? ">>" : ".."
      const s3 = snapshot.completedSteps[3] ? "OK" : snapshot.currentStepIndex === 3 ? ">>" : ".."
      this.stepChecklistStripText.text = `[1:LOTO ${s0}]   [2:PURGE ${s1}]   [3:RESEAT ${s2}]   [4:FLOW ${s3}]`
      this.stepChecklistStripText.textFill.color =
        snapshot.phase === "COMPLETED"
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : new vec4(0.75, 0.94, 1.0, 1.0)
    }

    const ratio = snapshot.totalSteps > 0 ? snapshot.completedCount / snapshot.totalSteps : 0
    if (this.progressBar) {
      this.progressBar.currentValue = ratio
    }
    if (this.progressLabelText) {
      this.progressLabelText.text = `${snapshot.completedCount} / ${snapshot.totalSteps} DONE`
    }

    // 7. Primary Action Button Label
    if (this.btnPrimaryAction) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.btnPrimaryAction.label.text = "SCAN EQUIPMENT TELEMETRY"
        this.btnPrimaryAction.label.textFill.color = new vec4(0.55, 0.98, 1.0, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.btnPrimaryAction.label.text = "SCANNING SUBSYSTEMS..."
        this.btnPrimaryAction.label.textFill.color = new vec4(1.0, 0.88, 0.35, 1.0)
      } else if (snapshot.phase === "COMPLETED") {
        this.btnPrimaryAction.label.text = "SYSTEM VERIFIED NOMINAL (100%)"
        this.btnPrimaryAction.label.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else if (snapshot.isCurrentStepDone) {
        this.btnPrimaryAction.label.text = `STEP ${step.stepNumber} VERIFIED (RE-CONFIRM)`
        this.btnPrimaryAction.label.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else {
        this.btnPrimaryAction.label.text = step.confirmButtonLabel
        this.btnPrimaryAction.label.textFill.color = new vec4(1.0, 1.0, 1.0, 1.0)
      }
    }

    // 8. Update Floating 3D Spatial Equipment Callouts
    this.updateSpatialCallouts(snapshot)
  }

  private updateSpatialCallouts(snapshot: FieldFixUISnapshot): void {
    const green = new vec4(0.32, 0.98, 0.58, 1.0)
    const cyan = new vec4(0.45, 0.96, 1.0, 1.0)
    const amber = new vec4(1.0, 0.82, 0.30, 1.0)
    const red = new vec4(1.0, 0.40, 0.40, 1.0)

    if (this.calloutHeaderText) {
      if (snapshot.phase === "COMPLETED") {
        this.calloutHeaderText.text = "UNIT #04: ALL SUBSYSTEMS NOMINAL"
        this.calloutHeaderText.textFill.color = green
      } else if (snapshot.phase === "READY_TO_SCAN") {
        this.calloutHeaderText.text = "UNIT #04: READY FOR SPATIAL SCAN"
        this.calloutHeaderText.textFill.color = cyan
      } else {
        this.calloutHeaderText.text = `UNIT #04: STEP ${snapshot.currentStep.stepNumber}/4 -> PINCH [${snapshot.selectedComponent.subsystemCode}]`
        this.calloutHeaderText.textFill.color = amber
      }
    }

    if (this.calloutValveText) {
      if (snapshot.completedSteps[3] || snapshot.phase === "COMPLETED") {
        this.calloutValveText.text = "CV-101: 100% FLOW [OK]"
        this.calloutValveText.textFill.color = green
      } else if (snapshot.completedSteps[0]) {
        this.calloutValveText.text = "CV-101: LOTO LOCKED (0%)"
        this.calloutValveText.textFill.color = cyan
      } else {
        this.calloutValveText.text = "CV-101: 18% FLOW [WARN]"
        this.calloutValveText.textFill.color = snapshot.selectedHotspot === "valve" ? cyan : amber
      }
    }

    if (this.calloutRegulatorText) {
      if (snapshot.completedSteps[1] || snapshot.phase === "COMPLETED") {
        this.calloutRegulatorText.text = `PR-204: ${snapshot.systemPressurePsi} PSI [REGULATED]`
        this.calloutRegulatorText.textFill.color = green
      } else {
        this.calloutRegulatorText.text = "PR-204: 142 PSI [OVER-PRESSURE]"
        this.calloutRegulatorText.textFill.color = snapshot.selectedHotspot === "regulator" ? cyan : amber
      }
    }

    if (this.calloutRelayText) {
      if (snapshot.completedSteps[2] || snapshot.phase === "COMPLETED") {
        this.calloutRelayText.text = `TR-309: ${snapshot.systemTempC}C [COOLED]`
        this.calloutRelayText.textFill.color = green
      } else {
        this.calloutRelayText.text = `TR-309: ${snapshot.systemTempC}C [OVERHEAT]`
        this.calloutRelayText.textFill.color = snapshot.selectedHotspot === "relay" ? cyan : red
      }
    }
  }

  private updateHotspotButtonLabel(
    handle: ButtonHandle | null,
    id: HotspotId,
    baseText: string,
    snapshot: FieldFixUISnapshot
  ): void {
    if (!handle) return
    const isSelected = snapshot.selectedHotspot === id
    handle.label.text = isSelected ? `[ ${baseText} ]` : baseText
    handle.label.textFill.color = isSelected
      ? new vec4(0.45, 0.98, 1.0, 1.0)
      : new vec4(0.92, 0.96, 1.0, 1.0)
  }
}
