

import { INail, IStep } from "@/model/instructions"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"
import { Polar, PolarPoint } from "@/tools/geometry/polar"
import { RotationDirection } from "@/enums/rotationDirection"
import { Cartesian, Point, Vector } from "@/tools/geometry/cartesian"

enum SpeedProfile {
    Slow,
    Fast,
}

const SpeedProfileCommands = new Map<SpeedProfile, number>([
    [SpeedProfile.Slow, 1200],
    [SpeedProfile.Fast, 12000], // mm/min == 200 mm/s
])

const StartGCode = [
    //'M92 X16', // Set Axis Steps-per-unit
    //'M201 X200 Y200 Z100', // Print / Travel Move Limits | default values: { 200, 200, 100, 3000 } | mm / s²
    //'M203 X400 Y200 Z50', // Set Max Feedrate | default values: { 200, 200, 100, 25 } | mm / s

    'G28 Z', // Home Z first
    'G28 X Y', // Auto Home
    'G91', // Relative Positioning
]

const EndGCode = [
    'M400', // Finish Moves
]

const INNER_RING_MARGIN = 100
const LINEAR_TRAJECTORY_LENGTH = 10
const LINEAR_TRAJECTORY_STEP_COUNT = 20
const ARC_TRAJCTORY_STEP_COUNT = 20

export type GCodeSettings = {
    zLow: number
    zHigh: number
}

export class GCodeGenrator {
    private _machineSettings: MachineSettings
    private _gCodeSettings: GCodeSettings
    private _referential: MachineReferential
    private _map: INail[]
    private _gCode: Array<string> = [...StartGCode]
    private _center: Point = { x: 0, y: 0 }
    private _innerRingX: number

    constructor(map: INail[], machineSettings: MachineSettings, gCodeSettings: GCodeSettings) {
        this._machineSettings = machineSettings
        this._gCodeSettings = gCodeSettings
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

        if (p.a != undefined)
            move += ` X${this._referential.rotateZTo(p.a)}`

        if (p.r != undefined)
            move += ` Y${this._referential.translateXTo(p.r)}`

        if (p.z != undefined)
            move += ` Z${this._referential.translateZTo(p.z)}`

        if (move == '')
            return

        this._gCode.push(`G0${move}`)
    }

    private moveToCartesian(p: { x: number, y: number, z?: number }) {
        this.moveToPolar(Polar.fromCartesian(p))
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

    private displayMessage(message: string) {
        this._gCode.push(`M117 ${message}`)
    }

    private addComment(message: string) {
        this._gCode.push(`;${message}`)
    }

    private setSpeedProfile(profile: SpeedProfile) {
        this._gCode.push(`G0 F${SpeedProfileCommands.get(profile)}`)
    }

    public addSteps(steps: IStep[]) {
        for(let i = 0; i < steps.length; i++) {
            const step: IStep = steps[i]
            const node: Point = this._map[step.nailIndex].position

            const entryTupleNode: Point = step.direction == RotationDirection.ClockWise ? this.getPreviousNail(step.nailIndex) : this.getNextNail(step.nailIndex)
            const exitTupleNode: Point = step.direction == RotationDirection.ClockWise ? this.getNextNail(step.nailIndex) : this.getPreviousNail(step.nailIndex)

            const entry_d: number = Cartesian.distance(entryTupleNode, node) / 2
            const entry_d0 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(30, 2))
            const entry_d1 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_d2 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_p0 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d0), this._center)
            const entry_p1 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d1), this._center)
            const entry_p2 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d2), this._center)
            const entry_p0_polar = Polar.fromCartesian(entry_p0)

            const exit_d: number = Cartesian.distance(node, exitTupleNode) / 2
            const exit_d0 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(10, 2))
            const exit_d1 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(10, 2))
            const exit_d2 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(30, 2))
            const exit_p0 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d0), this._center)
            const exit_p1 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d1), this._center)
            const exit_p2 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d2), this._center)

            // z move
            entry_p0.z = this._gCodeSettings.zHigh
            entry_p1.z = this._gCodeSettings.zLow
            entry_p2.z = this._gCodeSettings.zLow

            exit_p0.z = this._gCodeSettings.zLow
            exit_p1.z = this._gCodeSettings.zLow
            exit_p2.z = this._gCodeSettings.zHigh

            this.displayMessage(`step ${i + 1}/${steps.length}`)
            this.addComment(`md_step=${i + 1}/${steps.length}`)
            this.setSpeedProfile(SpeedProfile.Fast)
            this.moveToPolar({ r: this._innerRingX })
            this.moveToPolar({ a: entry_p0_polar.a })
            this.moveToPolar({ r: entry_p0_polar.r })
            this.setSpeedProfile(SpeedProfile.Slow)
            this.buildLinearTrajectory(entry_p0, entry_p1, 20)
            this.buildLinearTrajectory(entry_p1, entry_p2, 20)
            this.moveToCartesian(exit_p0)
            this.buildLinearTrajectory(exit_p0, exit_p1, 20)
            this.buildLinearTrajectory(exit_p1, exit_p2, 20)
        }

        this.setSpeedProfile(SpeedProfile.Fast)
        this.moveToPolar({ r: this._innerRingX })
    }

    public generate(): Array<string> {
        return [
            ...this._gCode,
            ...EndGCode,
        ]
    }
}