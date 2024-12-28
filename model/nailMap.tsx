import { IPoint2D, Point2D } from "@/tools/geometry/Point2D"
import { INail } from "./instructions"
import { IVector2D, Vector2D } from "@/tools/geometry/Vector2D"
import { Frame, PolygonFrame } from "./frame"

export class NailMap {
    public scale: number = 1
    public angle: number = 0
    public position: IPoint2D = { x: 0, y: 0 }
    public nails: INail[] = []
    public lines: number[][] = [] // by nails index

    private static getLine(p0: IPoint2D, p1: IPoint2D, count: number, excludeVertex: boolean): IPoint2D[] {
        const result: IPoint2D[] = []
        const v: IVector2D = Vector2D.scale(Point2D.substract(p1, p0), 1 / count)
        let p: IPoint2D = p0

        if (excludeVertex)
            p = Point2D.add(p0, Vector2D.scale(v, 1 / 2))

        for (let i = 0; i < count; i++) {
            result.push(p)
            p = Point2D.add(p, v)
        }

        return result
    }

    public static get(frame: Frame): NailMap {
        return NailMap.fromPolygon(frame as PolygonFrame)
    }

    public static fromPolygon(polygon: PolygonFrame): NailMap {
        const result = new NailMap
        const radius = polygon.diameter / 2
        const totalCount: number = polygon.nailCount
        const edgeNailCount: number = Math.floor(polygon.nailCount / polygon.edgeCount)
        const center = { x: 0, y: 0 }

        for (let i = 0; i < polygon.edgeCount; i++) {
            const t0: number = 2 * Math.PI * i / polygon.edgeCount
            const t1: number = t0 + 2 * Math.PI / polygon.edgeCount
            const p0: IPoint2D = { x: center.x + radius * Math.sin(t0), y: center.y + radius * Math.cos(t0) }
            const p1: IPoint2D = { x: center.x + radius * Math.sin(t1), y: center.y + radius * Math.cos(t1) }
            
            result.nails.push(...NailMap.getLine(p0, p1, edgeNailCount, polygon.excludeVertex).map((p: IPoint2D) => ({
                diameter: polygon.nailDiameter,
                position: p
            })))
            const lines: number[] = Array.apply(0, Array((polygon.edgeCount - 1) * edgeNailCount - 1)).map((v, index: number) => (1 + (i + 1) * edgeNailCount + index) % totalCount)
            result.lines.push(lines.slice(0, (polygon.edgeCount - 2) * edgeNailCount - 1))
            result.lines.push(...Array.apply(0, Array(edgeNailCount - 1)).map(v => lines))
        }

        return result
    }

    public static fromCircle(polygon: PolygonFrame): NailMap {
        const result = new NailMap


        return result
    }
}