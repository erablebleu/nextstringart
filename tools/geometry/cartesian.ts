import { RotationDirection } from "@/model"
import { Polar, PolarPoint } from "./polar"

export type Point = {
    x: number
    y: number
    z?: number
}

export type Vector = {
    x: number
    y: number
    z?: number
}

export type Line = {
    p0: Point
    p1: Point
}

export namespace VectorHelper {
    export function len(v: Vector): number {
        return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2))
    }

    export function normalize(v: Vector): Vector {
        return VectorHelper.scale(v, 1 / VectorHelper.len(v))
    }

    export function scale(v: Vector, factor: number): Vector {
        return {
            x: v.x * factor,
            y: v.y * factor,
            z: v.z === undefined ? undefined : v.z * factor,
        }
    }

    export function rotate(v: Vector, angle: number): Vector {
        const c: number = Math.cos(angle)
        const s: number = Math.sin(angle)
        return {
            x: c * v.x - s * v.y,
            y: s * v.x + c * v.y,
        }
    }
}

export namespace PointHelper {
    export function add(p: Point, v: Vector): Point {
        return {
            x: p.x + v.x,
            y: p.y + v.y,
            z: (p.z === undefined || v.z === undefined) ? undefined : p.z + v.z,
        }
    }

    export function substract(p0: Point, p1: Point): Vector {
        return {            
            x: p1.x - p0.x,
            y: p1.y - p0.y,
            z: (p0.z === undefined || p1.z === undefined) ? undefined : p1.z - p0.z,
        }
    }
}

export namespace LineHelper {
    export function getTangeant(p0: Point, d0: number, r0: RotationDirection, p1: Point, d1: number, r1: RotationDirection): Line {
        var v: Vector = PointHelper.substract(p1, p0)
        const l: number = VectorHelper.len(v)
        v = VectorHelper.normalize(v)

        if (r0 == r1) {
            const a: number = Math.acos((d0 + d1) / l / 2) * (r0 == RotationDirection.ClockWise ? -1 : 1)
            return {
                p0: PointHelper.add(p0, VectorHelper.scale(VectorHelper.rotate(v, a), d0 / 2)),
                p1: PointHelper.add(p1, VectorHelper.scale(VectorHelper.rotate(v, a), d1 / 2)),
            }
        }
        else {
            const a: number = Math.acos((d0 - d1) / l / 2) * (r0 == RotationDirection.ClockWise ? -1 : 1)
            return {
                p0: PointHelper.add(p0, VectorHelper.scale(VectorHelper.rotate(v, a), d0 / 2)),
                p1: PointHelper.add(p1, VectorHelper.scale(VectorHelper.rotate(VectorHelper.scale(v, -1), a), d1 / 2)),
            }
        }
    }
}

export class Cartesian {
    public static fromPolar(p: PolarPoint): Point {
        let a = Polar.normalizeAngle(p.a)

        return {
            x: p.r * Math.cos(a),
            y: p.r * Math.sin(a),
            z: p.z,
        }
    }

    public static toPolar(p: Point): PolarPoint {
        return Polar.fromCartesian(p)
    }

    public static middleOf(p0: Point, p1: Point): Point {
        return {
            x: (p0.x + p1.x) / 2,
            y: (p0.y + p1.y) / 2,
            z: (p0.z === undefined || p1.z === undefined) ? undefined : (p0.z + p1.z) / 2,
        }
    }

    public static distance(p0: Point, p1: Point): number {
        const d = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2))
        return (p0.z === undefined || p1.z === undefined)
            ? d
            : Math.sqrt(Math.pow(d, 2) + Math.pow(p0.z - p1.z, 2))
    }

    public static getEquidistantPoints(p0:Point, p1: Point, distance: number): Array<Point> {
        const d = Math.sqrt(Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2))
        const dsq = Math.pow(d, 2)
        const rsq = Math.pow(distance, 2)

        const c = Math.sqrt(4 * rsq / dsq - 1)

        const fx = (p0.x + p1.x) / 2 
        const gx = c * (p1.y - p0.y) / 2

        const fy = (p0.y + p1.y) / 2
        const gy = c * (p0.x - p1.x) / 2
        
        return [
            { x: fx + gx, y: fy + gy },
            { x: fx - gx, y: fy - gy },
        ]
    }

    public static getClosestPoint(points: Array<Point>, p: Point): Point {
        if (points.length == 0) throw new Error('No points')

        return points.sort((p0: Point, p1: Point) => Cartesian.distance(p0, p) - Cartesian.distance(p1, p))[0]
    }

    public static getFurthestPoint(points: Array<Point>, p: Point): Point {
        if (points.length == 0) throw new Error('No points')

        return points.sort((p0: Point, p1: Point) => Cartesian.distance(p1, p) - Cartesian.distance(p0, p))[0]
    }
}