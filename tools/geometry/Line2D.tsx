import { RotationDirection } from "@/enums/rotationDirection"
import { IPoint2D, Point2D } from "./Point2D"
import { IVector2D, Vector2D } from "./Vector2D"

export interface ILine2D {
    p0: IPoint2D
    p1: IPoint2D
}

export class Line2D {
    public static getTangeant(p0: IPoint2D, d0: number, r0: RotationDirection, p1: IPoint2D, d1: number, r1: RotationDirection): ILine2D {
        var v: IVector2D = Point2D.substract(p1, p0)
        const l: number = Vector2D.len(v)
        v = Vector2D.normalize(v)

        if (r0 == r1) {
            const a: number = Math.acos((d0 + d1) / l / 2) * (r0 == RotationDirection.ClockWise ? -1 : 1)
            return {
                p0: Point2D.add(p0, Vector2D.scale(Vector2D.rotate(v, a), d0 / 2)),
                p1: Point2D.add(p1, Vector2D.scale(Vector2D.rotate(v, a), d1 / 2)),
            }
        }
        else {
            const a: number = Math.acos((d0 - d1) / l / 2) * (r0 == RotationDirection.ClockWise ? -1 : 1)
            return {
                p0: Point2D.add(p0, Vector2D.scale(Vector2D.rotate(v, a), d0 / 2)),
                p1: Point2D.add(p1, Vector2D.scale(Vector2D.rotate(Vector2D.scale(v, -1), a), d1 / 2)),
            }
        }
    }
}