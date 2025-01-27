import { Instructions, Nail, ProjectSettings, RotationDirection, Step, Thread } from "@/model"
import { Line, LineHelper, Point } from "@/tools/geometry"
import { parentPort } from "worker_threads"
import { CalculationWokerMessage, CalculationWorkerInfo, CalculationWorkerStartData } from "./calculationWorker"
import { PixelLineEvaluation, PixelLineHelper, PixelLineMode, WeightPoint } from "../pixelLine"
import { ImageInfo } from "@/tools/imaging/jimpHelper"

type LineInfo = Line & {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

export function delta({ nailMap, imageDatas, projectSettings }: CalculationWorkerStartData): Instructions {
    const project: ProjectSettings = projectSettings
    const nails: Array<Nail> = nailMap.nails
    const info: CalculationWorkerInfo = {
        threadIndex: 0,
        threadCount: project.threads.length,
        stepIndex: 0,
        stepCount: 1
    }

    let startTime: DOMHighResTimeStamp,
        endTime: DOMHighResTimeStamp

    const result: Array<Step> = []

    startTime = performance.now()

    for (info.threadIndex = 0; info.threadIndex < project.threads.length; info.threadIndex++) {
        const thread: Thread = project.threads[info.threadIndex]
        const imageInfo: ImageInfo = imageDatas[info.threadIndex]
        const imageData: Uint8Array = imageInfo.data
        info.stepCount = thread.maxStep
        info.stepIndex = 0

        let minX: number | undefined,
            maxX: number | undefined,
            minY: number | undefined,
            maxY: number | undefined

        function getX(x: number): number {
            return (x! - thread.imageTransformation.position.x) / thread.imageTransformation.scale
        }

        function getY(y: number): number {
            return (y! - thread.imageTransformation.position.y) / thread.imageTransformation.scale
        }

        function updateMinMax(p: Point) {
            minX = Math.min(minX ?? p.x, p.x)
            maxX = Math.max(maxX ?? p.x, p.x)
            minY = Math.min(minY ?? p.y, p.y)
            maxY = Math.max(maxY ?? p.y, p.y)
        }

        function getLineInfo(n0Idx: number, r0: RotationDirection, n1Idx: number, r1: RotationDirection): LineInfo {
            const line: Line = LineHelper.getTangeant(nails[n0Idx].position, nails[n0Idx].diameter, r0, nails[n1Idx].position, nails[n1Idx].diameter, r1)
            updateMinMax(line.p0)
            updateMinMax(line.p1)
            return { ...line, n0Idx, r0, n1Idx, r1 }
        }

        log(`calculate tangeant lines`)
        const lines: LineInfo[][][] = nailMap.lines.map((lines: number[], n0Idx: number) => [
            lines.map((n1Idx: number) => [
                getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.ClockWise),
                getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.AntiClockWise)
            ]).reduce((a: LineInfo[], b: LineInfo[]) => a.concat(b), []),
            lines.map((n1Idx: number) => [
                getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.ClockWise),
                getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.AntiClockWise)
            ]).reduce((a: LineInfo[], b: LineInfo[]) => a.concat(b), []),
        ])

        minX = getX(minX!)
        maxX = getX(maxX!)
        minY = getY(minY!)
        maxY = getY(maxY!)

        log(`calculate pixel lines`)

        log(`thread "${thread.description}" calculate target`)
        const target: number[][] = Array
            .from(Array(Math.floor(maxX! - minX! + 4)).keys())
            .map((x: number) =>
                Array.from(Array(Math.floor(maxY! - minY! + 4)).keys())
                    .map((y: number) => {
                        const ix = Math.floor(minX! + x)
                        const iy = Math.floor(minY! + y)
                        if (ix < 0 || ix >= imageInfo.width) return 0
                        if (iy < 0 || iy >= imageInfo.height) return 0
                        const idx: number = 4 * (iy * imageInfo.width + ix)
                        return 1 - (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3 / 255
                    }))
        const data: number[][] = target.map((l: number[]) => l.map((v: number) => { return 0 }))

        var nail: Step | undefined = {
            nailIndex: 0,
            direction: RotationDirection.ClockWise
        }

        log(`thread "${thread.description}" search path`)

        do {
            let nextNail: Step | undefined
            let evaluation: PixelLineEvaluation | undefined
            let indicator: number = 0

            for (const l of lines[nail!.nailIndex][nail!.direction]) {
                const pixelLine: Array<WeightPoint> = PixelLineHelper.get({
                    x: getX(l.p0.x) - minX! + 2,
                    y: getY(l.p0.y) - minY! + 2,
                }, {
                    x: getX(l.p1.x) - minX! + 2,
                    y: getY(l.p1.y) - minY! + 2,
                }, PixelLineMode.Bresenham)

                const e: PixelLineEvaluation = PixelLineHelper.evaluate(pixelLine, data, target, thread.calculationThickness)

                if (e.value <= indicator)
                    continue

                indicator = e.value
                evaluation = e
                nextNail = {
                    nailIndex: l.n1Idx,
                    direction: l.r1
                }
            }

            if (nextNail) {
                evaluation?.apply()
                result.push(nextNail)
                info.stepIndex++
            }

            // update progress
            endTime = performance.now()
            const timeDiff = endTime - startTime
            if (timeDiff > 200) {
                startTime = endTime
                post({ info })
            }

            nail = nextNail
        }
        while (nail && info.stepIndex < info.stepCount)
    }

    return {
        nails: nails,
        steps: result,
    }
}

parentPort?.on('message', (data: CalculationWorkerStartData) => {
    log('start')
    const result = delta(data)
    post({ result })
})

function post(message: CalculationWokerMessage) {
    parentPort?.postMessage(message)
}

function log(message: string | any) {
    if (typeof message !== 'string' && !(message instanceof String))
        message = JSON.stringify(message)

    console.log(`[deltaCalculation.worker] ${message}`)
}