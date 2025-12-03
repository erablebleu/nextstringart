import { Point } from "../geometry"

export type WeightPoint = Point & {
    weight: number
}

export type PixelLineEvaluation = {
    value: number
    apply: () => void
}

export enum PixelLineMode {
    Simple,
    Bresenham,
    XiaolinWu,
}

export namespace PixelLineHelper {

    export function get(p0: Point, p1: Point, mode: PixelLineMode = PixelLineMode.Simple): WeightPoint[] {
        switch (mode) {
            case PixelLineMode.Simple: return PixelLineHelper.getSimple(p0, p1)
            case PixelLineMode.Bresenham: return PixelLineHelper.getBresenham(p0, p1)
            case PixelLineMode.XiaolinWu: return PixelLineHelper.getXiaolinWu(p0, p1)
        }
    }

    export function getSimple(p0: Point, p1: Point): WeightPoint[] {
        var x0: number = p0.x
        var y0: number = p0.y
        var x1: number = p1.x
        var y1: number = p1.y
        const result: Array<WeightPoint> = []
        const steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0)

        if (steep)
            [x0, y0, x1, y1] = [y0, x0, y1, x1]
        if (x0 > x1)
            [x0, y0, x1, y1] = [x1, y1, x0, y0]

        for (let x = Math.floor(x0); x <= x1; x++) {
            const y: number = Math.floor(y0 + (y1 - y0) * (x - x0) / (x1 - x0))
            result.push(steep ? { x: y, y: x, weight: 1 } : { x, y, weight: 1 })
        }

        return result
    }

    export function getBresenham(p0: Point, p1: Point): WeightPoint[] {
        const fPart: ((value: number) => number) = (value: number) => value - Math.floor(value) + (value > 0 ? 0 : -1)

        var x0: number = p0.x
        var y0: number = p0.y
        var x1: number = p1.x
        var y1: number = p1.y

        const result: Array<WeightPoint> = []
        const steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0)

        if (steep)
            [x0, y0, x1, y1] = [y0, x0, y1, x1]
        if (x0 > x1)
            [x0, y0, x1, y1] = [x1, y1, x0, y0]

        const dx: number = x1 - x0
        const dy: number = y1 - y0

        for (let x = Math.floor(x0); x <= x1; x++) {
            const y: number = y0 + (x - x0) * dy / dx
            const fy: number = fPart(y)

            if (1 - fy > 0)
                result.push(steep
                    ? { x: Math.floor(y), y: x, weight: fy }
                    : { x: x, y: Math.floor(y), weight: fy })
            if (y - 1 < 0)
                continue
            if (fy >= 0)
                result.push(steep
                    ? { x: Math.floor(y) - 1, y: x, weight: 1 - fy }
                    : { x: x, y: Math.floor(y) - 1, weight: 1 - fy })
        }

        return result
    }

    export function getXiaolinWu(p0: Point, p1: Point): WeightPoint[] {
        const fPart: ((value: number) => number) = (value: number) => value - Math.floor(value)
        const rfPart: ((value: number) => number) = (value: number) => 1 - fPart(value);

        var x0: number = p0.x
        var y0: number = p0.y
        var x1: number = p1.x
        var y1: number = p1.y

        const result: WeightPoint[] = []
        const steep: boolean = Math.abs(y1 - y0) > Math.abs(x1 - x0);

        if (steep)
            [x0, y0, x1, y1] = [y0, x0, y1, x1]
        if (x0 > x1)
            [x0, y0, x1, y1] = [x1, y1, x0, y0]

        const dx: number = x1 - x0
        const dy: number = y1 - y0
        const gradient: number = dx == 0 ? 1 : dy / dx

        var xend: number = Math.round(x0)
        var yend: number = y0 + gradient * (xend - x0)
        var xgap: number = rfPart(x0 + 0.5)
        const xpxl1: number = xend
        const ypxl1: number = Math.floor(yend)

        if (steep) {
            result.push({ x: ypxl1, y: xpxl1, weight: rfPart(yend) * xgap })
            result.push({ x: ypxl1 + 1, y: xpxl1, weight: fPart(yend) * xgap })
        }
        else {
            result.push({ x: xpxl1, y: ypxl1, weight: rfPart(yend) * xgap })
            result.push({ x: xpxl1, y: ypxl1 + 1, weight: fPart(yend) * xgap })
        }

        var intery: number = yend + gradient;

        xend = Math.round(x1);
        yend = y1 + gradient * (xend - x1);
        xgap = fPart(x1 + 0.5);
        const xpxl2: number = xend;
        const ypxl2: number = Math.floor(yend);

        if (steep) {
            result.push({ x: ypxl2, y: xpxl2, weight: rfPart(yend) * xgap })
            result.push({ x: ypxl2 + 1, y: xpxl2, weight: fPart(yend) * xgap })
        }
        else {
            result.push({ x: xpxl2, y: ypxl2, weight: rfPart(yend) * xgap })
            result.push({ x: xpxl2, y: ypxl2 + 1, weight: fPart(yend) * xgap })
        }

        if (steep)
            for (let i = Math.floor(xpxl1) + 1; i <= xpxl2 - 1; i++) {
                result.push({ x: Math.floor(intery), y: i, weight: rfPart(intery) })
                result.push({ x: Math.floor(intery) + 1, y: i, weight: fPart(intery) })
                intery += gradient;
            }
        else
            for (let i = Math.floor(xpxl1) + 1; i <= xpxl2 - 1; i++) {
                result.push({ x: i, y: Math.floor(intery), weight: rfPart(intery) })
                result.push({ x: i, y: Math.floor(intery) + 1, weight: fPart(intery) })
                intery += gradient;
            }

        return result
    }

    export function evaluate(line: Array<WeightPoint>, data: number[][], target: number[][], factor: number, heatMap?: number[][]): PixelLineEvaluation {
        const getIndicator = (d: number, t: number, v: number) => t - d //Math.pow(t - d, 2) - Math.pow(t - v, 2)
        const getIndicator2 = (d: number, t: number, v: number, h: number) => (t - d) * h //Math.pow(t - d, 2) - Math.pow(t - v, 2)
        const result: number[] = line.map((p: WeightPoint) => Math.min(Math.max(data[p.x][p.y] + factor * p.weight, 0), 1))
        return {
            value: heatMap
                ? line.reduce((a: number, p: WeightPoint, index: number) => a + getIndicator2(data[p.x][p.y], target[p.x][p.y], result[index], heatMap[p.x][p.y]), 0)
                : line.reduce((a: number, p: WeightPoint, index: number) => a + getIndicator(data[p.x][p.y], target[p.x][p.y], result[index]), 0),
            apply: () => line.forEach((p: WeightPoint, index: number) => data[p.x][p.y] = result[index])
        }
    }
}