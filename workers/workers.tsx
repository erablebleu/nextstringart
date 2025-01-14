import { NailMap, Project } from "@/model"

export type CalculatorInput = {
    project: Project    
    nailMap: NailMap    
    imageDatas: Array<Uint8ClampedArray>
    threads: Array<boolean>
}

export type CalculatorProgress = {
    stepIndex: number
    threadIndex: number
    message?: string
}

export enum CalculatorMessageType {
    Progress,
    Result
}

export type CalculatorMessage = {
    type: CalculatorMessageType
    value: any
}