import { Instructions, NailMap, Project, ProjectSettings } from "@/model"

export type CalculationWorkerInfo = {
    threadIndex: number
    threadCount: number
    stepIndex: number
    stepCount: number
}

export type CalculationWokerMessage = {
    info?: CalculationWorkerInfo
    result?: Instructions
}

export type CalculationWorkerStartData = {
    project: Project
    projectSettings: ProjectSettings
    nailMap: NailMap
    imageDatas: Array<Uint8Array>,
}