import { IPoint2D, Point2D } from "@/tools/geometry/Point2D"
import { Nail } from "./instructions"

export class Project {
    public map: Map = new Map
    public threads: Thread[] = [
        new Thread()
    ]
}

export class Map {
    public scale: number = 1
    public position: IPoint2D = { x: 0, y: 0}
    public nails: Nail[] = []
    public lines: number[][] = [] // by nails index
}

export class Thread {
    public color: string = "#000000"
    public previewThickness: number = 0.1
    public imageSteps: ImageStep[] = []
}

export class ImageStep {
    public maxStep: number = 4000
    public calculationThickness: number = 0.1
    public imageData: Uint8Array = new Uint8Array()
    public colorOptions: ColorOptions = new ColorOptions()
    public luminosityOptions: LuminosityOptions = new LuminosityOptions()
}

export class LuminosityOptions {
    public isEnabled: boolean = false
    public brightness: number = 0
    public contrast: number = 0
}

export class ColorOptions {
    public isEnabled: boolean = false
    public colorMatrix: number[][] = [
        [ 0.30, 0.30, 0.30 ],
        [ 0.59, 0.59, 0.59 ],
        [ 0.11, 0.11, 0.11 ],
    ]
}