import { RotationDirection } from "@/enums/rotationDirection"
import { IPoint2D } from "@/tools/geometry/Point2D"

export interface INail {
    diameter: number
    position: IPoint2D
}

export interface IStep {
    nailIndex: number
    direction: RotationDirection
}

export interface IInstructions {
    map: INail[]
    steps: IStep[]
}