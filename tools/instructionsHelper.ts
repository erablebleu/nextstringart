import { Instructions } from "@/model"
import { VectorHelper } from "./geometry"

export namespace InstructionsHelper {
    export function getTotalLength(instructions: Instructions): number {
        let l = 0
        let i0 = 0

        for (let step of instructions.steps) {
            const p0 = instructions.nails[i0].position
            const p1 = instructions.nails[step.nailIndex].position
            const v = VectorHelper.fromPoints(p0, p1)
            l += VectorHelper.len(v)

            i0 = step.nailIndex
        }

        return l
    }
}