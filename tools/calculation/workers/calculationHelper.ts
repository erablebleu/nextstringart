import { CalculationMethod, ProjectSettings } from "@/model"
import { Worker } from "worker_threads"
import { CalculationWorkerInfo } from "./calculationWorker"

export namespace CalculationHelper {
    export function getWorker(projectSettings: ProjectSettings): Worker {
        switch (projectSettings.calculationMethod) {
            case CalculationMethod.delta: return new Worker(/* webpackChunkName: "calculation.worker" */ new URL('./deltaCalculation.worker.ts', import.meta.url))
            case CalculationMethod.mri: return new Worker(/* webpackChunkName: "mriCalculation.worker" */ new URL('./mriCalculation.worker.ts', import.meta.url))
        }
        throw new Error()
    }

    export function getProgress(info: CalculationWorkerInfo) {
        return Math.min(1, info.threadIndex / info.threadCount + (info.stepIndex / info.stepCount / info.threadCount))
    }
}