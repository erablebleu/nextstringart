export enum FrameShape {
    circle = 'circle',
    polygon = 'polygon',
}

export type Frame = {
    name?: string
    shape: FrameShape
    nailCount: number
    nailDiameter: number
}

export type CircleFrame = Frame & {
    nailCount: number
}

export type PolygonFrame = Frame & {
    edgeCount: number
    excludeVertex?: boolean
    diameter: number
}

export namespace FrameHelper {
    export function getDefault(): PolygonFrame {
        return {
            name: 'new frame',
            shape: FrameShape.polygon,
            nailCount: 360,
            nailDiameter: 1.8,
            edgeCount: 6,
            diameter: 600,
        }
    }
}