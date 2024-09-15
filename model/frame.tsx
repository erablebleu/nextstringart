export type Frame = {
    nailCount: number
    nailDiameter: number
}

export type CircleFrame = Frame & {
    nailCount: number
}

export type PolygonFrame = Frame & {
    edgeCount: number
    excludeVertex: boolean
    diameter: number
}

export const DefaultFrame = () => ({
    nailCount: 360,
    nailDiameter: 1.8,
    edgeCount: 6,
    excludeVertex: false,
    diameter: 600
})