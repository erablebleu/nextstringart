

import { Nail, Step, RotationDirection } from "@/model"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"
import { Polar, PolarPoint } from "@/tools/geometry/polar"
import { Cartesian, Point } from "@/tools/geometry/cartesian"
import { GCodeGenerator, SpeedProfile } from "./generator"

export type WiringGCodeSettings = {
    zMove: number
    zLow: number
    zHigh: number
}

const INNER_RING_MARGIN = 100

export class WiringGCodeGenerator extends GCodeGenerator {
    private _center: Point = { x: 0, y: 0 }
    private _innerRingX: number
    private _gCodeSettings: WiringGCodeSettings

    constructor(map: Nail[], machineSettings: MachineSettings, gCodeSettings: WiringGCodeSettings, referential?: MachineReferential) {
        super(map, machineSettings, referential)

        this._gCodeSettings = gCodeSettings
        const polarPoints: Array<PolarPoint> = this.map.map((nail: Nail, index) => Polar.fromCartesian(nail.position))

        this._innerRingX = Math.min(...polarPoints.map(p => p.r)) - INNER_RING_MARGIN
    }

    public addSteps(steps: Step[]) {
        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX })
        super.displayMessage(`waiting start command`)
        super.addMetadata('command', 'pause')

        for (let i = 0; i < steps.length; i++) {
            const step: Step = steps[i]
            const node: Point = this.map[step.nailIndex].position

            const entryTupleNode: Point = step.direction == RotationDirection.ClockWise ? super.getNextNail(step.nailIndex) : super.getPreviousNail(step.nailIndex)
            const exitTupleNode: Point = step.direction == RotationDirection.ClockWise ? super.getPreviousNail(step.nailIndex) : super.getNextNail(step.nailIndex)

            const entry_d: number = Cartesian.distance(entryTupleNode, node) / 2
            const entry_d0 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_d1 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_p0 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d0), this._center)
            const entry_p1 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d1), this._center)
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
            entry_p1.z = this._gCodeSettings.zHigh

            exit_p0.z = this._gCodeSettings.zLow
            exit_p1.z = this._gCodeSettings.zLow
            exit_p2.z = this._gCodeSettings.zMove

            super.displayMessage(`step ${i + 1}/${steps.length}`)
            super.addMetadata('step', `${i + 1}/${steps.length}`)
            super.addMetadata('target_nail', `${step.nailIndex}`)
            super.setSpeedProfile(SpeedProfile.Fast)
            super.moveToPolar({ r: this._innerRingX })
            super.moveToPolar({ a: entry_p0_polar.a })
            super.moveToPolar({ r: entry_p0_polar.r })
            super.setSpeedProfile(SpeedProfile.Slow)
            super.moveToPolar({ z: this._gCodeSettings.zHigh })
            super.buildLinearTrajectory(entry_p0, entry_p1)
            super.moveToCartesian(exit_p0)
            super.buildLinearTrajectory(exit_p0, exit_p1)
            super.buildLinearTrajectory(exit_p1, exit_p2)
        }

        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX })
    }

    public addFlatSteps(steps: Step[]) {
        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX, z: this._gCodeSettings.zHigh })
        super.displayMessage(`waiting start command`)
        super.addMetadata('command', 'pause')

        for (let i = 2273; i < steps.length; i++) {
            const step: Step = steps[i]
            const node: Point = this.map[step.nailIndex].position

            const entryTupleNode: Point = step.direction == RotationDirection.ClockWise ? super.getNextNail(step.nailIndex) : super.getPreviousNail(step.nailIndex)
            const exitTupleNode: Point = step.direction == RotationDirection.ClockWise ? super.getPreviousNail(step.nailIndex) : super.getNextNail(step.nailIndex)

            const entry_d: number = Cartesian.distance(entryTupleNode, node) / 2
            const entry_d0 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_d1 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(15, 2))
            const entry_p0 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d0), this._center)
            const entry_p1 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d1), this._center)
            const entry_p0_polar = Polar.fromCartesian(entry_p0)

            const exit_d: number = Cartesian.distance(node, exitTupleNode) / 2
            const exit_d0 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(15, 2))
            const exit_d1 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(10, 2))
            const exit_p0 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d0), this._center)
            const exit_p1 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d1), this._center)

            super.displayMessage(`step ${i + 1} nail ${step.nailIndex} ${step.direction == RotationDirection.ClockWise ? 'c' : 'a'}`)
            super.addMetadata('step', `${i + 1}/${steps.length}`)
            super.addMetadata('target_nail', `${step.nailIndex}`)
            super.setSpeedProfile(SpeedProfile.Fast)
            super.moveToPolar({ r: this._innerRingX })
            super.moveToPolar({ a: entry_p0_polar.a })
            super.moveToPolar({ r: entry_p0_polar.r })
            super.setSpeedProfile(SpeedProfile.Slow)
            super.buildLinearTrajectory(entry_p0, entry_p1)
            super.moveToCartesian(exit_p0)
            super.buildLinearTrajectory(exit_p0, exit_p1)
        }

        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX })
    }

    public testNails(steps: Step[]) {
        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX, z: this._gCodeSettings.zHigh })
        super.displayMessage(`waiting start command`)
        super.addMetadata('command', 'pause')

        for (let i = 1; i < this.map.length; i+=2) {
            const node: Point = this.map[i].position

            const entryTupleNode: Point = super.getPreviousNail(i)
            const exitTupleNode: Point = super.getNextNail(i)

            const entry_d: number = Cartesian.distance(entryTupleNode, node) / 2
            const entry_d0 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(10, 2))
            const entry_d1 = Math.sqrt(Math.pow(entry_d, 2) + Math.pow(15, 2))
            const entry_p0 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d0), this._center)
            const entry_p1 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(entryTupleNode, node, entry_d1), this._center)
            const entry_p0_polar = Polar.fromCartesian(entry_p0)

            const exit_d: number = Cartesian.distance(node, exitTupleNode) / 2
            const exit_d0 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(15, 2))
            const exit_d1 = Math.sqrt(Math.pow(exit_d, 2) + Math.pow(10, 2))
            const exit_p0 = Cartesian.getFurthestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d0), this._center)
            const exit_p1 = Cartesian.getClosestPoint(Cartesian.getEquidistantPoints(node, exitTupleNode, exit_d1), this._center)

            super.setSpeedProfile(SpeedProfile.Fast)
            super.moveToPolar({ a: entry_p0_polar.a })
            super.moveToPolar({ r: entry_p0_polar.r })
            super.setSpeedProfile(SpeedProfile.Slow)
            super.buildLinearTrajectory(entry_p0, entry_p1)
            super.moveToCartesian(exit_p0)
            super.buildLinearTrajectory(exit_p0, exit_p1)
        }

        super.setSpeedProfile(SpeedProfile.Fast)
        super.moveToPolar({ r: this._innerRingX })
    }
}