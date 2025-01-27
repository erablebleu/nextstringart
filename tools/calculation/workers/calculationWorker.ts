import { Instructions, NailMap, Project, ProjectSettings } from "@/model"
import { ImageInfo } from "@/tools/imaging/jimpHelper"

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
    imageDatas: Array<ImageInfo>,
}