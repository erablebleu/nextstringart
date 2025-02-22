

import { Nail, Step, RotationDirection } from "@/model"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"
import { Polar, PolarPoint } from "@/tools/geometry/polar"
import { Cartesian, Point, PointHelper, Vector, VectorHelper } from "@/tools/geometry/cartesian"

export enum SpeedProfile {
    Slow,
    Fast,
}

const SpeedProfileCommands = new Map<SpeedProfile, number>([
    [SpeedProfile.Slow, 1200],
    [SpeedProfile.Fast, 12000], // mm/min == 200 mm/s
])


const LINEAR_TRAJECTORY_POINTS_PER_MM = 0.5

export abstract class GCodeGenerator {
    public static readonly CommentRegex = / *;.*/
    public static readonly MetadataRegex = / *;md\.(?<key>[^:]+):(?<value>.*)/

    public static readonly StartGCode = [
        //'M92 X16', // Set Axis Steps-per-unit
        //'M201 X200 Y200 Z100', // Print / Travel Move Limits | default values: { 200, 200, 100, 3000 } | mm / s²
        //'M203 X400 Y200 Z50', // Set Max Feedrate | default values: { 200, 200, 100, 25 } | mm / s

        'G28 Z', // Home Z first
        'G28 X Y', // Auto Home
        'G91', // Relative Positioning
    ]

    public static readonly EndGCode = [
        'M400', // Finish Moves
    ]

    protected machineSettings: MachineSettings
    protected referential: MachineReferential
    protected map: Nail[]
    protected gCode: Array<string> = [...GCodeGenerator.StartGCode]

    constructor(map: Nail[], machineSettings: MachineSettings, referential?: MachineReferential) {
        this.machineSettings = machineSettings
        this.map = map

        const polarPoints: Array<PolarPoint> = this.map.map((nail: Nail, index) => Polar.fromCartesian(nail.position))

        this.referential = referential ?? new MachineReferential(this.machineSettings, { rz: polarPoints[0].a })
    }

    protected getPreviousIndex(index: number): number {
        if (index == 0) return this.map.length - 1
        return index - 1
    }

    protected getNextIndex(index: number): number {
        if (index == this.map.length - 1) return 0
        return index + 1
    }

    protected getPreviousNail(index: number): Point {
        return this.map[this.getPreviousIndex(index)].position
    }

    protected getNextNail(index: number): Point {
        return this.map[this.getNextIndex(index)].position
    }

    protected moveToPolar(p: { r?: number, a?: number, z?: number }) {
        let move: string = ''

        if (p.a != undefined)
            move += ` X${this.referential.rotateZTo(p.a)}`

        if (p.r != undefined)
            move += ` Y${this.referential.translateXTo(p.r)}`

        if (p.z != undefined)
            move += ` Z${this.referential.translateZTo(p.z)}`

        if (move == '')
            return

        this.gCode.push(`G0${move}`)
    }

    protected moveToCartesian(p: { x: number, y: number, z?: number }) {
        this.moveToPolar(Polar.fromCartesian(p))
    }

    protected buildLinearTrajectory(p0: Point, p1: Point) {
        const v = VectorHelper.fromPoints(p0, p1)
        const len = VectorHelper.len(v)
        const stepCount = 1 + Math.floor(LINEAR_TRAJECTORY_POINTS_PER_MM * len)

        if (stepCount <= 0) throw Error('stepCount must be positive')

        const vStep: Vector = VectorHelper.scale(v, 1 / stepCount)

        for (let i = 0; i < stepCount - 1; i++) {
            p0 = PointHelper.add(p0, vStep)
            this.moveToCartesian(p0)
        }

        this.moveToCartesian(p1)
    }

    protected buildArc(c: Point, p0: Point, p1: Point, direction: RotationDirection, stepCount: number,) {
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

    protected displayMessage(message: string) {
        this.gCode.push(`M117 ${message}`)
    }

    protected addComment(message: string) {
        this.gCode.push(`;${message}`)
    }

    protected addMetadata(key: string, value: string) {
        this.addComment(`md.${key}:${value}`)
    }

    protected setSpeedProfile(profile: SpeedProfile) {
        this.gCode.push(`G0 F${SpeedProfileCommands.get(profile)}`)
    }

    protected pause(duration: number) {
        this.gCode.push(`G4 P${duration}`)
    }

    public generate(): Array<string> {
        return [
            ...this.gCode,
            ...GCodeGenerator.EndGCode,
        ]
    }
}