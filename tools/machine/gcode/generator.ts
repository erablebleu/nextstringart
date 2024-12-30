

import { INail, IStep } from "@/model/instructions"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"
import { Polar, PolarPoint } from "@/tools/geometry/polar"
import { RotationDirection } from "@/enums/rotationDirection"
import { Cartesian, Line, Point, Vector } from "@/tools/geometry/cartesian"
import { EightKTwoTone } from "@mui/icons-material"

const StartGCode = [
    'G28', // Auto Home
    'G91', // Relative Positioning
]

const EndGCode = [
    'M400', // Finish Moves
]

const INNER_RING_MARGIN = 10
const OUTER_RING_MARGIN = 10

export class GCodeGenrator {
    private _machineSettings: MachineSettings
    private _referential: MachineReferential
    private _map: INail[]
    private _gcode: Array<string> = [...StartGCode]
    private _center: Point = { x: 0, y: 0 }
    private _innerRingX: number

    constructor(map: INail[], machineSettings: MachineSettings) {
        this._machineSettings = machineSettings
        this._map = map

        const polarPoints: Array<PolarPoint> = this._map.map((nail: INail, index) => Polar.fromCartesian(nail.position))

        this._referential = new MachineReferential(this._machineSettings, { a: polarPoints[0].a })

        this._innerRingX = Math.min(...polarPoints.map(p => p.r)) - INNER_RING_MARGIN
    }

    private getPreviousIndex(index: number): number {
        if (index == 0) return this._map.length - 1
        return index - 1
    }

    private getNextIndex(index: number): number {
        if (index == this._map.length - 1) return 0
        return index + 1
    }

    private getPreviousNail(index: number): Point {
        return this._map[this.getPreviousIndex(index)].position
    }

    private getNextNail(index: number): Point {
        return this._map[this.getNextIndex(index)].position
    }

    private moveToPolar(p: { r?: number, a?: number, z?: number }) {
        let move: string = ''

        console.log({
            where: 'moveToPolar',
            ...p,
        })

        if (p.a != undefined)
            move += ` X${this._referential.rotateZTo(p.a)}`

        if (p.r != undefined)
            move += ` Y${this._referential.translateXTo(p.r)}`

        if (p.z != undefined)
            move += ` Z${this._referential.translateZTo(p.z)}`

        if (move == '')
            return

        this._gcode.push(`G0${move}`)
    }

    private moveToCartesian(p: { x: number, y: number, z?: number }) {
        this.moveToPolar({
            ...Polar.fromCartesian(p),
            z: p.z,
        })
    }

    private buildLinearTrajectory(p0: Point, p1: Point, stepCount: number) {
        if (stepCount <= 0) throw Error('stepCount must be positive')

        const v: Vector = Cartesian.scaleVector(Cartesian.getVetor(p0, p1), 1 / stepCount)

        for (let i = 0; i < stepCount - 1; i++) {
            p0 = Cartesian.addVector(p0, v)
            this.moveToCartesian(p0)
        }

        this.moveToCartesian(p1)
    }

    private buildArc(c: Point, p0: Point, p1: Point, direction: RotationDirection, stepCount: number,) {
        if (stepCount <= 0) throw Error('stepCount must be positive')

        const p0_polar: PolarPoint = Polar.fromCartesian({
            x: p0.x - c.x,
            y: p0.y - c.y,
        })
        const p1_polar: PolarPoint = Polar.fromCartesian({
            x: p1.x - c.x,
            y: p1.y - c.y,
        })

        switch (direction) {
            case RotationDirection.AntiClockWise:
                while (p1_polar.a < p0_polar.a) p1_polar.a += 2 * Math.PI
                break
            case RotationDirection.ClockWise:
                while (p1_polar.a > p0_polar.a) p1_polar.a -= 2 * Math.PI
                break
        }

        const da = (p1_polar.a - p0_polar.a) / stepCount
        const dr = (p1_polar.r - p0_polar.r) / stepCount

        for (let i = 0; i < stepCount; i++) {
            p0_polar.a += da
            p0_polar.r += dr

            const p = Polar.toCartesian(p0_polar)

            this.moveToCartesian({
                x: c.x + p.x,
                y: c.y + p.y,
            })
        }
    }

    public addSteps(steps: IStep[]) {
        for (let step of steps) {
            const node: Point = this._map[step.nailIndex].position

            const entryTupleNode: Point = step.direction == RotationDirection.ClockWise ? this.getPreviousNail(step.nailIndex) : this.getNextNail(step.nailIndex)
            const exitTupleNode: Point = step.direction == RotationDirection.ClockWise ? this.getNextNail(step.nailIndex) : this.getPreviousNail(step.nailIndex)

            const entryPoint: Point = Cartesian.middleOf(entryTupleNode, node)
            const exitPoint: Point = Cartesian.middleOf(node, exitTupleNode)
            const entryPerp: Line = Cartesian.perpendicular(Cartesian.line(entryTupleNode, node), entryPoint)
            const exitPerp: Line = Cartesian.perpendicular(Cartesian.line(node, exitTupleNode), exitTupleNode)

            const p0 = Cartesian.getClosestPoint(Cartesian.getDistantPoints(entryPerp, entryPoint, 20), this._center)
            const p0_polar = Polar.fromCartesian(p0)

            const p1 = Cartesian.getClosestPoint(Cartesian.getDistantPoints(exitPerp, exitPoint, 20), this._center)
            const p1_polar = Polar.fromCartesian(p1)

            // todo: add metadata as comments            
            this.moveToPolar({ r: this._innerRingX })
            this.moveToPolar({ a: p0_polar.a })
            this.moveToPolar({ r: p0_polar.r })
            this.buildLinearTrajectory(p0, entryPoint, 20)
            this.buildArc(node, entryPoint, exitPoint, step.direction, 20)
            this.buildLinearTrajectory(exitPoint, p1, 20)
        }
    }

    public generate(): Array<string> {
        return [
            ...this._gcode,
            ...EndGCode,
        ]
    }
}