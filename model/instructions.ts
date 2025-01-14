import { Point } from "@/tools/geometry/cartesian"

export enum RotationDirection{
    ClockWise = 0,
    AntiClockWise = 1,
}

export type Nail = {
    diameter: number
    position: Point
}

export type Step = {
    nailIndex: number
    direction: RotationDirection
}

export type Instructions = {
    nails: Nail[]
    steps: Step[]
}