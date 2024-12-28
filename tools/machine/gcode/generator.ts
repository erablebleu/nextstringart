

import { IInstructions, INail } from "@/model/instructions"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"

type PolarPoint = {
    angle: number // rad
    radius: number // mm
}

export class GCodeGenrator {

    public static generate(instructions: IInstructions, machineSettings: MachineSettings): string[] {
        const result: Array<string> = [
            'G28',
            'G91', // relative positionning
        ]

        const points: Array<PolarPoint> = instructions.map.map((nail: INail) => ({
            angle: Math.atan2(nail.position.y, nail.position.x),
            radius: Math.sqrt(Math.pow(nail.position.x, 2) + Math.pow(nail.position.y, 2))
        }))
        
        const referential = new MachineReferential(machineSettings, { a: points[0].angle })

        const dIn = Math.min(...points.map(p => p.radius)) - 10

        const translateZ = (t_z: number) => {
            const m_z = referential.translateZ(t_z)
            result.push(`Z${m_z}`)
        }

        const translateX = (t_x: number) => {
            const m_x = referential.translateX(t_x)
            result.push(`Y${m_x}`)
        }

        const rotateZ = (t_a: number) => {
            const m_a = referential.rotateZ(t_a)
            result.push(`X${m_a}`)
        }


        for (let step of instructions.steps) {
            const p = points[step.nailIndex]

            const m_x = referential.translateX(p.radius)
            const m_a = referential.rotateZ(p.angle)

            result.push(`X${m_a} Y${m_x}`)
        }

        const reversed = instructions.steps.reverse()
        for (let step of reversed) {
            const p = points[step.nailIndex]

            const m_x = referential.translateX(p.radius)
            const m_a = referential.rotateZ(p.angle)

            result.push(`X${m_a} Y${m_x}`)
        }

        return result
    }
}