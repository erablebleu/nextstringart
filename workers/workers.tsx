import { IProject } from "@/model/project"

export interface ICalculatorInput {
    project: IProject    
    imageDatas: Array<Uint8ClampedArray>
    threads: Array<boolean>
}

export interface ICalculatorProgress {
    stepIndex: number
    threadIndex: number
    message?: string
}

export enum CalculatorMessageType {
    Progress,
    Result
}

export interface ICalculatorMessage {
    type: CalculatorMessageType
    value: any
}