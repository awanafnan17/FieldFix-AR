/**
 * FieldFixEquipmentMesh.ts
 * Multi-part procedural 3D Industrial Cryo-Coolant Pump & Relay Unit built with
 * Lens Studio MeshBuilder + SimpleVertexBaseColor material and SIK 3D Interactable hotspots.
 *
 * Signature Experience Upgrades ("TRACE THE FAULT"):
 * - 2-Zone Causal Coolant Flow Physics (Upstream Compression/Choke at PR-204 + Vertical Riser Surge + Downstream Starvation at TR-309)
 * - 3D Vapor-Lock Bottleneck Barrier Ring (FaultBottleneckRing) & Directional Flow Trace Chevrons (CausalFlowBridge)
 * - 3D Sight-Glass Flow Turbine Impeller (ManifoldFlowImpeller) spinning proportional to real-time flow %
 * - 3D Pressure Purge Relief Vent Plume (RegulatorPurgePlume) & Thermal Overheat Radiation Crown (RelayOverheatCrown)
 * - Asymmetric 3D Valve Lever Handle + 3D Spatial X-Ray / Exploded Internal Sub-Assemblies
 * - Strictly adheres to CLAD rules: zero UIKit or Component.Text usage in this 3D module.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { DiagnosticPhase, FieldFixUISnapshot, FlowBottleneckStage, HotspotId } from "./FieldFixState"

const DEFAULT_VERTEX_COLOR_MAT = requireAsset(
  "../SimpleVertexBaseColor.lspkg/vertexBaseColorMaterial.mat"
) as Material

type RGBA = [number, number, number, number]

export class ProceduralPartBuilder {
  public mb: MeshBuilder
  private vCount: number = 0

  constructor() {
    this.mb = new MeshBuilder([
      { name: "position", components: 3 },
      { name: "normal", components: 3 },
      { name: "color", components: 4 }
    ])
    this.mb.topology = MeshTopology.Triangles
    this.mb.indexType = MeshIndexType.UInt16
  }

  public addVertex(
    px: number,
    py: number,
    pz: number,
    nx: number,
    ny: number,
    nz: number,
    c: RGBA
  ): number {
    this.mb.appendVerticesInterleaved([px, py, pz, nx, ny, nz, c[0], c[1], c[2], c[3]])
    return this.vCount++
  }

  public addTri(i0: number, i1: number, i2: number): void {
    this.mb.appendIndices([i0, i1, i2])
  }

  public addQuad(
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number],
    n: [number, number, number],
    c: RGBA
  ): void {
    const i0 = this.addVertex(p0[0], p0[1], p0[2], n[0], n[1], n[2], c)
    const i1 = this.addVertex(p1[0], p1[1], p1[2], n[0], n[1], n[2], c)
    const i2 = this.addVertex(p2[0], p2[1], p2[2], n[0], n[1], n[2], c)
    const i3 = this.addVertex(p3[0], p3[1], p3[2], n[0], n[1], n[2], c)
    this.mb.appendIndices([i0, i1, i2, i0, i2, i3])
  }

  public addBox(
    cx: number,
    cy: number,
    cz: number,
    sx: number,
    sy: number,
    sz: number,
    cTop: RGBA,
    cSide: RGBA,
    cBottom?: RGBA
  ): void {
    const hx = sx * 0.5
    const hy = sy * 0.5
    const hz = sz * 0.5
    const bot = cBottom ?? cSide

    // +Y top
    this.addQuad(
      [cx - hx, cy + hy, cz - hz],
      [cx - hx, cy + hy, cz + hz],
      [cx + hx, cy + hy, cz + hz],
      [cx + hx, cy + hy, cz - hz],
      [0, 1, 0],
      cTop
    )
    // -Y bottom
    this.addQuad(
      [cx - hx, cy - hy, cz + hz],
      [cx - hx, cy - hy, cz - hz],
      [cx + hx, cy - hy, cz - hz],
      [cx + hx, cy - hy, cz + hz],
      [0, -1, 0],
      bot
    )
    // +Z front
    this.addQuad(
      [cx - hx, cy - hy, cz + hz],
      [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy + hy, cz + hz],
      [cx - hx, cy + hy, cz + hz],
      [0, 0, 1],
      cSide
    )
    // -Z back
    this.addQuad(
      [cx + hx, cy - hy, cz - hz],
      [cx - hx, cy - hy, cz - hz],
      [cx - hx, cy + hy, cz - hz],
      [cx + hx, cy + hy, cz - hz],
      [0, 0, -1],
      cSide
    )
    // +X right
    this.addQuad(
      [cx + hx, cy - hy, cz + hz],
      [cx + hx, cy - hy, cz - hz],
      [cx + hx, cy + hy, cz - hz],
      [cx + hx, cy + hy, cz + hz],
      [1, 0, 0],
      cSide
    )
    // -X left
    this.addQuad(
      [cx - hx, cy - hy, cz - hz],
      [cx - hx, cy - hy, cz + hz],
      [cx - hx, cy + hy, cz + hz],
      [cx - hx, cy + hy, cz - hz],
      [-1, 0, 0],
      cSide
    )
  }

  public addCylinderY(
    cx: number,
    cy: number,
    cz: number,
    radiusTop: number,
    radiusBottom: number,
    height: number,
    segments: number,
    cSide: RGBA,
    cCap: RGBA
  ): void {
    const y0 = cy - height * 0.5
    const y1 = cy + height * 0.5

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2
      const a1 = ((i + 1) / segments) * Math.PI * 2
      const cos0 = Math.cos(a0)
      const sin0 = Math.sin(a0)
      const cos1 = Math.cos(a1)
      const sin1 = Math.sin(a1)

      const p0: [number, number, number] = [cx + cos0 * radiusBottom, y0, cz + sin0 * radiusBottom]
      const p1: [number, number, number] = [cx + cos1 * radiusBottom, y0, cz + sin1 * radiusBottom]
      const p2: [number, number, number] = [cx + cos1 * radiusTop, y1, cz + sin1 * radiusTop]
      const p3: [number, number, number] = [cx + cos0 * radiusTop, y1, cz + sin0 * radiusTop]

      const nx = (cos0 + cos1) * 0.5
      const nz = (sin0 + sin1) * 0.5
      const len = Math.sqrt(nx * nx + nz * nz) || 1
      this.addQuad(p0, p1, p2, p3, [nx / len, 0, nz / len], cSide)

      if (radiusTop > 0.001) {
        const ic = this.addVertex(cx, y1, cz, 0, 1, 0, cCap)
        const i1 = this.addVertex(cx + cos0 * radiusTop, y1, cz + sin0 * radiusTop, 0, 1, 0, cCap)
        const i2 = this.addVertex(cx + cos1 * radiusTop, y1, cz + sin1 * radiusTop, 0, 1, 0, cCap)
        this.addTri(ic, i2, i1)
      }
      if (radiusBottom > 0.001) {
        const ic = this.addVertex(cx, y0, cz, 0, -1, 0, cCap)
        const i1 = this.addVertex(cx + cos0 * radiusBottom, y0, cz + sin0 * radiusBottom, 0, -1, 0, cCap)
        const i2 = this.addVertex(cx + cos1 * radiusBottom, y0, cz + sin1 * radiusBottom, 0, -1, 0, cCap)
        this.addTri(ic, i1, i2)
      }
    }
  }

  public addCylinderX(
    cx: number,
    cy: number,
    cz: number,
    radius: number,
    length: number,
    segments: number,
    cSide: RGBA,
    cCap: RGBA
  ): void {
    const x0 = cx - length * 0.5
    const x1 = cx + length * 0.5

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2
      const a1 = ((i + 1) / segments) * Math.PI * 2
      const cos0 = Math.cos(a0)
      const sin0 = Math.sin(a0)
      const cos1 = Math.cos(a1)
      const sin1 = Math.sin(a1)

      const p0: [number, number, number] = [x0, cy + cos0 * radius, cz + sin0 * radius]
      const p1: [number, number, number] = [x1, cy + cos0 * radius, cz + sin0 * radius]
      const p2: [number, number, number] = [x1, cy + cos1 * radius, cz + sin1 * radius]
      const p3: [number, number, number] = [x0, cy + cos1 * radius, cz + sin1 * radius]

      const ny = (cos0 + cos1) * 0.5
      const nz = (sin0 + sin1) * 0.5
      const len = Math.sqrt(ny * ny + nz * nz) || 1
      this.addQuad(p0, p1, p2, p3, [0, ny / len, nz / len], cSide)

      const ic1 = this.addVertex(x1, cy, cz, 1, 0, 0, cCap)
      const iv1 = this.addVertex(x1, cy + cos0 * radius, cz + sin0 * radius, 1, 0, 0, cCap)
      const iv2 = this.addVertex(x1, cy + cos1 * radius, cz + sin1 * radius, 1, 0, 0, cCap)
      this.addTri(ic1, iv1, iv2)

      const ic0 = this.addVertex(x0, cy, cz, -1, 0, 0, cCap)
      const iv3 = this.addVertex(x0, cy + cos0 * radius, cz + sin0 * radius, -1, 0, 0, cCap)
      const iv4 = this.addVertex(x0, cy + cos1 * radius, cz + sin1 * radius, -1, 0, 0, cCap)
      this.addTri(ic0, iv4, iv3)
    }
  }

  public addRingZ(
    cx: number,
    cy: number,
    cz: number,
    innerR: number,
    outerR: number,
    thickness: number,
    segments: number,
    color: RGBA
  ): void {
    const zFront = cz + thickness * 0.5
    const zBack = cz - thickness * 0.5
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2
      const a1 = ((i + 1) / segments) * Math.PI * 2
      const c0 = Math.cos(a0)
      const s0 = Math.sin(a0)
      const c1 = Math.cos(a1)
      const s1 = Math.sin(a1)

      this.addQuad(
        [cx + c0 * innerR, cy + s0 * innerR, zFront],
        [cx + c0 * outerR, cy + s0 * outerR, zFront],
        [cx + c1 * outerR, cy + s1 * outerR, zFront],
        [cx + c1 * innerR, cy + s1 * innerR, zFront],
        [0, 0, 1],
        color
      )
      this.addQuad(
        [cx + c1 * innerR, cy + s1 * innerR, zBack],
        [cx + c1 * outerR, cy + s1 * outerR, zBack],
        [cx + c0 * outerR, cy + s0 * outerR, zBack],
        [cx + c0 * innerR, cy + s0 * innerR, zBack],
        [0, 0, -1],
        color
      )
      const nx = c0 + c1
      const ny = s0 + s1
      const nLen = Math.sqrt(nx * nx + ny * ny) || 1
      this.addQuad(
        [cx + c0 * outerR, cy + s0 * outerR, zBack],
        [cx + c1 * outerR, cy + s1 * outerR, zBack],
        [cx + c1 * outerR, cy + s1 * outerR, zFront],
        [cx + c0 * outerR, cy + s0 * outerR, zFront],
        [nx / nLen, ny / nLen, 0],
        color
      )
    }
  }

  public addRingY(
    cx: number,
    cy: number,
    cz: number,
    innerR: number,
    outerR: number,
    thickness: number,
    segments: number,
    color: RGBA
  ): void {
    const yTop = cy + thickness * 0.5
    const yBot = cy - thickness * 0.5
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2
      const a1 = ((i + 1) / segments) * Math.PI * 2
      const c0 = Math.cos(a0)
      const s0 = Math.sin(a0)
      const c1 = Math.cos(a1)
      const s1 = Math.sin(a1)
      const nx = c0 + c1
      const nz = s0 + s1
      const nLen = Math.sqrt(nx * nx + nz * nz) || 1

      this.addQuad(
        [cx + c0 * innerR, yTop, cz + s0 * innerR],
        [cx + c1 * innerR, yTop, cz + s1 * innerR],
        [cx + c1 * outerR, yTop, cz + s1 * outerR],
        [cx + c0 * outerR, yTop, cz + s0 * outerR],
        [0, 1, 0],
        color
      )
      this.addQuad(
        [cx + c0 * outerR, yBot, cz + s0 * outerR],
        [cx + c1 * outerR, yBot, cz + s1 * outerR],
        [cx + c1 * innerR, yBot, cz + s1 * innerR],
        [cx + c0 * innerR, yBot, cz + s0 * innerR],
        [0, -1, 0],
        color
      )
      this.addQuad(
        [cx + c0 * outerR, yBot, cz + s0 * outerR],
        [cx + c0 * outerR, yTop, cz + s0 * outerR],
        [cx + c1 * outerR, yTop, cz + s1 * outerR],
        [cx + c1 * outerR, yBot, cz + s1 * outerR],
        [nx / nLen, 0, nz / nLen],
        color
      )
    }
  }

  public buildMesh(): RenderMesh {
    if (this.mb.isValid()) {
      this.mb.updateMesh()
    }
    return this.mb.getMesh()
  }
}

@component
export class FieldFixEquipmentMesh extends BaseScriptComponent {
  @input
  @allowUndefined
  @hint("Vertex color material from SimpleVertexBaseColor.lspkg")
  public vertexColorMaterial: Material

  private onHotspotTriggeredEvent = new Event<HotspotId>()
  public readonly onHotspotTriggered: PublicApi<HotspotId> = this.onHotspotTriggeredEvent.publicApi()

  private baseRoot: SceneObject | null = null
  private valveHotspotRoot: SceneObject | null = null
  private valveWheelPivot: SceneObject | null = null
  private valveHaloObj: SceneObject | null = null
  private valveHaloVisual: RenderMeshVisual | null = null
  private lotoSafetyClaspObj: SceneObject | null = null
  private valveInternalObj: SceneObject | null = null

  private regulatorHotspotRoot: SceneObject | null = null
  private gaugeNeedlePivot: SceneObject | null = null
  private regulatorHaloObj: SceneObject | null = null
  private regulatorHaloVisual: RenderMeshVisual | null = null
  private regulatorInternalObj: SceneObject | null = null

  private relayHotspotRoot: SceneObject | null = null
  private relayCorePivot: SceneObject | null = null
  private relayCoreVisual: RenderMeshVisual | null = null
  private relayHaloObj: SceneObject | null = null
  private relayHaloVisual: RenderMeshVisual | null = null
  private relayInternalObj: SceneObject | null = null

  private scanRingObj: SceneObject | null = null
  private statusBeaconPivot: SceneObject | null = null
  private statusBeaconVisual: RenderMeshVisual | null = null

  // 1. 3D floating target action chevron that hovers over the next trace or repair target component
  private activeTargetChevronObj: SceneObject | null = null
  private activeTargetChevronVisual: RenderMeshVisual | null = null
  private targetChevronPos: vec3 = new vec3(6.8, 7.0, 2.0)
  private currentChevronPos: vec3 = new vec3(6.8, 7.0, 2.0)

  // 2. 2-Zone Animated 3D Cryo-Coolant Flow Pulse Rings (0..2 Upstream, 3..5 Downstream)
  private coolantFlowRings: SceneObject[] = []
  private coolantFlowVisuals: RenderMeshVisual[] = []
  private flowPhaseOffset: number = 0

  // 3. Signature "TRACE THE FAULT" 3D Cause-and-Effect Visualizers
  private faultBottleneckRingObj: SceneObject | null = null
  private faultBottleneckVisual: RenderMeshVisual | null = null
  private riserPressurePulseObj: SceneObject | null = null
  private manifoldImpellerObj: SceneObject | null = null
  private regulatorPurgePlumeObj: SceneObject | null = null
  private relayOverheatCrownObj: SceneObject | null = null
  private causalFlowBridgeObj: SceneObject | null = null

  // Animation targets & current values
  private currentPhase: DiagnosticPhase = "READY_TO_SCAN"
  private selectedHotspot: HotspotId = "relay"
  private activeStepTargetHotspot: HotspotId = "valve"
  private nextTraceTarget: HotspotId | null = null
  private tracedHotspots: Record<HotspotId, boolean> = {
    valve: false,
    regulator: false,
    relay: false
  }
  private lastSnapshot: FieldFixUISnapshot | null = null
  private flowBottleneckStage: FlowBottleneckStage = "choked_142psi"
  private completedSteps: boolean[] = [false, false, false, false]
  private previousStep2Done: boolean = false
  private purgePlumeTimer: number = 0
  private coolantFlowPct: number = 18
  private xrayMode: boolean = false
  private focusedXrayHotspot: HotspotId | null = null
  private currentXrayBlend: number = 0.0
  private impellerAngleRad: number = 0

  private currentValveAngleDeg: number = 0
  private targetValveAngleDeg: number = 0

  private currentGaugeAngleDeg: number = 0
  private targetGaugeAngleDeg: number = 0

  private currentRelayLiftCm: number = 1.35
  private targetRelayLiftCm: number = 1.35

  private currentRelayRotationDeg: number = 0
  private targetRelayRotationDeg: number = 0

  private isRegulatorBlockedRevealed: boolean = false
  private mechanicalTransformsDirty: boolean = true
  private flowRingsParkedDirty: boolean = true

  private elapsedTime: number = 0
  private scanTimer: number = 0
  private pinchFlashTimers: Record<HotspotId, number> = {
    valve: 0,
    regulator: 0,
    relay: 0
  }
  private interlockFlashTimers: Record<HotspotId, number> = {
    valve: 0,
    regulator: 0,
    relay: 0
  }

  // Pre-built colored meshes for dynamic state swapping
  private haloMeshRed: RenderMesh | null = null
  private haloMeshAmber: RenderMesh | null = null
  private haloMeshCyan: RenderMesh | null = null
  private haloMeshGreen: RenderMesh | null = null

  private relayCoreMeshHot: RenderMesh | null = null
  private relayCoreMeshCool: RenderMesh | null = null

  private beaconMeshRed: RenderMesh | null = null
  private beaconMeshAmber: RenderMesh | null = null
  private beaconMeshGreen: RenderMesh | null = null

  private chevronMeshCyan: RenderMesh | null = null
  private chevronMeshGreen: RenderMesh | null = null

  private flowRingMeshAmber: RenderMesh | null = null
  private flowRingMeshCyan: RenderMesh | null = null
  private flowRingMeshGreen: RenderMesh | null = null
  private flowRingMeshRed: RenderMesh | null = null

  private bottleneckMeshBlocked: RenderMesh | null = null
  private bottleneckMeshCleared: RenderMesh | null = null

  public onAwake(): void {
    this.buildReusableStateMeshes()
    this.buildEquipmentHierarchy()

    this.createEvent("UpdateEvent").bind((ev) => {
      this.onUpdate(ev.getDeltaTime())
    })
  }

  private getMaterial(): Material {
    return this.vertexColorMaterial || DEFAULT_VERTEX_COLOR_MAT
  }

  private attachMeshVisual(obj: SceneObject, mesh: RenderMesh): RenderMeshVisual {
    const rmv = obj.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
    rmv.mesh = mesh
    const mat = this.getMaterial()
    if (mat) {
      rmv.mainMaterial = mat
    }
    return rmv
  }

  private buildReusableStateMeshes(): void {
    const buildHalo = (c: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addRingZ(0, 0, 0, 2.35, 2.85, 0.22, 24, c)
      pb.addBox(0, 3.05, 0, 0.32, 0.55, 0.25, c, c)
      pb.addBox(0, -3.05, 0, 0.32, 0.55, 0.25, c, c)
      pb.addBox(3.05, 0, 0, 0.55, 0.32, 0.25, c, c)
      pb.addBox(-3.05, 0, 0, 0.55, 0.32, 0.25, c, c)
      return pb.buildMesh()
    }

    this.haloMeshRed = buildHalo([1.0, 0.24, 0.24, 1.0])
    this.haloMeshAmber = buildHalo([1.0, 0.72, 0.18, 1.0])
    this.haloMeshCyan = buildHalo([0.25, 0.92, 1.0, 1.0])
    this.haloMeshGreen = buildHalo([0.22, 0.96, 0.52, 1.0])

    const buildRelayCore = (coreColor: RGBA, finColor: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addCylinderY(0, 0, 0, 1.45, 1.45, 4.4, 18, coreColor, finColor)
      for (let i = -1; i <= 1; i++) {
        pb.addCylinderY(0, i * 1.15, 0, 1.95, 1.95, 0.26, 18, finColor, coreColor)
      }
      pb.addBox(0, 2.45, 0, 2.5, 0.45, 0.7, [0.92, 0.95, 1.0, 1.0], finColor)
      return pb.buildMesh()
    }

    this.relayCoreMeshHot = buildRelayCore([1.0, 0.22, 0.18, 1.0], [0.95, 0.48, 0.15, 1.0])
    this.relayCoreMeshCool = buildRelayCore([0.18, 0.88, 0.96, 1.0], [0.22, 0.95, 0.58, 1.0])

    const buildBeacon = (c: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addCylinderY(0, 0, 0, 0.9, 1.15, 1.8, 14, c, c)
      return pb.buildMesh()
    }

    this.beaconMeshRed = buildBeacon([1.0, 0.2, 0.2, 1.0])
    this.beaconMeshAmber = buildBeacon([1.0, 0.74, 0.18, 1.0])
    this.beaconMeshGreen = buildBeacon([0.2, 0.98, 0.52, 1.0])

    // 3D Target Pointer Chevron (inverted pyramid + halo collar)
    const buildChevron = (primary: RGBA, accent: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addCylinderY(0, -0.35, 0, 0.95, 0.08, 1.35, 6, primary, accent)
      pb.addCylinderY(0, 0.65, 0, 0.35, 0.35, 0.85, 8, accent, primary)
      pb.addRingY(0, 1.05, 0, 0.75, 1.15, 0.18, 14, primary)
      return pb.buildMesh()
    }

    this.chevronMeshCyan = buildChevron([0.22, 0.95, 1.0, 1.0], [1.0, 0.88, 0.28, 1.0])
    this.chevronMeshGreen = buildChevron([0.22, 0.98, 0.55, 1.0], [0.55, 1.0, 0.82, 1.0])

    // 3D Manifold Coolant Flow Ring
    const buildFlowRing = (c: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addCylinderX(0, 0, 0, 1.34, 0.46, 14, c, c)
      return pb.buildMesh()
    }

    this.flowRingMeshAmber = buildFlowRing([1.0, 0.74, 0.18, 1.0])
    this.flowRingMeshCyan = buildFlowRing([0.22, 0.92, 1.0, 1.0])
    this.flowRingMeshGreen = buildFlowRing([0.20, 0.98, 0.56, 1.0])
    this.flowRingMeshRed = buildFlowRing([1.0, 0.28, 0.22, 1.0])

    // 3D Vapor-Lock Bottleneck Barrier Collar at PR-204 junction
    const buildBottleneck = (cOuter: RGBA, cInner: RGBA): RenderMesh => {
      const pb = new ProceduralPartBuilder()
      pb.addCylinderX(0, 0, 0, 1.68, 0.65, 16, cOuter, cInner)
      pb.addBox(0, 1.85, 0, 0.55, 0.55, 0.55, cInner, cOuter)
      pb.addBox(0, -1.85, 0, 0.55, 0.55, 0.55, cInner, cOuter)
      return pb.buildMesh()
    }

    this.bottleneckMeshBlocked = buildBottleneck([1.0, 0.22, 0.20, 1.0], [1.0, 0.78, 0.18, 1.0])
    this.bottleneckMeshCleared = buildBottleneck([0.18, 0.92, 0.58, 1.0], [0.25, 0.96, 1.0, 1.0])
  }

  private buildEquipmentHierarchy(): void {
    this.baseRoot = global.scene.createSceneObject("EquipmentBaseChassis")
    this.baseRoot.setParent(this.sceneObject)

    // 1. Build Base Industrial Skid + Pump Manifold Mesh + 3D Callout Leader Struts
    const chassisPb = new ProceduralPartBuilder()
    const darkSkidTop: RGBA = [0.22, 0.26, 0.33, 1.0]
    const darkSkidSide: RGBA = [0.15, 0.18, 0.24, 1.0]
    const hazardStripe: RGBA = [0.92, 0.68, 0.14, 1.0]
    const steelPipe: RGBA = [0.52, 0.60, 0.70, 1.0]
    const pipeCap: RGBA = [0.35, 0.42, 0.52, 1.0]
    const pumpBodyTop: RGBA = [0.28, 0.36, 0.46, 1.0]
    const pumpBodySide: RGBA = [0.20, 0.27, 0.36, 1.0]
    const cyanConduit: RGBA = [0.22, 0.78, 0.92, 1.0]
    const leaderStrutColor: RGBA = [0.32, 0.88, 1.0, 1.0]

    // Heavy mounting skid platform
    chassisPb.addBox(0, -4.6, 0, 21.0, 1.4, 10.5, darkSkidTop, darkSkidSide)
    // Front safety stripe bar
    chassisPb.addBox(0, -4.5, 5.3, 19.6, 0.45, 0.25, hazardStripe, hazardStripe)
    // Left, center, right equipment pedestals
    chassisPb.addBox(-6.6, -2.1, 0, 4.2, 3.6, 6.2, pumpBodyTop, pumpBodySide)
    chassisPb.addBox(0, -1.5, -0.4, 5.0, 4.8, 6.6, pumpBodyTop, pumpBodySide)
    chassisPb.addBox(6.6, -2.1, 0, 4.6, 3.6, 6.2, pumpBodyTop, pumpBodySide)

    // Main horizontal cryo-coolant manifold pipe connecting Valve (-6.6) -> Regulator (0) -> Relay (+6.6)
    chassisPb.addCylinderX(0, 1.2, 0.4, 1.15, 16.5, 16, steelPipe, pipeCap)
    // Secondary lower return conduit
    chassisPb.addCylinderX(0, -1.4, 2.2, 0.55, 14.0, 12, cyanConduit, pipeCap)
    // Flange rings along manifold
    chassisPb.addCylinderX(-3.4, 1.2, 0.4, 1.5, 0.45, 14, hazardStripe, pipeCap)
    chassisPb.addCylinderX(3.4, 1.2, 0.4, 1.5, 0.45, 14, hazardStripe, pipeCap)

    // Vertical riser under Regulator (center)
    chassisPb.addCylinderY(0, 3.2, 0.4, 1.05, 1.05, 3.6, 14, steelPipe, pipeCap)
    // Beacon mast at back-left
    chassisPb.addCylinderY(-4.2, 4.5, -2.2, 0.35, 0.45, 7.5, 10, darkSkidTop, pipeCap)

    // 3D Callout Leader Struts tethering the 3 subsystems to their floating callout badges
    chassisPb.addCylinderY(-7.4, -3.5, 2.4, 0.12, 0.12, 3.2, 8, leaderStrutColor, hazardStripe)
    chassisPb.addCylinderY(0.8, 8.2, 1.8, 0.12, 0.12, 2.6, 8, leaderStrutColor, hazardStripe)
    chassisPb.addCylinderY(7.4, -3.5, 2.0, 0.12, 0.12, 3.2, 8, leaderStrutColor, hazardStripe)

    this.attachMeshVisual(this.baseRoot, chassisPb.buildMesh())

    // 1B. Directional Causal Flow Bridge Chevrons on the manifold (CV-101 -> PR-204 -> TR-309)
    this.causalFlowBridgeObj = global.scene.createSceneObject("CausalFlowBridge")
    this.causalFlowBridgeObj.setParent(this.sceneObject)
    const bridgePb = new ProceduralPartBuilder()
    const traceCyan: RGBA = [0.25, 0.95, 1.0, 1.0]
    // Upstream flow arrow markers
    bridgePb.addBox(-4.6, 1.2, 1.62, 0.85, 0.26, 0.14, traceCyan, traceCyan)
    bridgePb.addBox(-2.2, 1.2, 1.62, 0.85, 0.26, 0.14, traceCyan, traceCyan)
    // Downstream flow arrow markers
    bridgePb.addBox(2.2, 1.2, 1.62, 0.85, 0.26, 0.14, traceCyan, traceCyan)
    bridgePb.addBox(4.6, 1.2, 1.62, 0.85, 0.26, 0.14, traceCyan, traceCyan)
    this.attachMeshVisual(this.causalFlowBridgeObj, bridgePb.buildMesh())

    // 1C. 3D Sight-Glass Flow Turbine Impeller at x=-3.4, y=1.2, z=1.68
    this.manifoldImpellerObj = global.scene.createSceneObject("ManifoldFlowImpeller")
    this.manifoldImpellerObj.setParent(this.sceneObject)
    this.manifoldImpellerObj.getTransform().setLocalPosition(new vec3(-3.4, 1.2, 1.68))
    const impPb = new ProceduralPartBuilder()
    impPb.addRingZ(0, 0, 0, 0.72, 0.98, 0.22, 16, [0.78, 0.86, 0.95, 1.0])
    impPb.addBox(0, 0, 0.05, 1.38, 0.24, 0.18, [0.22, 0.96, 1.0, 1.0], [1.0, 0.85, 0.25, 1.0])
    impPb.addBox(0, 0, 0.05, 0.24, 1.38, 0.18, [0.22, 0.96, 1.0, 1.0], [1.0, 0.85, 0.25, 1.0])
    this.attachMeshVisual(this.manifoldImpellerObj, impPb.buildMesh())

    // 1D. 3D Vapor-Lock Bottleneck Barrier Collar at x=-0.65, y=1.2, z=0.4
    this.faultBottleneckRingObj = global.scene.createSceneObject("FaultBottleneckRing")
    this.faultBottleneckRingObj.setParent(this.sceneObject)
    this.faultBottleneckRingObj.getTransform().setLocalPosition(new vec3(-0.65, 1.2, 0.4))
    if (this.bottleneckMeshBlocked) {
      this.faultBottleneckVisual = this.attachMeshVisual(
        this.faultBottleneckRingObj,
        this.bottleneckMeshBlocked
      )
    }

    // 1E. Vertical Riser Over-Pressure Surge Ring (climbs y=1.4..4.6 into PR-204)
    this.riserPressurePulseObj = global.scene.createSceneObject("RiserPressurePulseRing")
    this.riserPressurePulseObj.setParent(this.sceneObject)
    this.riserPressurePulseObj.getTransform().setLocalPosition(new vec3(0, 2.8, 0.4))
    const riserPulsePb = new ProceduralPartBuilder()
    riserPulsePb.addRingY(0, 0, 0, 1.02, 1.48, 0.34, 16, [1.0, 0.36, 0.18, 1.0])
    this.attachMeshVisual(this.riserPressurePulseObj, riserPulsePb.buildMesh())

    // Overhead Status Beacon on top of the mast
    this.statusBeaconPivot = global.scene.createSceneObject("OverheadStatusBeacon")
    this.statusBeaconPivot.setParent(this.sceneObject)
    this.statusBeaconPivot.getTransform().setLocalPosition(new vec3(-4.2, 8.8, -2.2))
    if (this.beaconMeshRed) {
      this.statusBeaconVisual = this.attachMeshVisual(this.statusBeaconPivot, this.beaconMeshRed)
    }

    // 2-Zone Animated Coolant Flow Pulse Rings (0..2 Upstream [-6.2..-0.9], 3..5 Downstream [+0.9..+6.2])
    for (let i = 0; i < 6; i++) {
      const ringObj = global.scene.createSceneObject(`CoolantFlowPulseRing_${i}`)
      ringObj.setParent(this.sceneObject)
      const initX = i < 3 ? -5.8 + i * 1.8 : 1.2 + (i - 3) * 1.8
      ringObj.getTransform().setLocalPosition(new vec3(initX, 1.2, 0.4))
      if (this.flowRingMeshAmber) {
        const vis = this.attachMeshVisual(ringObj, this.flowRingMeshAmber)
        this.coolantFlowVisuals.push(vis)
      }
      this.coolantFlowRings.push(ringObj)
    }

    // 2. Build Hotspot 1: Primary Coolant Isolation Valve (Left at [-6.8, 1.2, 2.4])
    this.valveHotspotRoot = this.createHotspotContainer(
      "Hotspot_CoolantValve",
      new vec3(-6.8, 1.2, 2.4),
      new vec3(5.2, 5.2, 7.0),
      "valve"
    )

    // Valve stem housing
    const valveBodyPb = new ProceduralPartBuilder()
    valveBodyPb.addCylinderY(0, -0.4, -1.2, 1.25, 1.35, 2.6, 14, steelPipe, pipeCap)
    this.attachMeshVisual(this.valveHotspotRoot, valveBodyPb.buildMesh())

    // Internal X-Ray Sub-Assembly 1: Cryo-Ball Seal & Intake Venturi Core
    this.valveInternalObj = global.scene.createSceneObject("ValveInternalCryoSeal")
    this.valveInternalObj.setParent(this.valveHotspotRoot)
    this.valveInternalObj.getTransform().setLocalPosition(new vec3(0, 0, -0.6))
    const valveIntPb = new ProceduralPartBuilder()
    valveIntPb.addCylinderY(0, 0, 0, 0.92, 0.92, 1.85, 14, [0.18, 0.92, 1.0, 1.0], [1.0, 0.85, 0.25, 1.0])
    valveIntPb.addRingZ(0, 0, 0, 0.65, 1.28, 0.28, 16, [1.0, 0.48, 0.16, 1.0])
    valveIntPb.addCylinderX(0, 0, 0, 0.55, 2.2, 12, [0.35, 0.98, 0.85, 1.0], [1.0, 1.0, 1.0, 1.0])
    this.attachMeshVisual(this.valveInternalObj, valveIntPb.buildMesh())
    this.valveInternalObj.enabled = false

    // Articulated Valve Handwheel Pivot + Asymmetric High-Visibility Lever Arm
    this.valveWheelPivot = global.scene.createSceneObject("ValveWheelPivot")
    this.valveWheelPivot.setParent(this.valveHotspotRoot)
    this.valveWheelPivot.getTransform().setLocalPosition(new vec3(0, 0, 0.5))

    const wheelPb = new ProceduralPartBuilder()
    const wheelRim: RGBA = [0.95, 0.52, 0.14, 1.0]
    const wheelSpoke: RGBA = [0.82, 0.86, 0.92, 1.0]
    const leverYellow: RGBA = [1.0, 0.92, 0.22, 1.0]
    wheelPb.addRingZ(0, 0, 0, 1.45, 1.95, 0.42, 20, wheelRim)
    wheelPb.addBox(0, 0, 0, 3.2, 0.36, 0.32, wheelSpoke, wheelSpoke)
    wheelPb.addBox(0, 0, 0, 0.36, 3.2, 0.32, wheelSpoke, wheelSpoke)
    // Prominent asymmetric lever arm extending +Y so 0 deg vs -90 deg (LOTO) vs +90 deg (Open) is unmistakable
    wheelPb.addBox(0, 1.65, 0.34, 0.55, 2.2, 0.38, wheelRim, wheelRim)
    wheelPb.addBox(0, 2.75, 0.42, 0.92, 0.68, 0.48, leverYellow, wheelRim)
    this.attachMeshVisual(this.valveWheelPivot, wheelPb.buildMesh())

    // 3D Lockout-Tagout (LOTO) Safety Clasp on Valve (visible when Step 1 is locked out)
    this.lotoSafetyClaspObj = global.scene.createSceneObject("LotoSafetyClasp")
    this.lotoSafetyClaspObj.setParent(this.valveHotspotRoot)
    this.lotoSafetyClaspObj.getTransform().setLocalPosition(new vec3(-2.1, -1.4, 0.75))
    const lotoPb = new ProceduralPartBuilder()
    lotoPb.addBox(0, 0, 0, 1.2, 1.5, 0.45, [1.0, 0.18, 0.18, 1.0], [0.90, 0.12, 0.12, 1.0])
    lotoPb.addRingZ(0, 0.95, 0, 0.25, 0.48, 0.22, 12, [1.0, 0.88, 0.22, 1.0])
    this.attachMeshVisual(this.lotoSafetyClaspObj, lotoPb.buildMesh())
    this.lotoSafetyClaspObj.enabled = false

    // Valve diagnostic halo ring
    this.valveHaloObj = global.scene.createSceneObject("ValveDiagnosticHalo")
    this.valveHaloObj.setParent(this.valveHotspotRoot)
    this.valveHaloObj.getTransform().setLocalPosition(new vec3(0, 0, 0.9))
    if (this.haloMeshAmber) {
      this.valveHaloVisual = this.attachMeshVisual(this.valveHaloObj, this.haloMeshAmber)
    }

    // 3. Build Hotspot 2: High-Pressure Bypass Regulator (Center-Top at [0, 5.8, 1.8])
    this.regulatorHotspotRoot = this.createHotspotContainer(
      "Hotspot_PressureRegulator",
      new vec3(0, 5.8, 1.8),
      new vec3(5.2, 5.2, 7.0),
      "regulator"
    )

    const regPb = new ProceduralPartBuilder()
    regPb.addCylinderY(0, -0.8, -1.0, 1.4, 1.6, 2.2, 16, [0.32, 0.72, 0.88, 1.0], steelPipe)
    regPb.addRingZ(0, 0, 0.1, 0.1, 1.85, 0.35, 20, [0.18, 0.22, 0.28, 1.0])
    regPb.addRingZ(0, 0, 0.2, 1.55, 1.92, 0.38, 20, [0.75, 0.82, 0.90, 1.0])
    regPb.addBox(-0.95, 0.65, 0.32, 0.45, 0.45, 0.18, [1.0, 0.25, 0.25, 1.0], [1.0, 0.25, 0.25, 1.0])
    regPb.addBox(0.95, 0.65, 0.32, 0.45, 0.45, 0.18, [0.22, 0.95, 0.52, 1.0], [0.22, 0.95, 0.52, 1.0])
    this.attachMeshVisual(this.regulatorHotspotRoot, regPb.buildMesh())

    // Internal X-Ray Sub-Assembly 2: High-Pressure Relief Spring & Diaphragm Spool
    this.regulatorInternalObj = global.scene.createSceneObject("RegulatorInternalDiaphragm")
    this.regulatorInternalObj.setParent(this.regulatorHotspotRoot)
    this.regulatorInternalObj.getTransform().setLocalPosition(new vec3(0, -0.2, -0.5))
    const regIntPb = new ProceduralPartBuilder()
    regIntPb.addCylinderY(0, 0, 0, 0.48, 0.48, 2.4, 12, [1.0, 0.78, 0.22, 1.0], [0.22, 0.95, 1.0, 1.0])
    for (let i = -2; i <= 2; i++) {
      regIntPb.addRingY(0, i * 0.42, 0, 0.52, 1.05, 0.14, 14, [0.25, 0.95, 1.0, 1.0])
    }
    this.attachMeshVisual(this.regulatorInternalObj, regIntPb.buildMesh())
    this.regulatorInternalObj.enabled = false

    // 3D Upward Relief Vent Plume on PR-204 (bursts when Step 2 purges 142 PSI -> 38 PSI)
    this.regulatorPurgePlumeObj = global.scene.createSceneObject("RegulatorPurgePlume")
    this.regulatorPurgePlumeObj.setParent(this.regulatorHotspotRoot)
    this.regulatorPurgePlumeObj.getTransform().setLocalPosition(new vec3(0, 2.2, 0))
    const plumePb = new ProceduralPartBuilder()
    plumePb.addRingY(0, 0.0, 0, 0.35, 0.85, 0.22, 14, [0.65, 0.98, 1.0, 1.0])
    plumePb.addRingY(0, 0.85, 0, 0.65, 1.35, 0.22, 14, [0.45, 0.95, 1.0, 1.0])
    plumePb.addRingY(0, 1.75, 0, 0.95, 1.85, 0.18, 14, [0.85, 1.0, 1.0, 1.0])
    this.attachMeshVisual(this.regulatorPurgePlumeObj, plumePb.buildMesh())
    this.regulatorPurgePlumeObj.enabled = false

    // Articulated Gauge Needle Pivot
    this.gaugeNeedlePivot = global.scene.createSceneObject("GaugeNeedlePivot")
    this.gaugeNeedlePivot.setParent(this.regulatorHotspotRoot)
    this.gaugeNeedlePivot.getTransform().setLocalPosition(new vec3(0, -0.2, 0.42))

    const needlePb = new ProceduralPartBuilder()
    needlePb.addBox(0, 0.65, 0, 0.26, 1.55, 0.18, [1.0, 0.88, 0.22, 1.0], [1.0, 0.45, 0.15, 1.0])
    this.attachMeshVisual(this.gaugeNeedlePivot, needlePb.buildMesh())

    // Regulator diagnostic halo ring
    this.regulatorHaloObj = global.scene.createSceneObject("RegulatorDiagnosticHalo")
    this.regulatorHaloObj.setParent(this.regulatorHotspotRoot)
    this.regulatorHaloObj.getTransform().setLocalPosition(new vec3(0, 0, 0.65))
    if (this.haloMeshAmber) {
      this.regulatorHaloVisual = this.attachMeshVisual(this.regulatorHaloObj, this.haloMeshAmber)
    }

    // 4. Build Hotspot 3: Thermal Relay Core Assembly (Right at [6.8, 1.4, 2.0])
    this.relayHotspotRoot = this.createHotspotContainer(
      "Hotspot_ThermalRelayCore",
      new vec3(6.8, 1.4, 2.0),
      new vec3(5.4, 5.6, 7.0),
      "relay"
    )

    const relayCollarPb = new ProceduralPartBuilder()
    relayCollarPb.addCylinderY(0, -1.6, -1.2, 1.85, 2.05, 1.8, 16, darkSkidTop, steelPipe)
    this.attachMeshVisual(this.relayHotspotRoot, relayCollarPb.buildMesh())

    // Internal X-Ray Sub-Assembly 3: Copper Stator Coil & Bimetallic Trip Plunger
    this.relayInternalObj = global.scene.createSceneObject("RelayInternalStatorCoil")
    this.relayInternalObj.setParent(this.relayHotspotRoot)
    this.relayInternalObj.getTransform().setLocalPosition(new vec3(0, 0.2, -0.6))
    const relayIntPb = new ProceduralPartBuilder()
    relayIntPb.addCylinderY(0, 0, 0, 0.62, 0.62, 3.2, 14, [1.0, 0.55, 0.18, 1.0], [0.22, 0.96, 1.0, 1.0])
    for (let i = -2; i <= 2; i++) {
      relayIntPb.addRingY(0, i * 0.52, 0, 0.65, 1.22, 0.16, 16, [1.0, 0.35, 0.20, 1.0])
    }
    this.attachMeshVisual(this.relayInternalObj, relayIntPb.buildMesh())
    this.relayInternalObj.enabled = false

    // 3D Thermal Overheat Radiation Crown on TR-309 (pulses crimson while core is overheated at 118C)
    this.relayOverheatCrownObj = global.scene.createSceneObject("RelayOverheatCrown")
    this.relayOverheatCrownObj.setParent(this.relayHotspotRoot)
    this.relayOverheatCrownObj.getTransform().setLocalPosition(new vec3(0, 2.5, -1.1))
    const crownPb = new ProceduralPartBuilder()
    crownPb.addRingY(0, 0, 0, 1.85, 2.45, 0.22, 18, [1.0, 0.22, 0.18, 1.0])
    crownPb.addRingY(0, 0.65, 0, 1.45, 1.95, 0.18, 18, [1.0, 0.55, 0.16, 1.0])
    this.attachMeshVisual(this.relayOverheatCrownObj, crownPb.buildMesh())

    // Articulated Thermal Relay Core Pivot
    this.relayCorePivot = global.scene.createSceneObject("ThermalRelayCorePivot")
    this.relayCorePivot.setParent(this.relayHotspotRoot)
    this.relayCorePivot.getTransform().setLocalPosition(new vec3(0, this.currentRelayLiftCm, -1.2))
    if (this.relayCoreMeshHot) {
      this.relayCoreVisual = this.attachMeshVisual(this.relayCorePivot, this.relayCoreMeshHot)
    }

    // Relay diagnostic halo ring
    this.relayHaloObj = global.scene.createSceneObject("RelayDiagnosticHalo")
    this.relayHaloObj.setParent(this.relayHotspotRoot)
    this.relayHaloObj.getTransform().setLocalPosition(new vec3(0, 0.2, 0.85))
    if (this.haloMeshRed) {
      this.relayHaloVisual = this.attachMeshVisual(this.relayHaloObj, this.haloMeshRed)
    }

    // 5. Build 3D Active Step Target Pointer Chevron (guides the technician's hand in 3D space)
    this.activeTargetChevronObj = global.scene.createSceneObject("ActiveStepTargetChevron")
    this.activeTargetChevronObj.setParent(this.sceneObject)
    this.activeTargetChevronObj.getTransform().setLocalPosition(this.currentChevronPos)
    if (this.chevronMeshCyan) {
      this.activeTargetChevronVisual = this.attachMeshVisual(this.activeTargetChevronObj, this.chevronMeshCyan)
    }

    // 6. Build Dual-Beam Horizontal Laser Scan Sweep Ring
    this.scanRingObj = global.scene.createSceneObject("LaserScanSweepRing")
    this.scanRingObj.setParent(this.sceneObject)
    const scanPb = new ProceduralPartBuilder()
    scanPb.addRingY(0, 0, 0.5, 10.0, 10.9, 0.28, 28, [0.22, 0.96, 1.0, 1.0])
    scanPb.addRingY(0, 0.65, 0.5, 9.2, 9.8, 0.18, 28, [0.30, 1.0, 0.65, 1.0])
    this.attachMeshVisual(this.scanRingObj, scanPb.buildMesh())
    this.scanRingObj.enabled = false
  }

  private createHotspotContainer(
    name: string,
    localPos: vec3,
    colliderSize: vec3,
    hotspotId: HotspotId
  ): SceneObject {
    const obj = global.scene.createSceneObject(name)
    obj.setParent(this.sceneObject)
    obj.getTransform().setLocalPosition(localPos)

    const collider = obj.createComponent("Physics.ColliderComponent") as ColliderComponent
    const box = Shape.createBoxShape()
    box.size = colliderSize
    collider.shape = box

    const interactable = obj.createComponent(Interactable.getTypeName()) as Interactable
    interactable.onTriggerEnd.add(() => {
      this.pinchFlashTimers[hotspotId] = 0.45
      this.onHotspotTriggeredEvent.invoke(hotspotId)
    })
    interactable.onHoverEnter.add(() => {
      obj.getTransform().setLocalScale(new vec3(1.08, 1.08, 1.08))
    })
    interactable.onHoverExit.add(() => {
      obj.getTransform().setLocalScale(new vec3(1.0, 1.0, 1.0))
    })

    return obj
  }

  public resetTransforms(): void {
    this.purgePlumeTimer = 0
    this.scanTimer = 0
    this.pinchFlashTimers = { valve: 0, regulator: 0, relay: 0 }
    this.interlockFlashTimers = { valve: 0, regulator: 0, relay: 0 }
    this.currentXrayBlend = 0
    this.currentValveAngleDeg = 0
    this.targetValveAngleDeg = 0
    this.currentGaugeAngleDeg = 0
    this.targetGaugeAngleDeg = 0
    this.currentRelayLiftCm = 1.35
    this.targetRelayLiftCm = 1.35
    this.currentRelayRotationDeg = 0
    this.targetRelayRotationDeg = 0
    this.currentChevronPos = new vec3(6.8, 7.0, 2.0)
    this.targetChevronPos = new vec3(6.8, 7.0, 2.0)
    if (this.regulatorPurgePlumeObj) {
      this.regulatorPurgePlumeObj.enabled = false
    }
    if (this.valveHotspotRoot) {
      this.valveHotspotRoot.getTransform().setLocalScale(new vec3(1.0, 1.0, 1.0))
    }
    if (this.regulatorHotspotRoot) {
      this.regulatorHotspotRoot.getTransform().setLocalScale(new vec3(1.0, 1.0, 1.0))
    }
    if (this.relayHotspotRoot) {
      this.relayHotspotRoot.getTransform().setLocalScale(new vec3(1.0, 1.0, 1.0))
    }
    if (this.valveWheelPivot) {
      this.valveWheelPivot.getTransform().setLocalPosition(new vec3(0, 0, 0.5))
      this.valveWheelPivot.getTransform().setLocalRotation(quat.quatIdentity())
    }
    if (this.gaugeNeedlePivot) {
      this.gaugeNeedlePivot.getTransform().setLocalPosition(new vec3(0, -0.2, 0.42))
      this.gaugeNeedlePivot.getTransform().setLocalRotation(quat.quatIdentity())
    }
    if (this.relayCorePivot) {
      this.relayCorePivot.getTransform().setLocalPosition(new vec3(0, 1.35, -1.2))
      this.relayCorePivot.getTransform().setLocalRotation(quat.quatIdentity())
    }
    if (this.activeTargetChevronObj) {
      this.activeTargetChevronObj.getTransform().setLocalPosition(new vec3(6.8, 7.0, 2.0))
    }
  }

  public applySnapshot(snapshot: FieldFixUISnapshot): void {
    const previousPhase = this.currentPhase
    this.lastSnapshot = snapshot
    this.currentPhase = snapshot.phase
    this.selectedHotspot = snapshot.selectedHotspot
    this.activeStepTargetHotspot = snapshot.currentStep.targetHotspot
    this.nextTraceTarget = snapshot.nextTraceTarget
    this.tracedHotspots = {
      valve: snapshot.tracedHotspots.valve,
      regulator: snapshot.tracedHotspots.regulator,
      relay: snapshot.tracedHotspots.relay
    }
    this.flowBottleneckStage = snapshot.flowBottleneckStage
    const rawStep2Done = snapshot.completedSteps[1]
    const newCompleted = snapshot.comparisonFaultPreview
      ? [false, false, false, false]
      : [...snapshot.completedSteps]

    // Reset 3D mechanical transforms & hover scales ONLY when transitioning into READY_TO_SCAN (or via explicit resetTransforms()),
    // so blocked button clicks while already in READY_TO_SCAN do not wipe active hover scale (Defect J).
    if (snapshot.phase === "READY_TO_SCAN" && previousPhase !== "READY_TO_SCAN") {
      this.resetTransforms()
    } else if (rawStep2Done && !this.previousStep2Done && !snapshot.comparisonFaultPreview) {
      this.purgePlumeTimer = 1.8
    }
    this.previousStep2Done = rawStep2Done
    this.completedSteps = newCompleted

    this.coolantFlowPct = snapshot.coolantFlowPct
    this.xrayMode = snapshot.xrayMode
    this.focusedXrayHotspot = snapshot.focusedXrayHotspot

    if (snapshot.interlockFlashHotspot) {
      this.interlockFlashTimers[snapshot.interlockFlashHotspot] = 0.95
    }

    // Enable 3D X-Ray internal sub-assemblies during SCANNING OR only for components that have been inspected/traced
    const isScanning = snapshot.phase === "SCANNING"
    const valveRevealed =
      snapshot.tracedHotspots.valve || snapshot.completedCount > 0 || snapshot.comparisonFaultPreview
    const regRevealed =
      snapshot.tracedHotspots.regulator || snapshot.completedCount > 0 || snapshot.comparisonFaultPreview
    const relayRevealed =
      snapshot.tracedHotspots.relay || snapshot.completedCount > 0 || snapshot.comparisonFaultPreview

    if (this.valveInternalObj) {
      this.valveInternalObj.enabled =
        isScanning || (valveRevealed && (this.xrayMode || this.focusedXrayHotspot === "valve"))
    }
    if (this.regulatorInternalObj) {
      this.regulatorInternalObj.enabled =
        isScanning || (regRevealed && (this.xrayMode || this.focusedXrayHotspot === "regulator"))
    }
    if (this.relayInternalObj) {
      this.relayInternalObj.enabled =
        isScanning || (relayRevealed && (this.xrayMode || this.focusedXrayHotspot === "relay"))
    }

    if (snapshot.phase === "SCANNING") {
      this.scanTimer = 0
      if (this.scanRingObj) {
        this.scanRingObj.enabled = true
      }
    } else if (this.scanRingObj) {
      this.scanRingObj.enabled = false
    }

    // Update 3D Vapor-Lock Bottleneck Collar & Vertical Riser Surge visibility:
    // Progressive discovery: reveal PR-204's red bottleneck collar & pressure surge only once PR-204 is inspected!
    const regulatorBottleneckRevealed =
      snapshot.tracedHotspots.regulator ||
      snapshot.completedCount > 0 ||
      snapshot.comparisonFaultPreview
    const isRegulatorBlocked = regulatorBottleneckRevealed && !this.completedSteps[1]
    this.isRegulatorBlockedRevealed = isRegulatorBlocked
    this.mechanicalTransformsDirty = true
    this.flowRingsParkedDirty = true
    if (this.faultBottleneckVisual) {
      const targetMesh = isRegulatorBlocked ? this.bottleneckMeshBlocked : this.bottleneckMeshCleared
      if (targetMesh) {
        this.faultBottleneckVisual.mesh = targetMesh
      }
    }
    if (this.riserPressurePulseObj) {
      this.riserPressurePulseObj.enabled = isRegulatorBlocked
    }

    // Update 3D Thermal Overheat Crown visibility on TR-309
    if (this.relayOverheatCrownObj) {
      this.relayOverheatCrownObj.enabled = !this.completedSteps[2]
    }

    // Target mechanical articulations from completed steps (or comparison override):
    if (this.completedSteps[3]) {
      this.targetValveAngleDeg = 90
    } else if (this.completedSteps[0]) {
      this.targetValveAngleDeg = -90
    } else {
      this.targetValveAngleDeg = 0
    }

    // Show 3D LOTO safety clasp on Valve when Step 1 is locked out and Step 4 is not yet open
    if (this.lotoSafetyClaspObj) {
      this.lotoSafetyClaspObj.enabled = this.completedSteps[0] && !this.completedSteps[3]
    }

    // Step 2 (Regulator Purge): +48 deg points left (red 142 PSI danger marker) once PR-204 is inspected, 0 deg when uninspected, and -38 deg points right (green 38 PSI marker) once purged
    this.targetGaugeAngleDeg = this.completedSteps[1]
      ? -38
      : regulatorBottleneckRevealed
        ? 48
        : 0

    // Step 3 (Relay Core Reseat): retracts relay core from +1.35 cm down to 0.0 cm & rotates latch 45 deg
    this.targetRelayLiftCm = this.completedSteps[2] ? 0.0 : 1.35
    this.targetRelayRotationDeg = this.completedSteps[2] ? 45 : 0

    // Swap relay core mesh between hot crimson and cooled cyan
    if (this.relayCoreVisual) {
      if (this.completedSteps[2] && this.relayCoreMeshCool) {
        this.relayCoreVisual.mesh = this.relayCoreMeshCool
      } else if (!this.completedSteps[2] && this.relayCoreMeshHot) {
        this.relayCoreVisual.mesh = this.relayCoreMeshHot
      }
    }

    // Update Overhead Status Beacon mesh
    if (this.statusBeaconVisual) {
      if (!snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED" && this.beaconMeshGreen) {
        this.statusBeaconVisual.mesh = this.beaconMeshGreen
      } else if (!snapshot.comparisonFaultPreview && snapshot.completedCount >= 1 && this.beaconMeshAmber) {
        this.statusBeaconVisual.mesh = this.beaconMeshAmber
      } else if (this.beaconMeshRed) {
        this.statusBeaconVisual.mesh = this.beaconMeshRed
      }
    }

    // Update 3D Active Step Target Pointer position & color:
    // - During DIAGNOSING while tracing upstream (nextTraceTarget !== null), lead the user upstream: relay -> regulator -> valve!
    // - Once traced or in REPAIRING, point at activeStepTargetHotspot (Step 1..4).
    if (!snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED") {
      this.targetChevronPos = new vec3(0, 10.2, 1.8)
      if (this.activeTargetChevronVisual && this.chevronMeshGreen) {
        this.activeTargetChevronVisual.mesh = this.chevronMeshGreen
      }
    } else {
      let targetId: HotspotId = this.activeStepTargetHotspot
      if (snapshot.phase === "READY_TO_SCAN") {
        targetId = "relay"
      } else if (snapshot.phase === "DIAGNOSING" && snapshot.nextTraceTarget !== null) {
        targetId = snapshot.nextTraceTarget
      }
      if (targetId === "valve") {
        this.targetChevronPos = new vec3(-6.8, 6.9, 2.4)
      } else if (targetId === "regulator") {
        this.targetChevronPos = new vec3(0, 10.6, 1.8)
      } else {
        this.targetChevronPos = new vec3(6.8, 7.0, 2.0)
      }
      if (this.activeTargetChevronVisual && this.chevronMeshCyan) {
        this.activeTargetChevronVisual.mesh = this.chevronMeshCyan
      }
    }

    // Update 2-Zone Coolant Flow Ring colors (Upstream 0..2 vs Downstream 3..5)
    for (let i = 0; i < this.coolantFlowVisuals.length; i++) {
      const vis = this.coolantFlowVisuals[i]
      if (!snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED" && this.flowRingMeshGreen) {
        vis.mesh = this.flowRingMeshGreen
      } else if (this.completedSteps[0] && this.flowRingMeshCyan) {
        vis.mesh = this.flowRingMeshCyan
      } else if (i >= 3 && this.flowRingMeshRed) {
        // Downstream starved droplets glow dim red/amber before repair
        vis.mesh = this.flowRingMeshRed
      } else if (this.flowRingMeshAmber) {
        vis.mesh = this.flowRingMeshAmber
      }
    }

    // Update 3D Hotspot Diagnostic Halos
    this.updateHotspotHalos(snapshot)
  }

  private updateHotspotHalos(snapshot: FieldFixUISnapshot): void {
    const pickHaloMesh = (id: HotspotId, isRepaired: boolean): RenderMesh | null => {
      if (this.interlockFlashTimers[id] > 0) {
        return this.haloMeshRed
      }
      if (!snapshot.comparisonFaultPreview && (snapshot.phase === "COMPLETED" || isRepaired)) {
        return this.haloMeshGreen
      }
      // When CV-101 is LOTO-isolated (Step 1 done, Step 4 not yet done), show cyan LOTO indicator instead of amber fault
      if (!snapshot.comparisonFaultPreview && id === "valve" && this.completedSteps[0] && !this.completedSteps[3]) {
        return this.haloMeshCyan
      }
      // During READY_TO_SCAN onboarding, keep TR-309 crimson (overheat symptom) and CV-101 / PR-204 amber (fault warnings)
      if (snapshot.phase === "READY_TO_SCAN" && !snapshot.comparisonFaultPreview) {
        return id === "relay" ? this.haloMeshRed : this.haloMeshAmber
      }
      // Keep TR-309 critical overheat halo crimson red throughout incomplete upstream tracing and whenever it is not actively the current repair target
      if (id === "relay" && (!snapshot.faultTraceComplete || snapshot.currentStep.targetHotspot !== "relay")) {
        return this.haloMeshRed
      }
      if (
        snapshot.phase === "DIAGNOSING" &&
        !snapshot.faultTraceComplete &&
        snapshot.nextTraceTarget !== null
      ) {
        if (snapshot.selectedHotspot === id || snapshot.nextTraceTarget === id) {
          return this.haloMeshCyan
        }
      } else if (snapshot.selectedHotspot === id || snapshot.currentStep.targetHotspot === id) {
        return this.haloMeshCyan
      }
      if (id === "relay") {
        return this.haloMeshRed
      }
      return this.haloMeshAmber
    }

    const valveRepaired = this.completedSteps[0] && this.completedSteps[3]
    const regRepaired = this.completedSteps[1]
    const relayRepaired = this.completedSteps[2]

    if (this.valveHaloVisual) {
      const m = pickHaloMesh("valve", valveRepaired)
      if (m) this.valveHaloVisual.mesh = m
    }
    if (this.regulatorHaloVisual) {
      const m = pickHaloMesh("regulator", regRepaired)
      if (m) this.regulatorHaloVisual.mesh = m
    }
    if (this.relayHaloVisual) {
      const m = pickHaloMesh("relay", relayRepaired)
      if (m) this.relayHaloVisual.mesh = m
    }
  }

  private onUpdate(dt: number): void {
    const clampedDt = Math.min(dt, 0.05)
    this.elapsedTime += clampedDt
    const lerpFactor = Math.min(1.0, clampedDt * 6.5)

    // Smoothly blend 3D Spatial X-Ray Exploded View factor (0.0 -> 1.0)
    const anyXrayActive =
      this.xrayMode || this.currentPhase === "SCANNING" || this.focusedXrayHotspot !== null
    const targetXray = anyXrayActive ? 1.0 : 0.0
    const xrayMoving = Math.abs(targetXray - this.currentXrayBlend) > 0.0005
    if (xrayMoving) {
      this.currentXrayBlend += (targetXray - this.currentXrayBlend) * lerpFactor
    } else {
      this.currentXrayBlend = targetXray
    }

    const anyCompleted =
      this.completedSteps[0] ||
      this.completedSteps[1] ||
      this.completedSteps[2] ||
      this.completedSteps[3]
    const valveRevealed = this.currentPhase === "SCANNING" || this.tracedHotspots.valve || anyCompleted
    const regRevealed = this.currentPhase === "SCANNING" || this.tracedHotspots.regulator || anyCompleted
    const relayRevealed = this.currentPhase === "SCANNING" || this.tracedHotspots.relay || anyCompleted

    const valveXrayFactor = !valveRevealed
      ? 0.0
      : this.currentPhase === "SCANNING" || this.selectedHotspot === "valve"
        ? this.currentXrayBlend
        : this.xrayMode
          ? this.currentXrayBlend * 0.36
          : 0.0
    const regXrayFactor = !regRevealed
      ? 0.0
      : this.currentPhase === "SCANNING" || this.selectedHotspot === "regulator"
        ? this.currentXrayBlend
        : this.xrayMode
          ? this.currentXrayBlend * 0.36
          : 0.0
    const relayXrayFactor = !relayRevealed
      ? 0.0
      : this.currentPhase === "SCANNING" || this.selectedHotspot === "relay"
        ? this.currentXrayBlend
        : this.xrayMode
          ? this.currentXrayBlend * 0.36
          : 0.0

    // 1. Animate Valve Handwheel rotation + X-Ray axial Z-explosion (dirty-gated when settled)
    const valveMoving = Math.abs(this.targetValveAngleDeg - this.currentValveAngleDeg) > 0.005
    if (valveMoving) {
      this.currentValveAngleDeg += (this.targetValveAngleDeg - this.currentValveAngleDeg) * lerpFactor
    } else {
      this.currentValveAngleDeg = this.targetValveAngleDeg
    }
    if (this.valveWheelPivot && (this.mechanicalTransformsDirty || valveMoving || xrayMoving)) {
      this.valveWheelPivot
        .getTransform()
        .setLocalPosition(new vec3(-0.85 * valveXrayFactor, -0.65 * valveXrayFactor, 0.5 + valveXrayFactor * 1.65))
      this.valveWheelPivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, 0, (this.currentValveAngleDeg * Math.PI) / 180))
    }
    if (this.valveInternalObj && this.valveInternalObj.enabled) {
      this.valveInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 2.75 * valveXrayFactor, 1.45 * valveXrayFactor))
      this.valveInternalObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0.35, this.elapsedTime * 1.8, 0))
    }

    // 2. Animate Pressure Gauge Needle + X-Ray explosion (dirty-gated when uninspected or purged)
    const jitter = this.isRegulatorBlockedRevealed ? Math.sin(this.elapsedTime * 14.0) * 3.0 : 0
    const gaugeMoving =
      Math.abs(this.targetGaugeAngleDeg - this.currentGaugeAngleDeg) > 0.005 || this.isRegulatorBlockedRevealed
    if (Math.abs(this.targetGaugeAngleDeg - this.currentGaugeAngleDeg) > 0.005) {
      this.currentGaugeAngleDeg += (this.targetGaugeAngleDeg - this.currentGaugeAngleDeg) * lerpFactor
    } else {
      this.currentGaugeAngleDeg = this.targetGaugeAngleDeg
    }
    if (this.gaugeNeedlePivot && (this.mechanicalTransformsDirty || gaugeMoving || xrayMoving)) {
      this.gaugeNeedlePivot
        .getTransform()
        .setLocalPosition(new vec3(0, -0.2, 0.42 + regXrayFactor * 1.35))
      this.gaugeNeedlePivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, 0, ((this.currentGaugeAngleDeg + jitter) * Math.PI) / 180))
    }
    if (this.regulatorInternalObj && this.regulatorInternalObj.enabled) {
      this.regulatorInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 2.85 * regXrayFactor, 1.45 * regXrayFactor))
      this.regulatorInternalObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0.25, -this.elapsedTime * 1.6, 0))
    }

    // 3. Animate Thermal Relay Core lift & latch rotation + X-Ray explosion (dirty-gated once cooled & settled)
    const relayLiftMoving = Math.abs(this.targetRelayLiftCm - this.currentRelayLiftCm) > 0.001
    const relayRotMoving = Math.abs(this.targetRelayRotationDeg - this.currentRelayRotationDeg) > 0.005
    if (relayLiftMoving) {
      this.currentRelayLiftCm += (this.targetRelayLiftCm - this.currentRelayLiftCm) * lerpFactor
    } else {
      this.currentRelayLiftCm = this.targetRelayLiftCm
    }
    if (relayRotMoving) {
      this.currentRelayRotationDeg += (this.targetRelayRotationDeg - this.currentRelayRotationDeg) * lerpFactor
    } else {
      this.currentRelayRotationDeg = this.targetRelayRotationDeg
    }
    const relayActive = !this.completedSteps[2] || relayLiftMoving || relayRotMoving
    if (this.relayCorePivot && (this.mechanicalTransformsDirty || relayActive || xrayMoving)) {
      const thermalBob = !this.completedSteps[2] ? Math.sin(this.elapsedTime * 6.0) * 0.12 : 0
      this.relayCorePivot
        .getTransform()
        .setLocalPosition(
          new vec3(
            0.75 * relayXrayFactor,
            this.currentRelayLiftCm + thermalBob - 0.45 * relayXrayFactor,
            -1.2 - relayXrayFactor * 0.65
          )
        )
      this.relayCorePivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, (this.currentRelayRotationDeg * Math.PI) / 180, 0))
    }
    if (this.relayInternalObj && this.relayInternalObj.enabled) {
      this.relayInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 3.15 * relayXrayFactor, 1.45 * relayXrayFactor))
      this.relayInternalObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0.3, this.elapsedTime * 2.1, 0))
    }

    // 4. Smoothly move & bob the 3D Active Step Target Pointer Chevron
    if (this.activeTargetChevronObj) {
      this.currentChevronPos = vec3.lerp(this.currentChevronPos, this.targetChevronPos, lerpFactor)
      const bobY = Math.sin(this.elapsedTime * 5.2) * 0.42
      this.activeTargetChevronObj.getTransform().setLocalPosition(
        new vec3(this.currentChevronPos.x, this.currentChevronPos.y + bobY, this.currentChevronPos.z)
      )
      this.activeTargetChevronObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, this.elapsedTime * 2.2, 0))
    }

    // 5. Animate 2-Zone Causal Coolant Flow Rings, Bottleneck Barrier, Riser Pulse & Sight-Glass Impeller
    this.animateCausalFlowSystem(clampedDt)

    // 6. Animate Pressure Purge Plume & Thermal Overheat Crown
    if (this.regulatorPurgePlumeObj) {
      if (this.purgePlumeTimer > 0) {
        this.purgePlumeTimer = Math.max(0, this.purgePlumeTimer - clampedDt)
        if (!this.regulatorPurgePlumeObj.enabled) {
          this.regulatorPurgePlumeObj.enabled = true
        }
        const prog = 1.0 - this.purgePlumeTimer / 1.8
        this.regulatorPurgePlumeObj
          .getTransform()
          .setLocalPosition(new vec3(0, 2.0 + prog * 2.6, 0))
        const s = 0.8 + prog * 0.75
        this.regulatorPurgePlumeObj.getTransform().setLocalScale(new vec3(s, 1.0 + prog * 0.5, s))
      } else if (this.regulatorPurgePlumeObj.enabled) {
        this.regulatorPurgePlumeObj.enabled = false
      }
    }

    if (this.relayOverheatCrownObj && this.relayOverheatCrownObj.enabled) {
      const heatPulse = 1.0 + Math.sin(this.elapsedTime * 9.0) * 0.14
      this.relayOverheatCrownObj.getTransform().setLocalScale(new vec3(heatPulse, 1.0, heatPulse))
      this.relayOverheatCrownObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, -this.elapsedTime * 2.4, 0))
    }

    // 7. Pulse selected hotspot halo for immediate spatial guidance
    this.pulseHalo(this.valveHaloObj, "valve", clampedDt)
    this.pulseHalo(this.regulatorHaloObj, "regulator", clampedDt)
    this.pulseHalo(this.relayHaloObj, "relay", clampedDt)

    // 8. Animate Scan Sweep Ring if active
    if (this.scanRingObj && this.scanRingObj.enabled) {
      this.scanTimer += clampedDt
      const sweepY = -4.2 + Math.sin(this.scanTimer * 4.8) * 6.2
      this.scanRingObj.getTransform().setLocalPosition(new vec3(0, sweepY, 0))
    }

    // 9. Pulse overhead status beacon
    if (this.statusBeaconPivot) {
      const pulse = 1.0 + Math.sin(this.elapsedTime * 4.5) * 0.08
      this.statusBeaconPivot.getTransform().setLocalScale(new vec3(pulse, pulse, pulse))
    }

    this.mechanicalTransformsDirty = false
  }

  private animateCausalFlowSystem(clampedDt: number): void {
    // A. Rotate Sight-Glass Turbine Impeller proportional to simulated flow (dirty-gated when LOTO halted)
    if (this.manifoldImpellerObj) {
      const impellerSpeed =
        this.flowBottleneckStage === "nominal_100pct"
          ? 14.0
          : this.flowBottleneckStage === "choked_142psi"
            ? 2.4 + Math.sin(this.elapsedTime * 12.0) * 1.4
            : 0.0
      if (impellerSpeed > 0 || this.mechanicalTransformsDirty) {
        this.impellerAngleRad = (this.impellerAngleRad + clampedDt * impellerSpeed) % (Math.PI * 2)
        this.manifoldImpellerObj
          .getTransform()
          .setLocalRotation(quat.fromEulerAngles(0, 0, this.impellerAngleRad))
      }
    }

    // B. Pulse Vapor-Lock Bottleneck Barrier at x=-0.65 only once PR-204 bottleneck is revealed
    if (this.faultBottleneckRingObj && (this.isRegulatorBlockedRevealed || this.mechanicalTransformsDirty)) {
      const bScale = this.isRegulatorBlockedRevealed
        ? 1.06 + Math.sin(this.elapsedTime * 11.0) * 0.12
        : 0.88
      this.faultBottleneckRingObj.getTransform().setLocalScale(new vec3(1.0, bScale, bScale))
    }

    // C. Animate Vertical Riser Over-Pressure Surge Ring (climbs y=1.5..4.6 into PR-204)
    if (this.riserPressurePulseObj && this.riserPressurePulseObj.enabled) {
      const riserT = (this.elapsedTime * 1.9) % 1.0
      const riserY = 1.5 + riserT * 3.1
      const riserScale = 0.9 + Math.sin(riserT * Math.PI) * 0.25
      this.riserPressurePulseObj.getTransform().setLocalPosition(new vec3(0, riserY, 0.4))
      this.riserPressurePulseObj
        .getTransform()
        .setLocalScale(new vec3(riserScale, 1.0, riserScale))
    }

    // D. Animate 6 Manifold Coolant Flow Pulse Rings across Upstream (0..2) and Downstream (3..5)
    if (this.flowBottleneckStage === "nominal_100pct") {
      // Full 100% laminar flow across the entire manifold (-6.2 to +6.2)
      this.flowPhaseOffset = (this.flowPhaseOffset + clampedDt * 8.2) % 12.4
      for (let i = 0; i < this.coolantFlowRings.length; i++) {
        const ring = this.coolantFlowRings[i]
        const offset = (this.flowPhaseOffset + i * (12.4 / 6)) % 12.4
        const xPos = -6.2 + offset
        ring.getTransform().setLocalPosition(new vec3(xPos, 1.2, 0.4))
        const pulseScale = 1.04 + Math.sin(this.elapsedTime * 7.0 + i) * 0.08
        ring.getTransform().setLocalScale(new vec3(1.0, pulseScale, pulseScale))
      }
    } else if (this.flowBottleneckStage === "choked_142psi") {
      // Upstream (0..2): travels from CV-101 (-6.2) and slams/compresses into the PR-204 blockage (-0.95)
      this.flowPhaseOffset = (this.flowPhaseOffset + clampedDt * 3.2) % 5.2
      for (let i = 0; i < 3; i++) {
        const ring = this.coolantFlowRings[i]
        const rawT = ((this.flowPhaseOffset + i * 1.73) % 5.2) / 5.2
        // Non-linear deceleration/bunching near the blockage at x = -0.95
        const easedT = 1.0 - Math.pow(1.0 - rawT, 1.85)
        const xPos = -6.2 + easedT * 5.25
        const impactScale = 0.92 + easedT * 0.28
        ring.getTransform().setLocalPosition(new vec3(xPos, 1.2, 0.4))
        ring.getTransform().setLocalScale(new vec3(1.0 - easedT * 0.35, impactScale, impactScale))
      }
      // Downstream (3..5): starved droplets crawl from +0.8 to +4.2 and shrink/evaporate before reaching TR-309 (+6.8)!
      for (let i = 3; i < this.coolantFlowRings.length; i++) {
        const ring = this.coolantFlowRings[i]
        const idx = i - 3
        const starveT = ((this.elapsedTime * 0.55 + idx * 0.33) % 1.0)
        const xPos = 0.85 + starveT * 3.6
        const shrinkScale = Math.max(0.18, (1.0 - starveT) * 0.58)
        ring.getTransform().setLocalPosition(new vec3(xPos, 1.2, 0.4))
        ring.getTransform().setLocalScale(new vec3(shrinkScale, shrinkScale, shrinkScale))
      }
    } else if (this.flowRingsParkedDirty) {
      // LOTO Isolated (0% intake flow during Steps 1..3): write parked positions once instead of every frame
      for (let i = 0; i < this.coolantFlowRings.length; i++) {
        const ring = this.coolantFlowRings[i]
        const xPos = i < 3 ? -5.6 + i * 1.8 : 1.4 + (i - 3) * 1.6
        const parkedScale = i < 3 ? 0.38 : 0.16
        ring.getTransform().setLocalPosition(new vec3(xPos, 1.2, 0.4))
        ring.getTransform().setLocalScale(new vec3(parkedScale, parkedScale, parkedScale))
      }
      this.flowRingsParkedDirty = false
    }
  }

  private pulseHalo(haloObj: SceneObject | null, id: HotspotId, clampedDt: number): void {
    if (!haloObj) return
    const flash = this.pinchFlashTimers[id] > 0 ? (this.pinchFlashTimers[id] / 0.45) * 0.26 : 0
    if (this.pinchFlashTimers[id] > 0) {
      this.pinchFlashTimers[id] = Math.max(0, this.pinchFlashTimers[id] - clampedDt)
    }
    const interlockBoost =
      this.interlockFlashTimers[id] > 0 ? Math.abs(Math.sin(this.elapsedTime * 18.0)) * 0.34 : 0
    if (this.interlockFlashTimers[id] > 0) {
      this.interlockFlashTimers[id] = Math.max(0, this.interlockFlashTimers[id] - clampedDt)
      if (this.interlockFlashTimers[id] === 0 && this.lastSnapshot) {
        this.updateHotspotHalos(this.lastSnapshot)
      }
    }
    const isTarget =
      this.selectedHotspot === id ||
      this.activeStepTargetHotspot === id ||
      this.nextTraceTarget === id
    const speed = isTarget ? 6.5 : 3.0
    const amp = isTarget ? 0.14 : 0.05
    const base = isTarget ? 1.10 : 0.96
    const s = base + Math.sin(this.elapsedTime * speed) * amp + flash + interlockBoost
    haloObj.getTransform().setLocalScale(new vec3(s, s, 1.0))
  }
}
