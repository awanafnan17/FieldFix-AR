/**
 * LeafIndex.ts
 * Registers FieldFix AR automated LEAF test scenarios with the Lens Studio LEAF runner.
 */

import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import { FieldFixFullDiagnosticRepairScenario } from "./FieldFixLeafScenario"
import { FieldFixMidRepairShowcaseScenario } from "./FieldFixMidRepairShowcaseScenario"
import { FieldFixResetAndReplayScenario } from "./FieldFixResetAndReplayScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenarios: ScenarioMetadata[] = [
    {
      id: "FieldFixFullDiagnosticRepairScenario",
      typename: FieldFixFullDiagnosticRepairScenario.getTypeName()
    },
    {
      id: "FieldFixMidRepairShowcaseScenario",
      typename: FieldFixMidRepairShowcaseScenario.getTypeName()
    },
    {
      id: "FieldFixResetAndReplayScenario",
      typename: FieldFixResetAndReplayScenario.getTypeName()
    }
  ]
}
