import { Instructions, Nail, NailMap, Project, ProjectSettings, RotationDirection, Step } from "@/model"
import { Line } from "@/tools/geometry"
import { ImageInfo } from "@/tools/imaging/jimpHelper"

export type CalculationWorkerInfo = {
    threadIndex: number
    threadCount: number
    stepIndex: number
    stepCount: number
}

export type CalculationWokerMessage = {
    info?: CalculationWorkerInfo
    result?: Instructions
}

export type CalculationWorkerStartData = {
    project: Project
    projectSettings: ProjectSettings
    nailMap: NailMap
    imageDatas: Array<ImageInfo | null>,
    heatMapDatas: Array<ImageInfo | null>,
}

export type LineInfo = Line & {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

export function buildContinuity(nails: Nail[], lines: Array<LineInfo>): Array<Step> {
    const result: Array<Step> = []
    lines = [...lines]

    function getNailsDistance(n0Index: number, n1Index: number): number {
        return Math.min(
            Math.abs(n0Index - n1Index),
            nails.length - Math.abs(n0Index - n1Index),
        )
    }

    function getIndicator(n0: Step, n1: Step): number {
        return 2 * getNailsDistance(n0.nailIndex, n1.nailIndex)
            + (n0.direction == n1.direction ? 0 : 1)
    }

    function reverseRotation(rotation: RotationDirection): RotationDirection {
        return rotation == RotationDirection.ClockWise ? RotationDirection.AntiClockWise : RotationDirection.ClockWise
    }

    let nail: Step = {
        nailIndex: 0,
        direction: RotationDirection.AntiClockWise,
    }

    while (lines.length > 0) {
        let indicator: number | undefined
        let srcNail: Step | undefined
        let dstNail: Step | undefined
        let lineIndex: number | undefined

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const n0: Step = { nailIndex: line.n0Idx, direction: line.r0 }
            const n1: Step = { nailIndex: line.n1Idx, direction: reverseRotation(line.r1) }
            const i0 = getIndicator(nail, n0)
            const i1 = getIndicator(nail, n1)

            if (!indicator || i0 < indicator) {
                indicator = i0
                srcNail =  n0
                dstNail = { nailIndex: line.n1Idx, direction: line.r1 }
                lineIndex = i
            }

            if (!indicator || i1 < indicator) {
                indicator = i1
                srcNail =  n1
                dstNail = { nailIndex: line.n0Idx, direction: reverseRotation(line.r0) }
                lineIndex = i
            }
        }

        if (dstNail === undefined
            || srcNail === undefined
            || lineIndex === undefined
        )
            break

        if(nail.nailIndex != srcNail.nailIndex)
            result.push(srcNail)

        nail = dstNail
        result.push(dstNail)
        lines.splice(lineIndex, 1)
    }

    return result
}