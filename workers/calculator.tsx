import { Project, Thread, Step, Instructions, Nail, RotationDirection, NailMap } from "@/model"
import { PixelLine, PixelLineEvaluation, PixelLineMode } from "@/tools/calculation/PixelLine"
import { Point, Line, LineHelper } from "@/tools/geometry"
import { CalculatorMessageType, CalculatorInput, CalculatorMessage, CalculatorProgress } from "./workers"

type LineInfo = Line & {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

function post(type: CalculatorMessageType, value: any) {
    const msg: CalculatorMessage = {
        type,
        value
    }
    postMessage(msg)
}

function postProgress(data: CalculatorProgress) {
    post(CalculatorMessageType.Progress, data)
}

function calculate({project, nailMap, imageDatas, threads} : CalculatorInput): Array<Step> {
    const nails: Array<Nail> = nailMap.nails

    let minX: number | undefined,
        maxX: number | undefined,
        minY: number | undefined,
        maxY: number | undefined

    const updateMinMax = (p: Point) => {
        minX = Math.min(minX ?? p.x, p.x)
        maxX = Math.max(maxX ?? p.x, p.x)
        minY = Math.min(minY ?? p.y, p.y)
        maxY = Math.max(maxY ?? p.y, p.y)
    }

    const getLineInfo = (n0Idx: number, r0: RotationDirection, n1Idx: number, r1: RotationDirection): LineInfo => {
        const line: Line = LineHelper.getTangeant(nails[n0Idx].position, nails[n0Idx].diameter, r0, nails[n1Idx].position, nails[n1Idx].diameter, r1)
        updateMinMax(line.p0)
        updateMinMax(line.p1)
        return { ...line, n0Idx, r0, n1Idx, r1 }
    }

    console.log(`worker: calculate tangeant lines`)
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

    minX = (minX! - project.nailMapTransformation.position.x) / project.nailMapTransformation.scale
    maxX = (maxX! - project.nailMapTransformation.position.x) / project.nailMapTransformation.scale
    minY = (minY! - project.nailMapTransformation.position.y) / project.nailMapTransformation.scale
    maxY = (maxY! - project.nailMapTransformation.position.y) / project.nailMapTransformation.scale

    console.log(`worker: calculate pixel lines`)
    /*
    // RAM explode here
    const pixelLines = lines.map((a0: LineInfo[][][]) =>
        a0.map((a1: LineInfo[][]) => 
            a1.map((a2: LineInfo[]) =>
                a2.map((l: LineInfo) => ({
                    line: l,
                    pixelLine: PixelLine.get({
                        x: (l.p0.x - nailMap.position.x) / nailMap.scale - minX!,
                        y: (l.p0.y - nailMap.position.y) / nailMap.scale - minY!,
                    }, {
                        x: (l.p1.x - nailMap.position.x) / nailMap.scale - minX!,
                        y: (l.p1.y - nailMap.position.y) / nailMap.scale - minY!,
                    }, PixelLineMode.Bresenham)
                })))
            ))*/

    // console.log(pixelLines)    

    var result: Array<Step> = []

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

        var nail: Step | undefined = {
            nailIndex: 0,
            direction: RotationDirection.ClockWise
        }

        console.log(`worker: thread "${thread.description}" search path`)
        var start = new Date()
        do {
            let nextNail: Step | undefined
            let evaluation: PixelLineEvaluation | undefined
            let indicator: number = 0

            for (const l of lines[nail!.nailIndex][nail!.direction]) {
                const pixelLine: PixelLine = PixelLine.get({
                    x: (l.p0.x - project.nailMapTransformation.position.x) / project.nailMapTransformation.scale - minX! + 2,
                    y: (l.p0.y - project.nailMapTransformation.position.y) / project.nailMapTransformation.scale - minY! + 2,
                }, {
                    x: (l.p1.x - project.nailMapTransformation.position.x) / project.nailMapTransformation.scale - minX! + 2,
                    y: (l.p1.y - project.nailMapTransformation.position.y) / project.nailMapTransformation.scale - minY! + 2,
                }, PixelLineMode.Bresenham)

                const e: PixelLineEvaluation = pixelLine.evaluate(data, target, thread.calculationThickness)

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

self.onmessage = async (event: MessageEvent<CalculatorInput>) => {
    console.log('🐝 Worker: Message received from main script')
    const data = event.data
    const result = calculate(data)
    console.log('🐝 Worker: end', result)
    post(CalculatorMessageType.Result, result)
}

export { }