import { CalculationMethod, ProjectSettings } from "@/model"
import { CalculationWorker } from "./calculationWorker"
import { MriCalculationWorker } from "./mriCalculationWorker"
import { DeltaCalculationWorker } from "./deltaCalculationWorker"

export namespace CalculationHelper {
    export function getWorker(projectSettings: ProjectSettings): CalculationWorker {
        switch (projectSettings.calculationMethod) {
            case CalculationMethod.mri: return new MriCalculationWorker(projectSettings)
            case CalculationMethod.delta: return new DeltaCalculationWorker(projectSettings)
        }
    }
}