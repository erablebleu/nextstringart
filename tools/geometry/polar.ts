
export type PolarPoint = {
    a: number
    r: number
}

export class Polar {
    public static fromCardinal(p: { x: number, y: number }): PolarPoint {
        return {
            a: Math.atan2(p.y, p.x),
            r: Math.sqrt(Math.pow(p.x, 2) + Math.pow(p.y, 2))
        }
    }
}