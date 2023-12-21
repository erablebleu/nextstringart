import { RotationDirection } from "@/enums/rotationDirection"
import { IPoint2D } from "@/tools/geometry/Point2D"

export class Nail {
    public diameter: number = 0
    public position: IPoint2D = { x: 0, y: 0 }
}

export class Step {
    public nailIndex: number = 0
    public direction: RotationDirection = RotationDirection.ClockWise
}

export class Instructions
{
    public map: Nail[] = []
    public steps: Step[] = []
}