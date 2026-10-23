/**
 * FieldFixEquipmentMesh.ts
 * Multi-part procedural 3D Industrial Cryo-Coolant Pump & Relay Unit built with
 * Lens Studio MeshBuilder + SimpleVertexBaseColor material and SIK 3D Interactable hotspots.
 *
 * Includes:
 * - Asymmetric 3D Valve Lever Handle (unmistakable 0 deg / -90 deg LOTO / +90 deg Open silhouette)
 * - 3D Spatial X-Ray / Exploded Internal Sub-Assemblies (ValveInternalCryoSeal, RegulatorInternalDiaphragm, RelayInternalStatorCoil)
 * - Before / After Fault vs. Nominal Spatial Comparison override
 * - LOTO Safety Interlock 3D Red Hazard Flash
 * - Strictly adheres to CLAD rules: zero UIKit or Component.Text usage in this 3D module.
 */

import { Interactable } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import Event, { PublicApi } from "SpectaclesInteractionKit.lspkg/Utils/Event"
import { DiagnosticPhase, FieldFixUISnapshot, HotspotId } from "./FieldFixState"

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
      this.addQuad(
        [cx + c0 * outerR, cy + s0 * outerR, zBack],
        [cx + c1 * outerR, cy + s1 * outerR, zBack],
        [cx + c1 * outerR, cy + s1 * outerR, zFront],
        [cx + c0 * outerR, cy + s0 * outerR, zFront],
        [(c0 + c1) * 0.5, (s0 + s1) * 0.5, 0],
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

  // 1. 3D floating target action chevron that hovers over the active step's target component
  private activeTargetChevronObj: SceneObject | null = null
  private activeTargetChevronVisual: RenderMeshVisual | null = null
  private targetChevronPos: vec3 = new vec3(-6.8, 5.5, 2.4)
  private currentChevronPos: vec3 = new vec3(-6.8, 5.5, 2.4)

  // 2. Animated 3D Cryo-Coolant Flow Pulse Rings travelling through the manifold pipe
  private coolantFlowRings: SceneObject[] = []
  private coolantFlowVisuals: RenderMeshVisual[] = []
  private flowPhaseOffset: number = 0

  // Animation targets & current values
  private currentPhase: DiagnosticPhase = "READY_TO_SCAN"
  private selectedHotspot: HotspotId = "relay"
  private activeStepTargetHotspot: HotspotId = "valve"
  private completedSteps: boolean[] = [false, false, false, false]
  private coolantFlowPct: number = 18
  private xrayMode: boolean = false
  private currentXrayBlend: number = 0.0

  private currentValveAngleDeg: number = 0
  private targetValveAngleDeg: number = 0

  private currentGaugeAngleDeg: number = 48
  private targetGaugeAngleDeg: number = 48

  private currentRelayLiftCm: number = 1.35
  private targetRelayLiftCm: number = 1.35

  private currentRelayRotationDeg: number = 0
  private targetRelayRotationDeg: number = 0

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
      pb.addCylinderX(0, 0, 0, 1.32, 0.42, 14, c, c)
      return pb.buildMesh()
    }

    this.flowRingMeshAmber = buildFlowRing([1.0, 0.72, 0.18, 1.0])
    this.flowRingMeshCyan = buildFlowRing([0.22, 0.92, 1.0, 1.0])
    this.flowRingMeshGreen = buildFlowRing([0.20, 0.98, 0.56, 1.0])
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

    // Overhead Status Beacon on top of the mast
    this.statusBeaconPivot = global.scene.createSceneObject("OverheadStatusBeacon")
    this.statusBeaconPivot.setParent(this.sceneObject)
    this.statusBeaconPivot.getTransform().setLocalPosition(new vec3(-4.2, 8.8, -2.2))
    if (this.beaconMeshRed) {
      this.statusBeaconVisual = this.attachMeshVisual(this.statusBeaconPivot, this.beaconMeshRed)
    }

    // Animated Coolant Flow Pulse Rings along the horizontal manifold pipe (y=1.2, z=0.4)
    for (let i = 0; i < 3; i++) {
      const ringObj = global.scene.createSceneObject(`CoolantFlowPulseRing_${i}`)
      ringObj.setParent(this.sceneObject)
      ringObj.getTransform().setLocalPosition(new vec3(-5.0 + i * 5.0, 1.2, 0.4))
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

  public applySnapshot(snapshot: FieldFixUISnapshot): void {
    this.currentPhase = snapshot.phase
    this.selectedHotspot = snapshot.selectedHotspot
    this.activeStepTargetHotspot = snapshot.currentStep.targetHotspot
    this.completedSteps = snapshot.comparisonFaultPreview
      ? [false, false, false, false]
      : [...snapshot.completedSteps]
    this.coolantFlowPct = snapshot.coolantFlowPct
    this.xrayMode = snapshot.xrayMode

    if (snapshot.interlockFlashHotspot) {
      this.interlockFlashTimers[snapshot.interlockFlashHotspot] = 0.95
    }

    // Enable or disable 3D X-Ray internal sub-assemblies
    if (this.valveInternalObj) this.valveInternalObj.enabled = this.xrayMode
    if (this.regulatorInternalObj) this.regulatorInternalObj.enabled = this.xrayMode
    if (this.relayInternalObj) this.relayInternalObj.enabled = this.xrayMode

    if (snapshot.phase === "SCANNING") {
      this.scanTimer = 0
      if (this.scanRingObj) {
        this.scanRingObj.enabled = true
      }
    } else if (this.scanRingObj) {
      this.scanRingObj.enabled = false
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

    // Step 2 (Regulator Purge): in right-handed +Z space, +48 deg points left (red danger marker at x=-0.95)
    // and -38 deg points right (green nominal marker at x=+0.95).
    this.targetGaugeAngleDeg = this.completedSteps[1] ? -38 : 48

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

    // Update 3D Active Step Target Pointer position & color
    if (!snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED") {
      this.targetChevronPos = new vec3(0, 10.2, 1.8)
      if (this.activeTargetChevronVisual && this.chevronMeshGreen) {
        this.activeTargetChevronVisual.mesh = this.chevronMeshGreen
      }
    } else {
      const targetId = snapshot.phase === "READY_TO_SCAN" ? snapshot.selectedHotspot : this.activeStepTargetHotspot
      if (targetId === "valve") {
        this.targetChevronPos = new vec3(-6.8, 5.6, 2.4)
      } else if (targetId === "regulator") {
        this.targetChevronPos = new vec3(0, 10.0, 1.8)
      } else {
        this.targetChevronPos = new vec3(6.8, 6.0, 2.0)
      }
      if (this.activeTargetChevronVisual && this.chevronMeshCyan) {
        this.activeTargetChevronVisual.mesh = this.chevronMeshCyan
      }
    }

    // Update Coolant Flow Ring colors
    const targetFlowMesh =
      !snapshot.comparisonFaultPreview && snapshot.phase === "COMPLETED"
        ? this.flowRingMeshGreen
        : this.completedSteps[0]
          ? this.flowRingMeshCyan
          : this.flowRingMeshAmber
    if (targetFlowMesh) {
      for (const vis of this.coolantFlowVisuals) {
        vis.mesh = targetFlowMesh
      }
    }

    // Update 3D Hotspot Diagnostic Halos
    this.updateHotspotHalos(snapshot)
  }

  private updateHotspotHalos(snapshot: FieldFixUISnapshot): void {
    const pickHaloMesh = (id: HotspotId, isRepaired: boolean): RenderMesh | null => {
      if (this.interlockFlashTimers[id] > 0 || snapshot.interlockFlashHotspot === id) {
        return this.haloMeshRed
      }
      if (!snapshot.comparisonFaultPreview && (snapshot.phase === "COMPLETED" || isRepaired)) {
        return this.haloMeshGreen
      }
      if (snapshot.selectedHotspot === id || snapshot.currentStep.targetHotspot === id) {
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
    const targetXray = this.xrayMode ? 1.0 : 0.0
    this.currentXrayBlend += (targetXray - this.currentXrayBlend) * lerpFactor

    // 1. Animate Valve Handwheel rotation + X-Ray axial Z-explosion
    this.currentValveAngleDeg += (this.targetValveAngleDeg - this.currentValveAngleDeg) * lerpFactor
    if (this.valveWheelPivot) {
      this.valveWheelPivot
        .getTransform()
        .setLocalPosition(new vec3(-0.85 * this.currentXrayBlend, -0.65 * this.currentXrayBlend, 0.5 + this.currentXrayBlend * 1.65))
      this.valveWheelPivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, 0, (this.currentValveAngleDeg * Math.PI) / 180))
    }
    if (this.valveInternalObj && this.valveInternalObj.enabled) {
      this.valveInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 2.75 * this.currentXrayBlend, 1.45 * this.currentXrayBlend))
      this.valveInternalObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0.35, this.elapsedTime * 1.8, 0))
    }

    // 2. Animate Pressure Gauge Needle + X-Ray explosion
    const jitter = this.completedSteps[1] ? 0 : Math.sin(this.elapsedTime * 14.0) * 3.0
    this.currentGaugeAngleDeg += (this.targetGaugeAngleDeg - this.currentGaugeAngleDeg) * lerpFactor
    if (this.gaugeNeedlePivot) {
      this.gaugeNeedlePivot
        .getTransform()
        .setLocalPosition(new vec3(0, -0.2, 0.42 + this.currentXrayBlend * 1.35))
      this.gaugeNeedlePivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, 0, ((this.currentGaugeAngleDeg + jitter) * Math.PI) / 180))
    }
    if (this.regulatorInternalObj && this.regulatorInternalObj.enabled) {
      this.regulatorInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 2.85 * this.currentXrayBlend, 1.45 * this.currentXrayBlend))
      this.regulatorInternalObj
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0.25, -this.elapsedTime * 1.6, 0))
    }

    // 3. Animate Thermal Relay Core lift & latch rotation + X-Ray explosion
    this.currentRelayLiftCm += (this.targetRelayLiftCm - this.currentRelayLiftCm) * lerpFactor
    this.currentRelayRotationDeg += (this.targetRelayRotationDeg - this.currentRelayRotationDeg) * lerpFactor
    if (this.relayCorePivot) {
      const thermalBob = !this.completedSteps[2] ? Math.sin(this.elapsedTime * 6.0) * 0.12 : 0
      this.relayCorePivot
        .getTransform()
        .setLocalPosition(
          new vec3(0.75 * this.currentXrayBlend, this.currentRelayLiftCm + thermalBob - 0.45 * this.currentXrayBlend, -1.2 - this.currentXrayBlend * 0.65)
        )
      this.relayCorePivot
        .getTransform()
        .setLocalRotation(quat.fromEulerAngles(0, (this.currentRelayRotationDeg * Math.PI) / 180, 0))
    }
    if (this.relayInternalObj && this.relayInternalObj.enabled) {
      this.relayInternalObj
        .getTransform()
        .setLocalPosition(new vec3(0, 3.15 * this.currentXrayBlend, 1.45 * this.currentXrayBlend))
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

    // 5. Animate 3D Coolant Flow Pulse Rings along the manifold pipe (-6.0 to +6.0)
    const flowSpeed = this.coolantFlowPct <= 0 ? 0.0 : this.coolantFlowPct >= 90 ? 7.5 : 2.2
    this.flowPhaseOffset = (this.flowPhaseOffset + clampedDt * flowSpeed) % 12.0
    for (let i = 0; i < this.coolantFlowRings.length; i++) {
      const ring = this.coolantFlowRings[i]
      const offset = (this.flowPhaseOffset + i * 4.0) % 12.0
      const xPos = -6.0 + offset
      ring.getTransform().setLocalPosition(new vec3(xPos, 1.2, 0.4))
      const pulseScale = this.coolantFlowPct <= 0 ? 0.85 : 1.0 + Math.sin(this.elapsedTime * 6.0 + i) * 0.08
      ring.getTransform().setLocalScale(new vec3(1.0, pulseScale, pulseScale))
    }

    // 6. Pulse selected hotspot halo for immediate spatial guidance
    this.pulseHalo(this.valveHaloObj, "valve", clampedDt)
    this.pulseHalo(this.regulatorHaloObj, "regulator", clampedDt)
    this.pulseHalo(this.relayHaloObj, "relay", clampedDt)

    // 7. Animate Scan Sweep Ring if active
    if (this.scanRingObj && this.scanRingObj.enabled) {
      this.scanTimer += clampedDt
      const sweepY = -4.2 + Math.sin(this.scanTimer * 4.8) * 6.2
      this.scanRingObj.getTransform().setLocalPosition(new vec3(0, sweepY, 0))
    }

    // 8. Pulse overhead status beacon
    if (this.statusBeaconPivot) {
      const pulse = 1.0 + Math.sin(this.elapsedTime * 4.5) * 0.08
      this.statusBeaconPivot.getTransform().setLocalScale(new vec3(pulse, pulse, pulse))
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
    }
    const isTarget = this.selectedHotspot === id || this.activeStepTargetHotspot === id
    const speed = isTarget ? 6.5 : 3.0
    const amp = isTarget ? 0.14 : 0.05
    const base = isTarget ? 1.10 : 0.96
    const s = base + Math.sin(this.elapsedTime * speed) * amp + flash + interlockBoost
    haloObj.getTransform().setLocalScale(new vec3(s, s, 1.0))
  }
}
