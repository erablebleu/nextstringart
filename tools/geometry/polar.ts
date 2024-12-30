import { Cartesian, Point } from "./cartesian"

export type PolarPoint = {
    a: number
    r: number
}

export class Polar {
    public static fromCartesian(p: Point): PolarPoint {
        return {
            a: Math.atan2(p.y, p.x),
            r: Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2))
        }
    }

    public static toCartesian(p: PolarPoint): Point {
        return Cartesian.fromPolar(p)
    }

    public static normalizeAngle(a: number): number {
        while (a < Math.PI) a += 2 * Math.PI
        while (a > Math.PI) a -= 2 * Math.PI

        return a
    }
}