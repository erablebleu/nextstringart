import { IVector2D } from "./Vector2D"

export interface IPoint2D {
    x: number
    y: number
}

export class Point2D {
    public static add(p: IPoint2D, v: IVector2D): IPoint2D {
        return { x: p.x + v.x, y: p.y + v.y }
    }

    public static substract(p: IPoint2D, p2: IPoint2D): IVector2D {
        return { x: p.x - p2.x, y: p.y - p2.y }
    }
}