/**
 * FieldFixDiagnosticUI.ts
 * World-space SpectaclesUIKit diagnostic & guided repair interface for FieldFix AR.
 *
 * Strictly adheres to CLAD Channel-A UI architecture:
 * - All UIKit primitives (Frame, Button, ProgressBar) and Component.Text live exclusively in this *UI.ts module.
 * - Exposes typed Event<T> emitters for user actions and renderSnapshot() for state updates.
 * - Includes X-Ray Cutaway toggle, Before/After Comparison toggle, LOTO Safety Interlock banner,
 *   Trainee Competency Scorecard, and high-contrast dark backing pills for SPECS 27.
 */

import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { Button } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import { Frame } from "SpectaclesUIKit.lspkg/Scripts/Components/Frame/Frame"
import { ProgressBar } from "SpectaclesUIKit.lspkg/Scripts/Components/ProgressBar/ProgressBar"
import { FaultSeverity, FieldFixUISnapshot, HOTSPOT_CATALOG, HotspotId } from "./FieldFixState"

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

  private onToggleXrayEvent = new Event<void>()
  public readonly onToggleXray: PublicApi<void> = this.onToggleXrayEvent.publicApi()

  private onToggleComparisonEvent = new Event<void>()
  public readonly onToggleComparison: PublicApi<void> = this.onToggleComparisonEvent.publicApi()

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
  private btnToggleXray: ButtonHandle | null = null
  private btnToggleComparison: ButtonHandle | null = null

  public onAwake(): void {
    const frame = this.sceneObject.createComponent(Frame.getTypeName()) as Frame
    frame.autoShowHide = false
    frame.autoScaleContent = false
    frame.allowScaling = false
    frame.allowTranslation = false
    this.frame = frame

    frame.onInitialized.add(() => {
      if (this.uiReady) return
      frame.innerSize = new vec2(28.0, 48.0)
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
    root.getTransform().setLocalPosition(new vec3(0, 0.0, 0.8))
    this.contentRoot = root

    // 1. Top App Title & Status Badge (1 Clear Machine Condition)
    this.titleBrandText = this.createTextLabel(
      root,
      "TitleBrandText",
      new vec3(0, 19.4, 0.1),
      new vec2(26.0, 1.8),
      "FIELDFIX AR  //  SPATIAL FAULT-TRACING TRAINER",
      28,
      new vec4(0.62, 0.95, 1.0, 1.0),
      true,
      new vec4(0.04, 0.10, 0.18, 0.92)
    )

    this.headerBadgeText = this.createTextLabel(
      root,
      "HeaderBadgeText",
      new vec3(0, 16.8, 0.15),
      new vec2(26.0, 2.8),
      "STANDBY: CRYO-PUMP UNIT #04",
      38,
      new vec4(1.0, 0.84, 0.30, 1.0),
      true,
      new vec4(0.14, 0.08, 0.03, 0.94)
    )

    // 2. Live Telemetry Readout Row
    this.telemetryBarText = this.createTextLabel(
      root,
      "TelemetryBarText",
      new vec3(0, 13.8, 0.15),
      new vec2(26.0, 2.4),
      "SIM TELEMETRY: 118C  |  142 PSI  |  FLOW: 18%",
      30,
      new vec4(0.50, 0.96, 1.0, 1.0),
      true,
      new vec4(0.04, 0.11, 0.17, 0.92)
    )

    // 3. Subsystem Selector Pill Row (Width: 7.4cm each, Height: 3.6cm, Gap: 1.8cm local -> 1.404cm world >= 1.2cm SIK)
    this.btnValve = this.createUIButton(
      root,
      "BtnHotspotValve",
      new vec3(-9.2, 10.4, 0.95),
      new vec3(7.4, 3.6, 1.0),
      "CV-101",
      26,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("valve")
      }
    )

    this.btnRegulator = this.createUIButton(
      root,
      "BtnHotspotRegulator",
      new vec3(0.0, 10.4, 0.95),
      new vec3(7.4, 3.6, 1.0),
      "PR-204",
      26,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("regulator")
      }
    )

    this.btnRelay = this.createUIButton(
      root,
      "BtnHotspotRelay",
      new vec3(9.2, 10.4, 0.95),
      new vec3(7.4, 3.6, 1.0),
      "TR-309",
      26,
      "Secondary",
      () => {
        this.onSelectHotspotEvent.invoke("relay")
      }
    )

    // 4. Selected Component Diagnosis & Causal Trace Section
    this.componentTitleText = this.createTextLabel(
      root,
      "ComponentTitleText",
      new vec3(0, 7.2, 0.15),
      new vec2(26.0, 2.4),
      "[TR-309] CRITICAL: CORE OVERHEAT (118C)",
      32,
      new vec4(1.0, 0.52, 0.52, 1.0),
      true,
      new vec4(0.15, 0.05, 0.06, 0.92)
    )

    this.rootCauseText = this.createTextLabel(
      root,
      "RootCauseText",
      new vec3(0, 4.6, 0.1),
      new vec2(26.0, 2.6),
      "Simulated thermal latch tripped due to coolant starvation.",
      27,
      new vec4(0.92, 0.97, 1.0, 1.0),
      true,
      new vec4(0.04, 0.08, 0.14, 0.88)
    )

    // 5. Guided Step Objective & Instruction (1 Current Objective)
    this.stepHeaderText = this.createTextLabel(
      root,
      "StepHeaderText",
      new vec3(0, 1.8, 0.15),
      new vec2(26.0, 2.6),
      "STEP 1/4: LOCKOUT ISOLATION VALVE",
      36,
      new vec4(1.0, 0.88, 0.36, 1.0),
      true,
      new vec4(0.12, 0.10, 0.03, 0.92)
    )

    this.stepInstructionText = this.createTextLabel(
      root,
      "StepInstructionText",
      new vec3(0, -0.8, 0.1),
      new vec2(26.0, 2.4),
      "Pinch 3D CV-101 Valve or EXECUTE button to rotate valve 90 deg and apply LOTO clasp.",
      27,
      new vec4(1.0, 1.0, 1.0, 1.0),
      true,
      new vec4(0.04, 0.08, 0.14, 0.88)
    )

    this.safetyWarningText = this.createTextLabel(
      root,
      "SafetyWarningText",
      new vec3(0, -3.2, 0.1),
      new vec2(26.0, 2.2),
      "SAFETY: Verify LOTO tag & hand clearance on intake wheel.",
      26,
      new vec4(1.0, 0.78, 0.34, 1.0),
      true,
      new vec4(0.12, 0.08, 0.03, 0.88)
    )

    // 6. Progressive Checklist Strip + Progress Bar (1 Unobtrusive Progress Indicator)
    this.stepChecklistStripText = this.createTextLabel(
      root,
      "StepChecklistStripText",
      new vec3(0, -5.4, 0.15),
      new vec2(26.0, 1.9),
      "[1:LOTO ..]   [2:PURGE ..]   [3:RESEAT ..]   [4:FLOW ..]",
      27,
      new vec4(0.78, 0.95, 1.0, 1.0),
      true,
      new vec4(0.04, 0.10, 0.16, 0.92)
    )

    const progObj = global.scene.createSceneObject("RepairProgressBar")
    progObj.setParent(root)
    progObj.getTransform().setLocalPosition(new vec3(-4.0, -7.6, 0.15))
    const prog = progObj.createComponent(ProgressBar.getTypeName()) as ProgressBar
    prog.size = new vec3(16.0, 1.0, 1.0)
    prog.currentValue = 0
    this.progressBar = prog

    this.progressLabelText = this.createTextLabel(
      root,
      "ProgressLabelText",
      new vec3(9.2, -7.6, 0.15),
      new vec2(7.6, 2.0),
      "0 / 4 DONE",
      30,
      new vec4(0.45, 1.0, 0.70, 1.0),
      true,
      new vec4(0.04, 0.14, 0.08, 0.85)
    )

    // 7. Dominant Primary Confirm / Scan Action Button (Width: 25.2cm, Height: 4.0cm, Gap to Nav: 2.2cm local -> 1.716cm world >= 1.2cm SIK)
    this.btnPrimaryAction = this.createUIButton(
      root,
      "BtnPrimaryAction",
      new vec3(0, -9.2, 0.85),
      new vec3(25.2, 4.0, 1.2),
      "SCAN EQUIPMENT TELEMETRY",
      34,
      "Primary",
      () => {
        if (!this.pendingSnapshot) return
        if (this.pendingSnapshot.phase === "SCANNING") {
          // Ignore duplicate pinches while the 1.2s laser scan sweep is in progress
          return
        }
        if (this.pendingSnapshot.phase === "READY_TO_SCAN") {
          this.onScanRequestedEvent.invoke()
        } else if (
          this.pendingSnapshot.comparisonFaultPreview &&
          this.pendingSnapshot.phase !== "COMPLETED"
        ) {
          // Comparison mode is read-only: pressing primary action exits comparison mode before executing any step
          this.onToggleComparisonEvent.invoke()
        } else if (
          this.pendingSnapshot.phase === "DIAGNOSING" &&
          !this.pendingSnapshot.faultTraceComplete &&
          this.pendingSnapshot.completedCount === 0 &&
          !this.pendingSnapshot.comparisonFaultPreview &&
          this.pendingSnapshot.nextTraceTarget !== null
        ) {
          this.onSelectHotspotEvent.invoke(this.pendingSnapshot.nextTraceTarget)
        } else {
          this.onConfirmStepEvent.invoke()
        }
      }
    )

    // 8. Step Navigation Buttons (Width: 11.2cm each, Height: 3.6cm, Gap: 2.8cm local -> 2.184cm world >= 1.2cm SIK)
    this.btnPrev = this.createUIButton(
      root,
      "BtnPrevStep",
      new vec3(-7.0, -15.2, 1.15),
      new vec3(11.2, 3.6, 1.1),
      "< PREV STEP",
      27,
      "PrimaryNeutral",
      () => {
        this.onPrevStepEvent.invoke()
      }
    )

    this.btnNext = this.createUIButton(
      root,
      "BtnNextStep",
      new vec3(7.0, -15.2, 1.15),
      new vec3(11.2, 3.6, 1.1),
      "NEXT STEP >",
      27,
      "PrimaryNeutral",
      () => {
        this.onNextStepEvent.invoke()
      }
    )

    // 9. Recessed Utility Dock (Width: 7.4cm each, Height: 3.6cm, Gaps: 1.8cm local -> 1.404cm world >= 1.2cm SIK)
    this.btnToggleXray = this.createUIButton(
      root,
      "BtnToggleXray",
      new vec3(-9.2, -20.6, 1.15),
      new vec3(7.4, 3.6, 1.1),
      "X-RAY",
      23,
      "Secondary",
      () => {
        this.onToggleXrayEvent.invoke()
      }
    )

    this.btnToggleComparison = this.createUIButton(
      root,
      "BtnToggleComparison",
      new vec3(0.0, -20.6, 1.15),
      new vec3(7.4, 3.6, 1.1),
      "COMPARE",
      22,
      "Secondary",
      () => {
        this.onToggleComparisonEvent.invoke()
      }
    )

    this.btnReset = this.createUIButton(
      root,
      "BtnResetUnit",
      new vec3(9.2, -20.6, 1.15),
      new vec3(7.4, 3.6, 1.1),
      "RESET",
      23,
      "Secondary",
      () => {
        this.onResetRequestedEvent.invoke()
      }
    )
  }

  private findSceneObject(name: string, root?: SceneObject): SceneObject | null {
    if (!root) {
      const rootCount = global.scene.getRootObjectsCount()
      for (let i = 0; i < rootCount; i++) {
        const found = this.findSceneObject(name, global.scene.getRootObject(i))
        if (found) return found
      }
      return null
    }
    if (root.name === name) return root
    const childCount = root.getChildrenCount()
    for (let i = 0; i < childCount; i++) {
      const found = this.findSceneObject(name, root.getChild(i))
      if (found) return found
    }
    return null
  }

  private buildSpatialEquipmentCallouts(): void {
    const calloutsRoot = global.scene.createSceneObject("SpatialEquipmentCallouts")
    const equipRoot = this.findSceneObject("EquipmentUnitRoot")
    if (equipRoot) {
      calloutsRoot.setParent(equipRoot)
      calloutsRoot.getTransform().setLocalPosition(vec3.zero())
      calloutsRoot.getTransform().setLocalRotation(quat.quatIdentity())
      calloutsRoot.getTransform().setLocalScale(vec3.one())
    } else {
      calloutsRoot.setParent(this.sceneObject)
      calloutsRoot.getTransform().setLocalPosition(new vec3(-30.5, -3.5, 3.0))
    }

    this.calloutHeaderText = this.createTextLabel(
      calloutsRoot,
      "CalloutUnitHeader",
      new vec3(0, 13.8, 1.0),
      new vec2(24.5, 2.5),
      "CRYO-PUMP #04: OVERHEAT ALARM [116°C]",
      34,
      new vec4(0.55, 0.96, 1.0, 1.0),
      true,
      new vec4(0.04, 0.09, 0.16, 0.94)
    )

    this.calloutRegulatorText = this.createTextLabel(
      calloutsRoot,
      "CalloutRegulatorBadge",
      new vec3(0.0, 10.2, 1.0),
      new vec2(20.0, 2.4),
      "PR-204: [UNINSPECTED]",
      31,
      new vec4(1.0, 0.80, 0.28, 1.0),
      true,
      new vec4(0.14, 0.09, 0.03, 0.94)
    )

    this.calloutValveText = this.createTextLabel(
      calloutsRoot,
      "CalloutValveBadge",
      new vec3(-6.8, 4.6, 2.8),
      new vec2(17.5, 2.4),
      "CV-101: [UNINSPECTED]",
      31,
      new vec4(1.0, 0.80, 0.28, 1.0),
      true,
      new vec4(0.14, 0.09, 0.03, 0.94)
    )

    this.calloutRelayText = this.createTextLabel(
      calloutsRoot,
      "CalloutRelayBadge",
      new vec3(6.8, 4.6, 2.8),
      new vec2(17.5, 2.4),
      "TR-309: 116C [OVERHEAT SYMPTOM]",
      31,
      new vec4(1.0, 0.52, 0.52, 1.0),
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

  private setButtonVisualVisible(handle: ButtonHandle | null, visible: boolean): void {
    if (!handle) return
    const rmvs: RenderMeshVisual[] = []
    const collectRmvs = (so: SceneObject) => {
      const comps = so.getComponents("Component.RenderMeshVisual") as RenderMeshVisual[]
      for (let i = 0; i < comps.length; i++) {
        rmvs.push(comps[i])
      }
      for (let i = 0; i < so.getChildrenCount(); i++) {
        collectRmvs(so.getChild(i))
      }
    }
    collectRmvs(handle.obj)
    for (let i = 0; i < rmvs.length; i++) {
      rmvs[i].enabled = visible
    }
    if (handle.label) {
      if (!visible) {
        handle.label.textFill.color = new vec4(0, 0, 0, 0)
        handle.label.dropshadowSettings.enabled = false
      } else {
        handle.label.dropshadowSettings.enabled = true
      }
    }
  }

  private severityColor(severity: FaultSeverity): vec4 {
    switch (severity) {
      case "critical":
        return new vec4(1.0, 0.52, 0.52, 1.0)
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

    // 2. Live Telemetry Bar (Progressive Discovery: reveal upstream pressure & intake flow as inspected)
    if (this.telemetryBarText) {
      if (
        !snapshot.comparisonFaultPreview &&
        snapshot.completedCount === 0 &&
        !snapshot.tracedHotspots.regulator
      ) {
        this.telemetryBarText.text =
          `TELEMETRY: ${snapshot.systemTempC}C (TR-309)  |  UPSTREAM: [INSPECT PR-204]`
      } else if (
        !snapshot.comparisonFaultPreview &&
        snapshot.completedCount === 0 &&
        !snapshot.tracedHotspots.valve
      ) {
        this.telemetryBarText.text =
          `TELEMETRY: ${snapshot.systemTempC}C  |  ${snapshot.systemPressurePsi} PSI (PR-204)  |  INTAKE: [INSPECT CV-101]`
      } else {
        const flowStatus = snapshot.comparisonFaultPreview
          ? "FAULT SNAPSHOT"
          : snapshot.phase === "COMPLETED"
            ? "NOMINAL"
            : snapshot.flowBottleneckStage === "isolated_trapped_psi"
              ? "LOTO ISOLATED"
              : snapshot.flowBottleneckStage === "purged_cooled_ready"
                ? "PURGED READY"
                : "CHOKED @ PR-204"
        this.telemetryBarText.text =
          `SIM TELEMETRY: ${snapshot.systemTempC}C  |  ${snapshot.systemPressurePsi} PSI  |  FLOW: ${snapshot.coolantFlowPct}% (${flowStatus})`
      }
      this.telemetryBarText.textFill.color =
        !snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED"
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : snapshot.comparisonFaultPreview
            ? new vec4(1.0, 0.65, 0.25, 1.0)
            : new vec4(0.48, 0.96, 1.0, 1.0)
    }

    // 3. Hotspot Button Active Highlight Labels
    this.updateHotspotButtonLabel(this.btnValve, "valve", "CV-101 VALVE", snapshot)
    this.updateHotspotButtonLabel(this.btnRegulator, "regulator", "PR-204 REG", snapshot)
    this.updateHotspotButtonLabel(this.btnRelay, "relay", "TR-309 RELAY", snapshot)

    // 4. Selected Component Details & Progressive Discovery
    const comp = snapshot.selectedComponent
    const compRepaired =
      !snapshot.comparisonFaultPreview &&
      (snapshot.phase === "COMPLETED" ||
        (comp.id === "valve" && snapshot.completedSteps[0] && snapshot.completedSteps[3]) ||
        (comp.id === "regulator" && snapshot.completedSteps[1]) ||
        (comp.id === "relay" && snapshot.completedSteps[2]))
    const valveLockedOutMidRepair =
      !snapshot.comparisonFaultPreview &&
      comp.id === "valve" &&
      snapshot.completedSteps[0] &&
      !snapshot.completedSteps[3]
    const compUninspected =
      !compRepaired &&
      !valveLockedOutMidRepair &&
      !snapshot.comparisonFaultPreview &&
      snapshot.completedCount === 0 &&
      !snapshot.tracedHotspots[comp.id]

    if (this.componentTitleText) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.componentTitleText.text = "[TR-309] VISIBLE SYMPTOM: CORE OVERHEAT (116C)"
        this.componentTitleText.textFill.color = new vec4(1.0, 0.52, 0.52, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.componentTitleText.text = "[TR-309] SYMPTOM LOCALIZED: CORE OVERHEAT (118C)"
        this.componentTitleText.textFill.color = new vec4(1.0, 0.78, 0.32, 1.0)
      } else if (compUninspected) {
        this.componentTitleText.text = `[${comp.subsystemCode}] UPSTREAM COMPONENT (UNINSPECTED)`
        this.componentTitleText.textFill.color = new vec4(1.0, 0.82, 0.32, 1.0)
      } else {
        let statusText = comp.faultStatusLabel
        if (compRepaired) {
          statusText =
            comp.id === "regulator"
              ? `NOMINAL: REGULATOR AT ${snapshot.systemPressurePsi} PSI`
              : comp.id === "relay"
                ? `NOMINAL: RELAY CORE AT ${snapshot.systemTempC}C`
                : comp.nominalStatusLabel
        } else if (valveLockedOutMidRepair) {
          statusText = "LOTO ISOLATED: INTAKE LOCKED (0% FLOW)"
        } else if (comp.id === "regulator") {
          statusText = `FAULT: VAPOR LOCK (${snapshot.systemPressurePsi} PSI / 65 PSI MAX)`
        } else if (comp.id === "relay") {
          statusText = `CRITICAL: CORE OVERHEAT (${snapshot.systemTempC}C / 75C MAX)`
        }
        const xrayTag =
          snapshot.xrayMode || snapshot.focusedXrayHotspot === comp.id ? " [X-RAY]" : ""
        this.componentTitleText.text = `[${comp.subsystemCode}] ${statusText}${xrayTag}`
        this.componentTitleText.textFill.color = compRepaired
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : valveLockedOutMidRepair
            ? new vec4(0.45, 0.96, 1.0, 1.0)
            : this.severityColor(comp.initialSeverity)
      }
    }

    if (this.rootCauseText) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.rootCauseText.text =
          "Thermal latch tripped due to coolant starvation. Trace upstream to find root cause."
        this.rootCauseText.textFill.color = new vec4(0.90, 0.96, 1.0, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.rootCauseText.text =
          "Confirming TR-309 thermal symptom and mapping upstream manifold connections..."
        this.rootCauseText.textFill.color = new vec4(0.90, 0.96, 1.0, 1.0)
      } else if (compUninspected) {
        this.rootCauseText.text =
          comp.id === "regulator"
            ? "Upstream trace incomplete: Confirm [TR-309] overheat symptom first, then pinch [PR-204] to inspect."
            : `Upstream trace incomplete: Inspect midstream [PR-204] upstream from [TR-309] before diagnosing [${comp.subsystemCode}].`
        this.rootCauseText.textFill.color = new vec4(1.0, 0.86, 0.36, 1.0)
      } else if (compRepaired) {
        this.rootCauseText.text = snapshot.xrayMode
          ? `${comp.repairedSummary} (X-Ray Verified Nominal)`
          : comp.repairedSummary
        this.rootCauseText.textFill.color = new vec4(0.62, 1.0, 0.80, 1.0)
      } else if (snapshot.xrayMode || snapshot.focusedXrayHotspot === comp.id) {
        this.rootCauseText.text = comp.xrayInternalSummary
        this.rootCauseText.textFill.color = new vec4(0.55, 0.98, 1.0, 1.0)
      } else if (valveLockedOutMidRepair && comp.lockedOutSummary) {
        this.rootCauseText.text = comp.lockedOutSummary
        this.rootCauseText.textFill.color = new vec4(0.65, 0.96, 1.0, 1.0)
      } else {
        this.rootCauseText.text = comp.rootCause
        this.rootCauseText.textFill.color = new vec4(0.92, 0.97, 1.0, 1.0)
      }
    }

    // 5. Guided Step Instructions & Smart Training Feedback / Scorecard
    const step = snapshot.currentStep
    if (this.stepHeaderText) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.stepHeaderText.text = "PHASE 1: SPATIAL TELEMETRY SCAN"
        this.stepHeaderText.textFill.color = new vec4(0.48, 0.96, 1.0, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.stepHeaderText.text = "SCANNING CRYOGENIC FLOW LOOP..."
        this.stepHeaderText.textFill.color = new vec4(1.0, 0.88, 0.36, 1.0)
      } else if (snapshot.interlockFlashHotspot) {
        this.stepHeaderText.text = `LOTO INTERLOCK -> REDIRECTED TO STEP ${step.stepNumber}/4`
        this.stepHeaderText.textFill.color = new vec4(1.0, 0.52, 0.52, 1.0)
      } else if (snapshot.phase === "COMPLETED") {
        this.stepHeaderText.text = `REPAIR COMPLETE: ${snapshot.traineeGrade} (${snapshot.trainingScorePct}%)`
        this.stepHeaderText.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else if (snapshot.comparisonFaultPreview) {
        this.stepHeaderText.text = "COMPARE MODE: INITIAL FAULT SNAPSHOT (READ-ONLY)"
        this.stepHeaderText.textFill.color = new vec4(1.0, 0.72, 0.28, 1.0)
      } else if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.completedCount === 0
      ) {
        if (!snapshot.tracedHotspots[snapshot.selectedHotspot]) {
          this.stepHeaderText.text =
            snapshot.selectedHotspot === "regulator"
              ? "TRACE ORDER: CONFIRM [TR-309] SYMPTOM FIRST"
              : "TRACE ORDER: INSPECT [PR-204] FIRST"
          this.stepHeaderText.textFill.color = new vec4(1.0, 0.82, 0.32, 1.0)
        } else if (snapshot.nextTraceTarget === "regulator") {
          this.stepHeaderText.text = "TRACE [1/3]: INSPECT UPSTREAM REGULATOR"
          this.stepHeaderText.textFill.color = new vec4(0.48, 0.96, 1.0, 1.0)
        } else {
          this.stepHeaderText.text = "TRACE [2/3]: BOTTLENECK FOUND AT PR-204"
          this.stepHeaderText.textFill.color = new vec4(0.48, 0.96, 1.0, 1.0)
        }
      } else {
        const doneTag = snapshot.isCurrentStepDone ? " [DONE]" : ""
        this.stepHeaderText.text = `${step.title}${doneTag}`
        this.stepHeaderText.textFill.color = snapshot.isCurrentStepDone
          ? new vec4(0.32, 0.98, 0.58, 1.0)
          : new vec4(1.0, 0.88, 0.36, 1.0)
      }
    }

    if (this.stepInstructionText) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.stepInstructionText.text =
          "Observe overheat symptom at TR-309. Pinch [SCAN EQUIPMENT TELEMETRY] to map flow."
      } else if (snapshot.phase === "SCANNING") {
        this.stepInstructionText.text =
          "Sweeping Cryo-Pump Unit #04 from TR-309 symptom toward upstream manifold..."
      } else if (snapshot.phase === "COMPLETED") {
        this.stepInstructionText.text = snapshot.comparisonFaultPreview
          ? "COMPARISON ACTIVE: Viewing initial fault telemetry (118C, 142 PSI, 18% Flow). Pinch COMPARE to restore nominal view."
          : snapshot.whatChangedSummary
      } else if (snapshot.comparisonFaultPreview) {
        this.stepInstructionText.text =
          "COMPARISON ACTIVE (READ-ONLY): Viewing initial fault snapshot (118C, 142 PSI, 18% Flow). Pinch [COMPARE] to resume repair."
      } else if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.completedCount === 0 &&
        snapshot.nextTraceTarget
      ) {
        if (!snapshot.tracedHotspots[snapshot.selectedHotspot]) {
          this.stepInstructionText.text =
            snapshot.selectedHotspot === "regulator"
              ? "Confirm [TR-309] overheat symptom first, then pinch 3D [PR-204] to inspect its internal regulator state."
              : "Do not skip upstream components. Follow the 3D chevron to midstream [PR-204] before inspecting [CV-101]."
        } else if (snapshot.nextTraceTarget === "regulator") {
          this.stepInstructionText.text =
            "Follow the 3D chevron upstream from TR-309 and pinch 3D [PR-204] to inspect its internal state."
        } else {
          this.stepInstructionText.text =
            "PR-204 (142 PSI vapor lock) is blocking flow to TR-309. Follow 3D chevron upstream and pinch [CV-101] to inspect intake."
        }
      } else {
        this.stepInstructionText.text = `${step.actionInstruction} (${step.spatialPinchPrompt})`
      }
    }

    if (this.safetyWarningText) {
      if (snapshot.interlockFlashHotspot) {
        this.safetyWarningText.text = snapshot.activeFeedbackText
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.52, 0.52, 1.0)
      } else if (snapshot.phase === "COMPLETED" && !snapshot.comparisonFaultPreview) {
        this.safetyWarningText.text =
          `SCORECARD: ${snapshot.trainingScorePct}% (${snapshot.traineeGrade}) | Trace: ${snapshot.faultTraceCount}/3 | LOTO Blocks: ${snapshot.safetyViolations} | Pinch [COMPARE]`
        this.safetyWarningText.textFill.color = new vec4(0.55, 0.98, 0.75, 1.0)
      } else if (snapshot.activeFeedbackText) {
        this.safetyWarningText.text = snapshot.activeFeedbackText
        this.safetyWarningText.textFill.color = this.severityColor(snapshot.activeFeedbackSeverity)
      } else if (snapshot.phase === "READY_TO_SCAN") {
        this.safetyWarningText.text = "SAFETY: 142 PSI CRYOGENIC SYSTEM — VERIFY LOTO CLEARANCE"
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.82, 0.32, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.safetyWarningText.text = "SAFETY SCAN: Sweeping high-voltage relay core and vapor-lock bypass."
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.88, 0.36, 1.0)
      } else if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.completedCount === 0
      ) {
        this.safetyWarningText.text = "SAFETY NOTICE: Reverse-causal fault tracing in progress. Do not break seals."
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.80, 0.32, 1.0)
      } else {
        this.safetyWarningText.text = `${step.safetyWarning} (${step.verificationMetric})`
        this.safetyWarningText.textFill.color = new vec4(1.0, 0.76, 0.32, 1.0)
      }
    }

    // 6. 4-Step Visual Checklist Strip + Progress Bar (Progressive Discovery: collapsed until repair)
    if (this.stepChecklistStripText) {
      if (
        !snapshot.comparisonFaultPreview &&
        snapshot.completedCount === 0 &&
        !snapshot.faultTraceComplete
      ) {
        if (!snapshot.tracedHotspots.regulator) {
          this.stepChecklistStripText.text =
            "TRACE: [TR-309 SYMPTOM] -> [? UPSTREAM] -> [? ROOT CAUSE]"
        } else {
          this.stepChecklistStripText.text =
            "TRACE: [TR-309 118C] -> [PR-204 142 PSI] -> [? INSPECT CV-101]"
        }
        // Collapsed in Standby & initial Diagnosis to keep UI clean
        this.stepChecklistStripText.textFill.color = new vec4(0, 0, 0, 0)
        this.stepChecklistStripText.backgroundSettings.enabled = false
      } else {
        const s0 = snapshot.completedSteps[0] ? "OK" : snapshot.currentStepIndex === 0 ? ">>" : ".."
        const s1 = snapshot.completedSteps[1] ? "OK" : snapshot.currentStepIndex === 1 ? ">>" : ".."
        const s2 = snapshot.completedSteps[2] ? "OK" : snapshot.currentStepIndex === 2 ? ">>" : ".."
        const s3 = snapshot.completedSteps[3] ? "OK" : snapshot.currentStepIndex === 3 ? ">>" : ".."
        this.stepChecklistStripText.text = `[1:LOTO ${s0}]   [2:PURGE ${s1}]   [3:RESEAT ${s2}]   [4:FLOW ${s3}]`
        this.stepChecklistStripText.textFill.color =
          snapshot.phase === "COMPLETED"
            ? new vec4(0.32, 0.98, 0.58, 1.0)
            : new vec4(0.75, 0.94, 1.0, 1.0)
        this.stepChecklistStripText.backgroundSettings.enabled = true
      }
    }

    const ratio = snapshot.totalSteps > 0 ? snapshot.completedCount / snapshot.totalSteps : 0
    if (this.progressBar) {
      this.progressBar.currentValue = ratio
    }
    if (this.progressLabelText) {
      this.progressLabelText.text = `${snapshot.completedCount} / ${snapshot.totalSteps} DONE`
    }

    // 7. Primary Action Button Label (Progressive Discovery: guide upstream trace until 3/3 complete)
    if (this.btnPrimaryAction) {
      if (snapshot.phase === "READY_TO_SCAN") {
        this.btnPrimaryAction.label.text = "SCAN EQUIPMENT TELEMETRY"
        this.btnPrimaryAction.label.textFill.color = new vec4(0.55, 0.98, 1.0, 1.0)
      } else if (snapshot.phase === "SCANNING") {
        this.btnPrimaryAction.label.text = "SCANNING SUBSYSTEMS..."
        this.btnPrimaryAction.label.textFill.color = new vec4(1.0, 0.88, 0.35, 1.0)
      } else if (snapshot.phase === "COMPLETED") {
        this.btnPrimaryAction.label.text = `VERIFIED NOMINAL (${snapshot.trainingScorePct}% SCORE)`
        this.btnPrimaryAction.label.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else if (snapshot.comparisonFaultPreview) {
        this.btnPrimaryAction.label.text = "EXIT COMPARE TO RESUME REPAIR"
        this.btnPrimaryAction.label.textFill.color = new vec4(1.0, 0.82, 0.36, 1.0)
      } else if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.completedCount === 0 &&
        !snapshot.comparisonFaultPreview
      ) {
        this.btnPrimaryAction.label.text = !snapshot.tracedHotspots.regulator
          ? "TRACE UPSTREAM: INSPECT [PR-204]"
          : "TRACE UPSTREAM: INSPECT [CV-101]"
        this.btnPrimaryAction.label.textFill.color = new vec4(0.55, 0.98, 1.0, 1.0)
      } else if (snapshot.isCurrentStepDone) {
        this.btnPrimaryAction.label.text = `STEP ${step.stepNumber} VERIFIED (ADVANCE)`
        this.btnPrimaryAction.label.textFill.color = new vec4(0.32, 0.98, 0.58, 1.0)
      } else {
        this.btnPrimaryAction.label.text = step.confirmButtonLabel
        this.btnPrimaryAction.label.textFill.color = new vec4(1.0, 1.0, 1.0, 1.0)
      }
    }

    // 8. Progressive Disclosure & Button Management
    // De-clutter 2D hotspot pills during standby/diagnosis so trainees focus on 3D machine
    const showSubsystemPills = snapshot.faultTraceComplete || snapshot.completedCount > 0
    this.setButtonVisualVisible(this.btnValve, showSubsystemPills)
    this.setButtonVisualVisible(this.btnRegulator, showSubsystemPills)
    this.setButtonVisualVisible(this.btnRelay, showSubsystemPills)

    // Collapse navigation buttons during standby/diagnosis until fault trace complete
    const navUnlocked =
      snapshot.phase !== "READY_TO_SCAN" &&
      snapshot.phase !== "SCANNING" &&
      snapshot.faultTraceComplete
    this.setButtonVisualVisible(this.btnPrev, navUnlocked)
    this.setButtonVisualVisible(this.btnNext, navUnlocked)

    if (this.btnPrev) {
      this.btnPrev.label.textFill.color = navUnlocked
        ? new vec4(0.92, 0.96, 1.0, 1.0)
        : new vec4(0, 0, 0, 0)
    }
    if (this.btnNext) {
      this.btnNext.label.textFill.color = navUnlocked
        ? new vec4(0.92, 0.96, 1.0, 1.0)
        : new vec4(0, 0, 0, 0)
    }

    if (this.btnToggleXray) {
      this.btnToggleXray.label.text = snapshot.xrayMode ? "[ X-RAY: ON ]" : "X-RAY"
      this.btnToggleXray.label.textFill.color = snapshot.xrayMode
        ? new vec4(0.45, 0.98, 1.0, 1.0)
        : new vec4(0.90, 0.95, 1.0, 1.0)
    }

    if (this.btnToggleComparison) {
      const compareUnlocked = snapshot.completedCount > 0 || snapshot.phase === "COMPLETED"
      this.btnToggleComparison.label.text = snapshot.comparisonFaultPreview
        ? "[ COMPARE: ON ]"
        : "COMPARE"
      this.btnToggleComparison.label.textFill.color = snapshot.comparisonFaultPreview
        ? new vec4(1.0, 0.72, 0.28, 1.0)
        : compareUnlocked
          ? new vec4(0.90, 0.95, 1.0, 1.0)
          : new vec4(0.55, 0.62, 0.72, 0.78)
    }

    // 9. Update Floating 3D Spatial Equipment Callouts
    this.updateSpatialCallouts(snapshot)
  }

  private updateSpatialCallouts(snapshot: FieldFixUISnapshot): void {
    const green = new vec4(0.32, 0.98, 0.58, 1.0)
    const cyan = new vec4(0.45, 0.96, 1.0, 1.0)
    const amber = new vec4(1.0, 0.82, 0.30, 1.0)
    const red = new vec4(1.0, 0.52, 0.52, 1.0)

    const targetCode = HOTSPOT_CATALOG[snapshot.currentStep.targetHotspot].subsystemCode

    if (this.calloutHeaderText) {
      if (snapshot.comparisonFaultPreview) {
        this.calloutHeaderText.text = "UNIT #04: BEFORE REPAIR (18% CHOKED FLOW)"
        this.calloutHeaderText.textFill.color = red
      } else if (snapshot.interlockFlashHotspot) {
        this.calloutHeaderText.text = `LOTO BLOCKED: PINCH [${targetCode}] FIRST!`
        this.calloutHeaderText.textFill.color = red
      } else if (snapshot.phase === "COMPLETED") {
        this.calloutHeaderText.text = "UNIT #04: 100% LAMINAR FLOW RESTORED"
        this.calloutHeaderText.textFill.color = green
      } else if (snapshot.phase === "READY_TO_SCAN") {
        this.calloutHeaderText.text = "UNIT #04: PINCH [SCAN] TO TRACE FAULT"
        this.calloutHeaderText.textFill.color = cyan
      } else if (snapshot.phase === "SCANNING") {
        this.calloutHeaderText.text = "SCANNING UNIT #04: LOCALIZING TR-309 SYMPTOM..."
        this.calloutHeaderText.textFill.color = cyan
      } else if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.nextTraceTarget
      ) {
        const nextCode = HOTSPOT_CATALOG[snapshot.nextTraceTarget].subsystemCode
        const dirWord = snapshot.nextTraceTarget === "relay" ? "DOWNSTREAM" : "UPSTREAM"
        this.calloutHeaderText.text =
          `TRACE FAULT [${snapshot.faultTraceCount}/3]: PINCH 3D [${nextCode}] ${dirWord}`
        this.calloutHeaderText.textFill.color = cyan
      } else {
        this.calloutHeaderText.text =
          `STEP ${snapshot.currentStep.stepNumber}/4 -> PINCH 3D [${targetCode}] TO ACTUATE`
        this.calloutHeaderText.textFill.color = amber
      }
    }

    if (this.calloutValveText) {
      const valveDiscovered =
        snapshot.tracedHotspots.valve ||
        snapshot.completedCount > 0 ||
        snapshot.comparisonFaultPreview
      if (!snapshot.comparisonFaultPreview && (snapshot.completedSteps[3] || snapshot.phase === "COMPLETED")) {
        this.calloutValveText.text = "CV-101: 100% FLOW [NOMINAL]"
        this.calloutValveText.textFill.color = green
      } else if (!snapshot.comparisonFaultPreview && snapshot.completedSteps[0]) {
        const actuateStep4 =
          snapshot.currentStep.targetHotspot === "valve" && !snapshot.isCurrentStepDone
            ? " [PINCH: STEP 4]"
            : ""
        this.calloutValveText.text = `CV-101: LOTO LOCKED (0%)${actuateStep4}`
        this.calloutValveText.textFill.color = cyan
      } else if (!valveDiscovered) {
        const isNextTrace =
          snapshot.phase === "DIAGNOSING" &&
          !snapshot.faultTraceComplete &&
          snapshot.nextTraceTarget === "valve"
        if (isNextTrace) {
          this.calloutValveText.text = "CV-101: [PINCH: INSPECT]"
          this.calloutValveText.textFill.color = cyan
        } else if (snapshot.phase === "DIAGNOSING" && snapshot.selectedHotspot === "valve") {
          this.calloutValveText.text = "CV-101: [INSPECT PR-204 FIRST]"
          this.calloutValveText.textFill.color = amber
        } else {
          this.calloutValveText.text = "CV-101: [UNINSPECTED]"
          this.calloutValveText.textFill.color = amber
        }
      } else {
        const isStep1Target =
          !snapshot.comparisonFaultPreview &&
          snapshot.currentStep.targetHotspot === "valve" &&
          !snapshot.isCurrentStepDone
        const tag = isStep1Target ? "[PINCH: LOTO]" : "[CAVITATION]"
        this.calloutValveText.text = `CV-101: 18% FLOW ${tag}`
        this.calloutValveText.textFill.color =
          snapshot.selectedHotspot === "valve" ? cyan : amber
      }
    }

    if (this.calloutRegulatorText) {
      const regulatorDiscovered =
        snapshot.tracedHotspots.regulator ||
        snapshot.completedCount > 0 ||
        snapshot.comparisonFaultPreview
      if (!snapshot.comparisonFaultPreview && (snapshot.completedSteps[1] || snapshot.phase === "COMPLETED")) {
        this.calloutRegulatorText.text = `PR-204: ${snapshot.systemPressurePsi} PSI [PURGED OK]`
        this.calloutRegulatorText.textFill.color = green
      } else if (!regulatorDiscovered) {
        const isNextTrace =
          snapshot.phase === "DIAGNOSING" &&
          !snapshot.faultTraceComplete &&
          snapshot.nextTraceTarget === "regulator"
        if (isNextTrace) {
          this.calloutRegulatorText.text = "PR-204: [PINCH: INSPECT]"
          this.calloutRegulatorText.textFill.color = cyan
        } else {
          this.calloutRegulatorText.text = "PR-204: [UNINSPECTED]"
          this.calloutRegulatorText.textFill.color = amber
        }
      } else {
        const isStep2Target =
          !snapshot.comparisonFaultPreview &&
          snapshot.currentStep.targetHotspot === "regulator" &&
          snapshot.completedSteps[0] &&
          !snapshot.completedSteps[1]
        const tag = isStep2Target ? "[PINCH: PURGE]" : `[${snapshot.systemPressurePsi} PSI BLOCK]`
        this.calloutRegulatorText.text = `PR-204: ${snapshot.systemPressurePsi} PSI ${tag}`
        this.calloutRegulatorText.textFill.color =
          snapshot.selectedHotspot === "regulator" ? cyan : amber
      }
    }

    if (this.calloutRelayText) {
      if (!snapshot.comparisonFaultPreview && (snapshot.completedSteps[2] || snapshot.phase === "COMPLETED")) {
        this.calloutRelayText.text = `TR-309: ${snapshot.systemTempC}C [LATCH RESET]`
        this.calloutRelayText.textFill.color = green
      } else if (snapshot.phase === "READY_TO_SCAN") {
        this.calloutRelayText.text = "TR-309: 116C [OVERHEAT SYMPTOM]"
        this.calloutRelayText.textFill.color = red
      } else {
        const isStep3Target =
          !snapshot.comparisonFaultPreview &&
          snapshot.currentStep.targetHotspot === "relay" &&
          snapshot.completedSteps[1] &&
          !snapshot.completedSteps[2]
        const tag = isStep3Target ? "[PINCH: RESEAT]" : "[OVERHEAT]"
        this.calloutRelayText.text = `TR-309: ${snapshot.systemTempC}C ${tag}`
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
    const isTraced = snapshot.tracedHotspots[id]
    const traceSuffix = isTraced ? " *" : ""
    handle.label.text = isSelected ? `[ ${baseText}${traceSuffix} ]` : `${baseText}${traceSuffix}`
    handle.label.textFill.color = isSelected
      ? new vec4(0.45, 0.98, 1.0, 1.0)
      : isTraced
        ? new vec4(0.68, 0.98, 0.85, 1.0)
        : new vec4(0.92, 0.96, 1.0, 1.0)
  }
}
