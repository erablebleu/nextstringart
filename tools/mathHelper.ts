export namespace MathHelper {
    export function sum(values: Array<number>): number {
        return values.reduce((sum: number, v: number) => sum + v, 0)
    }

    export function min(values: Array<number>): number {
        return values.reduce((min, v) => min <= v ? min : v, Infinity)
    }

    export function max(values: Array<number>): number {
        return values.reduce((max, v) => max >= v ? max : v, -Infinity)
    }

    export function clamp(value: number, min: number, max: number): number {
        if (value < min) return min
        if (value > max) return max
        return value
    }
}