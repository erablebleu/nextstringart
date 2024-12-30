import { Polar, PolarPoint } from "./polar"

export type Point = {
    x: number
    y: number
}

export type Vector = {
    x: number
    y: number
}

export type Line = { // y = ax + b
    a: number
    b: number
}

export type Segment = {
    p0: Point
    p1: Point
}

export class Cartesian {
    public static fromPolar(p: PolarPoint): Point {
        let a = Polar.normalizeAngle(p.a)

        return {
            x: p.r * Math.cos(a),
            y: p.r * Math.sin(a),
        }
    }

    public static toPolar(p: Point): PolarPoint {
        return Polar.fromCartesian(p)
    }

    public static getVetor(p0: Point, p1: Point): Vector {
        return {
            x: p1.x - p0.x,
            y: p1.y - p0.y,
        }
    }

    public static scaleVector(v: Vector, scale: number): Vector {
        return {
            x: v.x * scale,
            y: v.y * scale,
        }
    }

    public static addVector(p: Point, v: Vector): Point {
        return {
            x: p.x + v.x,
            y: p.y + v.y,
        }
    }

    public static middleOf(p0: Point, p1: Point): Point {
        return {
            x: (p0.x + p1.x) / 2,
            y: (p0.y + p1.y) / 2,
        }
    }

    public static line(p0: Point, p1: Point): Line {
        const a = (p0.y - p1.y) / (p0.x - p1.x)
        return {
            a,
            b: p0.y - a * p0.x
        }
    }

    public static perpendicular(line: Line, p: Point): Line {
        const a = -1 / line.a
        return {
            a,
            b: p.y - a * p.x
        }
    }

    public static distance(p0: Point, p1: Point): number {
        return Math.sqrt(Math.pow(p0.x - p1.x, 1) + Math.pow(p0.y - p1.y, 1))
    }

    public static getDistantPoints(l: Line, p: Point, distance: number): Array<Point> {
        const A = 1 + Math.pow(l.a, 2)
        const B = 2 * (l.a * l.b - l.a * p.y - p.x)
        const C = Math.pow(p.x, 2) + Math.pow(p.y, 2) + Math.pow(l.b, 2) - Math.pow(distance, 2) - 2 * l.b * p.y

        const delta = Math.pow(B, 2) - 4 * A * C

        // no solutions
        if (delta < 0)
            return []

        if (delta == 0) {
            const x = -B / (2 * A)
            return [{ x, y: l.a * x + l.b }]
        }

        const x0 = (-B - Math.sqrt(delta)) / (2 * A)
        const x1 = (-B - Math.sqrt(delta)) / (2 * A)

        return [
            { x: x0, y: l.a * x0 + l.b },
            { x: x1, y: l.a * x1 + l.b },
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