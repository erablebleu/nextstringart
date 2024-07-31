import { RotationDirection } from "@/enums/rotationDirection"
import { IStep, IInstructions, INail } from "@/model/instructions"
import { IProject, Thread } from "@/model/project"
import { IPixelLine, IPixelLineEvaluation, PixelLine, PixelLineMode } from "@/tools/calculation/PixelLine"
import { ILine2D, Line2D } from "@/tools/geometry/Line2D"
import { IPoint2D } from "@/tools/geometry/Point2D"
import { CalculatorMessageType, ICalculatorInput, ICalculatorMessage, ICalculatorProgress } from "./workers"

interface ILineInfo extends ILine2D {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

function post(type: CalculatorMessageType, value: any) {
    const msg: ICalculatorMessage = {
        type,
        value
    }
    postMessage(msg)
}

function postProgress(data: ICalculatorProgress) {
    post(CalculatorMessageType.Progress, data)
}

function calculate(project: IProject, imageDatas: Array<Uint8ClampedArray>, threads: Array<boolean>): Array<IStep> {
    const nails: Array<INail> = project.nailMap.nails

    let minX: number | undefined,
        maxX: number | undefined,
        minY: number | undefined,
        maxY: number | undefined

    const updateMinMax = (p: IPoint2D) => {
        minX = Math.min(minX ?? p.x, p.x)
        maxX = Math.max(maxX ?? p.x, p.x)
        minY = Math.min(minY ?? p.y, p.y)
        maxY = Math.max(maxY ?? p.y, p.y)
    }

    const getLineInfo = (n0Idx: number, r0: RotationDirection, n1Idx: number, r1: RotationDirection): ILineInfo => {
        const line: ILine2D = Line2D.getTangeant(nails[n0Idx].position, nails[n0Idx].diameter, r0, nails[n1Idx].position, nails[n1Idx].diameter, r1)
        updateMinMax(line.p0)
        updateMinMax(line.p1)
        return { ...line, n0Idx, r0, n1Idx, r1 }
    }

    console.log(`worker: calculate tangeant lines`)
    const lines: ILineInfo[][][] = project.nailMap.lines.map((lines: number[], n0Idx: number) => [
        lines.map((n1Idx: number) => [
            getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.ClockWise),
            getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.AntiClockWise)
        ]).reduce((a: ILineInfo[], b: ILineInfo[]) => a.concat(b), []),
        lines.map((n1Idx: number) => [
            getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.ClockWise),
            getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.AntiClockWise)
        ]).reduce((a: ILineInfo[], b: ILineInfo[]) => a.concat(b), []),
    ])

    minX = (minX! - project.nailMap.position.x) / project.nailMap.scale
    maxX = (maxX! - project.nailMap.position.x) / project.nailMap.scale
    minY = (minY! - project.nailMap.position.y) / project.nailMap.scale
    maxY = (maxY! - project.nailMap.position.y) / project.nailMap.scale

    console.log(`worker: calculate pixel lines`)
    /*
    // RAM explode here
    const pixelLines = lines.map((a0: ILineInfo[][][]) =>
        a0.map((a1: ILineInfo[][]) => 
            a1.map((a2: ILineInfo[]) =>
                a2.map((l: ILineInfo) => ({
                    line: l,
                    pixelLine: PixelLine.get({
                        x: (l.p0.x - project.nailMap.position.x) / project.nailMap.scale - minX!,
                        y: (l.p0.y - project.nailMap.position.y) / project.nailMap.scale - minY!,
                    }, {
                        x: (l.p1.x - project.nailMap.position.x) / project.nailMap.scale - minX!,
                        y: (l.p1.y - project.nailMap.position.y) / project.nailMap.scale - minY!,
                    }, PixelLineMode.Bresenham)
                })))
            ))*/

    // console.log(pixelLines)    

    var result: Array<IStep> = []

    for (let i = 0; i < project.threads.length; i++) {
        const thread: Thread = project.threads[i]
        const imageData: Uint8ClampedArray = imageDatas[i]
        let stepCount: number = 0


        if (i < threads.length && !threads[i]) {
            console.log(`worker: thread "${thread.description}" ignored`)
            continue
        }

        console.log(`worker: thread "${thread.description}" calculate target`)
        const target: number[][] = Array
            .from(Array(Math.floor(maxX! - minX! + 4)).keys())
            .map((x: number) =>
                Array.from(Array(Math.floor(maxY! - minY! + 4)).keys())
                    .map((y: number) => {
                        const ix = Math.floor(minX! + x)
                        const iy = Math.floor(minY! + y)
                        if (ix < 0 || ix >= thread.imageInfo.width) return 0
                        if (iy < 0 || iy >= thread.imageInfo.height) return 0
                        const idx: number = 4 * (iy * thread.imageInfo.width + ix)
                        return 1 - (imageData[idx] + imageData[idx + 1] + imageData[idx + 2]) / 3 / 255
                    }))
        const data: number[][] = target.map((l: number[]) => l.map((v: number) => { return 0 }))

        var nail: IStep | undefined = {
            nailIndex: 0,
            direction: RotationDirection.ClockWise
        }

        console.log(`worker: thread "${thread.description}" search path`)
        var start = new Date()
        do {
            let nextNail: IStep | undefined
            let evaluation: IPixelLineEvaluation | undefined
            let indicator: number = 0

            for (const l of lines[nail!.nailIndex][nail!.direction]) {
                const pixelLine: IPixelLine = PixelLine.get({
                    x: (l.p0.x - project.nailMap.position.x) / project.nailMap.scale - minX! + 2,
                    y: (l.p0.y - project.nailMap.position.y) / project.nailMap.scale - minY! + 2,
                }, {
                    x: (l.p1.x - project.nailMap.position.x) / project.nailMap.scale - minX! + 2,
                    y: (l.p1.y - project.nailMap.position.y) / project.nailMap.scale - minY! + 2,
                }, PixelLineMode.Bresenham)

                const e: IPixelLineEvaluation = pixelLine.evaluate(data, target, thread.calculationThickness)

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
                stepCount++
            }

            const end = new Date()
            if (end.valueOf() - start.valueOf() > 500) {
                postProgress({
                    stepIndex: stepCount,
                    threadIndex: i
                })
                start = end
            }

            nail = nextNail
        }
        while (nail && stepCount < thread.maxStep)

        postProgress({
            stepIndex: stepCount,
            threadIndex: i
        })
    }

    return result
}

self.onmessage = async (event: MessageEvent<ICalculatorInput>) => {
    console.log('🐝 Worker: Message received from main script')
    const data = event.data
    const result = calculate(data.project, data.imageDatas, data.threads)
    console.log('🐝 Worker: end', result)
    post(CalculatorMessageType.Result, result)
}

export { }