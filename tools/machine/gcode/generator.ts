

import { IInstructions, INail } from "@/model/instructions"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"
import { Polar, PolarPoint } from "@/tools/geometry/polar"

export class GCodeGenrator {

    public static generate(instructions: IInstructions, machineSettings: MachineSettings): string[] {
        const result: Array<string> = [
            'G28',
            'G91', // relative positionning
        ]

        const points: Array<PolarPoint> = instructions.map.map((nail: INail) => Polar.fromCardinal(nail.position))
        
        const referential = new MachineReferential(machineSettings, { a: points[0].a })

        const dIn = Math.min(...points.map(p => p.r)) - 10

        const translateZ = (t_z: number) => {
            const m_z = referential.translateZTo(t_z)
            result.push(`Z${m_z}`)
        }

        const translateX = (t_x: number) => {
            const m_x = referential.translateXTo(t_x)
            result.push(`Y${m_x}`)
        }

        const rotateZ = (t_a: number) => {
            const m_a = referential.rotateZTo(t_a)
            result.push(`X${m_a}`)
        }


        for (let step of instructions.steps) {
            const p = points[step.nailIndex]

            const m_x = referential.translateXTo(p.r)
            const m_a = referential.rotateZTo(p.a)

            result.push(`G0 X${m_a} Y${m_x}`)
        }

        return result
    }
}