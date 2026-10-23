/**
 * FieldFixLeafInteractor.ts
 * Custom LEAF interactor for driving FieldFix AR UI buttons, 3D equipment hotspots,
 * and reading world-space UI text & state assertions.
 */

import { findInteractableByName } from "Leaf.lspkg/Interactors/InteractableUtils"
import { DefaultLeafInteractor } from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import { findSceneObjectByName, nextFrame, sleep } from "Leaf.lspkg/Utils/common/Utils"
import { FieldFixMain } from "../Scripts/FieldFixMain"
import { FieldFixUISnapshot } from "../Scripts/FieldFixState"

export class FieldFixLeafInteractor extends DefaultLeafInteractor {
  constructor() {
    super("FieldFixLeafInteractor")
  }

  public async waitForReady(maxWaitMs: number = 2500): Promise<FieldFixMain> {
    let elapsed = 0
    while (elapsed < maxWaitMs) {
      const main = FieldFixMain.getInstance()
      const btn = findInteractableByName("BtnPrimaryAction")
      if (main && btn) {
        await nextFrame()
        return main
      }
      await sleep(100)
      elapsed += 100
    }
    const fallbackMain = FieldFixMain.getInstance()
    if (!fallbackMain) {
      throw new Error("FieldFixMain instance did not initialize within timeout.")
    }
    return fallbackMain
  }

  public async triggerNamedInteractable(sceneObjectName: string): Promise<void> {
    const interactable = findInteractableByName(sceneObjectName)
    if (!interactable) {
      throw new Error(`Interactable "${sceneObjectName}" not found in scene.`)
    }
    await this.trigger(interactable)
    await nextFrame()
  }

  public getLabelText(sceneObjectName: string): string {
    const obj = findSceneObjectByName(sceneObjectName)
    if (!obj) return ""
    const txt = obj.getComponent("Component.Text") as Text | null
    return txt ? txt.text : ""
  }

  public getSnapshot(): FieldFixUISnapshot {
    const main = FieldFixMain.getInstance()
    if (!main) {
      throw new Error("FieldFixMain instance not available.")
    }
    return main.getSnapshot()
  }
}
