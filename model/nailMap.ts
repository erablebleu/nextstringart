import { CircleFrame, Frame, FrameShape, PolygonFrame } from "./frame"
import { Point, PointHelper, Vector, VectorHelper } from "@/tools/geometry"
import { Nail } from "@/model"

export type NailMapTransformation = {
    scale: number
    angle: number
    position: Point
}

export type NailMap = {
    nails: Nail[]
    lines: number[][] // by nails index
}

export namespace NailMapHelper {
    export function getLine(p0: Point, p1: Point, count: number, excludeVertex?: boolean): Point[] {
        const result: Point[] = []
        const v: Vector = VectorHelper.scale(VectorHelper.fromPoints(p0, p1), 1 / count)
        let p: Point = p0

        if (excludeVertex)
            p = PointHelper.add(p0, VectorHelper.scale(v, 1 / 2))

        for (let i = 0; i < count; i++) {
            result.push(p)
            p = PointHelper.add(p, v)
        }

        return result
    }

    export function get(frame: Frame | PolygonFrame | CircleFrame): NailMap {
        switch (frame.shape) {
            case FrameShape.circle: return fromCircle(frame as CircleFrame)
            case FrameShape.polygon: return fromPolygon(frame as PolygonFrame)
        }

        throw new Error('frame shape not supported')
    }

    export function fromPolygon(polygon: PolygonFrame): NailMap {
        const result: NailMap = {
            nails: [],
            lines: [],
        }
        const radius = polygon.diameter / 2
        const totalCount: number = polygon.nailCount
        const edgeNailCount: number = Math.floor(polygon.nailCount / polygon.edgeCount)
        const center = { x: 0, y: 0 }
        const a0 = Math.PI

        for (let i = 0; i < polygon.edgeCount; i++) {
            const t0: number = a0 + 2 * Math.PI * i / polygon.edgeCount
            const t1: number = t0 + 2 * Math.PI / polygon.edgeCount
            const p0: Point = { x: center.x + radius * Math.sin(t0), y: center.y + radius * Math.cos(t0) }
            const p1: Point = { x: center.x + radius * Math.sin(t1), y: center.y + radius * Math.cos(t1) }

            result.nails.push(...NailMapHelper.getLine(p0, p1, edgeNailCount, polygon.excludeVertex).map((p: Point) => ({
                diameter: polygon.nailDiameter,
                position: p
            })))
            const lines: number[] = Array.apply(0, Array((polygon.edgeCount - 1) * edgeNailCount - 1)).map((v, index: number) => (1 + (i + 1) * edgeNailCount + index) % totalCount)
            result.lines.push(lines.slice(0, (polygon.edgeCount - 2) * edgeNailCount - 1))
            result.lines.push(...Array.apply(0, Array(edgeNailCount - 1)).map(v => lines))
        }

        return result
    }

    export function fromCircle(polygon: CircleFrame): NailMap {
        const result: NailMap = {
            nails: [],
            lines: [],
        }

        return result
    }
}