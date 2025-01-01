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

    public static getVetor(p0: Point, p1: Point): Vector {
        return {
            x: p1.x - p0.x,
            y: p1.y - p0.y,
            z: (p0.z === undefined || p1.z === undefined) ? undefined : p1.z - p0.z,
        }
    }

    public static scaleVector(v: Vector, scale: number): Vector {
        return {
            x: v.x * scale,
            y: v.y * scale,
            z: v.z === undefined ? undefined : v.z * scale,
        }
    }

    public static addVector(p: Point, v: Vector): Point {
        return {
            x: p.x + v.x,
            y: p.y + v.y,
            z: (p.z === undefined || v.z === undefined) ? undefined : p.z + v.z,
        }
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