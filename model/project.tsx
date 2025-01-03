import { CircleFrame, DefaultFrame, Frame, PolygonFrame } from "./frame"
import { IInstructions, IStep } from "./instructions"
import { NailMap } from "./nailMap"

export interface IProject {
    frame: PolygonFrame | CircleFrame
    nailMap: NailMap
    threads: Thread[]
    steps: IStep[]
    uuid: string
}

export class Project {
    public static getInstructions(project: IProject): IInstructions {
        return {
            steps: [],
            map: project.nailMap.nails
        }
    }
    public static new(): IProject {
        return {
            uuid: crypto.randomUUID(),
            frame: DefaultFrame(),
            nailMap: new NailMap,
            threads: [],
            steps: [],
        }
    }
}

export interface IImageInfo {
    imageData: string
    width: number
    height: number
}

export class Thread {
    public color: string = "#000000"
    public previewThickness: number = 0.1
    public maxStep: number = 4000
    public calculationThickness: number = 0.1
    public imageInfo: IImageInfo = {
        imageData: '',
        width: 0,
        height: 0
    }
    public colorOptions: ColorOptions = new ColorOptions()
    public luminosityOptions: LuminosityOptions = new LuminosityOptions()
    public description?: string = "Black thread"
}

export class LuminosityOptions {
    public isEnabled: boolean = false
    public brightness: number = 1 // [0; 2]
    public contrast: number = 1 // [0; 2]
}

export class ColorOptions {
    public isEnabled: boolean = false
    public colorMatrix: number[][] = [
        [0.30, 0.30, 0.30],
        [0.59, 0.59, 0.59],
        [0.11, 0.11, 0.11],
    ]
}