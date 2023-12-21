export interface IVector2D {
    x: number
    y: number
}

export class Vector2D {
    public static len(v: IVector2D): number {
        return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2))
    }

    public static normalize(v: IVector2D): IVector2D {
        return Vector2D.scale(v, 1 / Vector2D.len(v))
    }

    public static scale(v: IVector2D, factor: number): IVector2D {
        return { x: v.x * factor, y: v.y * factor }
    }

    public static rotate(v: IVector2D, angle: number): IVector2D {
        const c: number = Math.cos(angle)
        const s: number = Math.sin(angle)
        return {
            x: c * v.x - s * v.y,
            y: s * v.x + c * v.y,
        }
    }
}