import { Instructions, Nail, ProjectSettings, RotationDirection, Step, Thread } from "@/model"
import { CalculationWokerMessage, CalculationWorkerInfo, CalculationWorkerStartData } from "./calculationWorker"
import { Line, LineHelper, Point } from "@/tools/geometry"
import { parentPort } from "worker_threads"
import { PixelLineHelper, PixelLineMode, WeightPoint } from "../pixelLine"
import { ImageInfo } from "@/tools/imaging/jimpHelper"

type LineInfo = Line & {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

type WeightLine = {
    line: LineInfo
    s: number // distance to center [-1;1]
    a: number // angle with x [0;PI]
    weight: number
}

/* Get radon coordinates
 * p0, p1 point in [-1; 1] space
 * a in [0; PI]
 * s in [-1; 1]
 */
export function radon(p0: Point, p1: Point): { a: number, s: number } {
    const a = -Math.atan2(p1.x - p0.x, p1.y - p0.y) + Math.PI
    const s = Math.abs(p1.x * p0.y - p1.y * p0.x) / Math.sqrt(Math.pow(p1.y - p0.y, 2) + Math.pow(p1.x - p0.x, 2))

    return a < Math.PI ? { a, s } : { a: a - Math.PI, s: -s }
}

export function mri({ nailMap, imageDatas, projectSettings }: CalculationWorkerStartData): Instructions {
    const project: ProjectSettings = projectSettings
    const nails: Array<Nail> = nailMap.nails
    const info: CalculationWorkerInfo = {
        threadIndex: 0,
        threadCount: project.threads.length,
        stepIndex: 0,
        stepCount: 1
    }
    const HEATMAP_SIZE = 400

    let startTime: DOMHighResTimeStamp,
        endTime: DOMHighResTimeStamp

    var result: Array<Step> = []

    startTime = performance.now()

    for (info.threadIndex = 0; info.threadIndex < project.threads.length; info.threadIndex++) {
        const thread: Thread = project.threads[info.threadIndex]
        const imageInfo: ImageInfo = imageDatas[info.threadIndex]
        const imageData: Uint8Array = imageInfo.data
        info.stepCount = thread.maxStep
        info.stepIndex = 0

        let minX: number = 99999999,
            maxX: number = -99999999,
            minY: number = 99999999,
            maxY: number = -99999999

        function getX(x: number): number {
            return (x! - thread.imageTransformation.position.x) / thread.imageTransformation.scale
        }

        function getY(y: number): number {
            return (y! - thread.imageTransformation.position.y) / thread.imageTransformation.scale
        }

        function updateMinMax(p: Point) {
            minX = Math.min(minX, p.x)
            maxX = Math.max(maxX, p.x)
            minY = Math.min(minY, p.y)
            maxY = Math.max(maxY, p.y)
        }

        function getLineInfo(n0Idx: number, r0: RotationDirection, n1Idx: number, r1: RotationDirection): LineInfo {
            const line: Line = LineHelper.getTangeant(nails[n0Idx].position, nails[n0Idx].diameter, r0, nails[n1Idx].position, nails[n1Idx].diameter, r1)
            updateMinMax(line.p0)
            updateMinMax(line.p1)
            return { ...line, n0Idx, r0, n1Idx, r1 }
        }

        log(`calculate tangeant lines`)
        const lines: LineInfo[] = nailMap.lines.map((lines: number[], n0Idx: number) =>
            lines.map((n1Idx: number) => [
                getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.ClockWise),
                // getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.AntiClockWise)
            ]).reduce((a: LineInfo[], b: LineInfo[]) => a.concat(b), [])
                .concat(
                    lines.map((n1Idx: number) => [
                        // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.ClockWise),
                        // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.AntiClockWise)
                    ]).reduce((a: LineInfo[], b: LineInfo[]) => a.concat(b), []))
        ).reduce((a: LineInfo[], b: LineInfo[]) => a.concat(b), [])

        const center = {
            x: (maxX + minX) / 2,
            y: (maxY + minY) / 2,
        } // center
        const radius = Math.max(maxX - center.x, maxY - center.y, center.x - minX, center.y - minY) // radius

        log(center)
        log(radius)

        // nailMap ref to picture ref
        minX = getX(minX!)
        maxX = getX(maxX!)
        minY = getY(minY!)
        maxY = getY(maxY!)

        log(`thread "${thread.description}" calculate target`)

        // clamp image as BW [0;1]
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

        // Get Radon heatmap of the image
        const heatmap: number[] = new Array(HEATMAP_SIZE * HEATMAP_SIZE)

        const getRadon = (idx: number) => {
            const is = idx / HEATMAP_SIZE
            const ia = idx % HEATMAP_SIZE
            return {
                s: -1 + (is + 0.5) * 2 / HEATMAP_SIZE,
                a: (ia + 0.5) * Math.PI / HEATMAP_SIZE,
            }
        }

        for (let j = 0; j < heatmap.length; j++) {
            const r = getRadon(j)
            // x = z sin(a) + s cos(a)
            // y = -z cos(a) + s sin(a)
            // => look for points on the cercke x² + y² = R²
            // z² = R² - s²
            const z = Math.sqrt(1 - Math.pow(r.s, 2)) // 
            const p = [-z, z]
                .map(z => ({
                    x: z * Math.sin(r.a) + r.s * Math.cos(r.a),
                    y: - z * Math.cos(r.a) + r.s * Math.sin(r.a),
                }))
                .map(p => ({
                    x: p.x * radius + center.x,
                    y: -p.y * radius + center.y,
                }))
                .map(p => ({
                    x: getX(p.x) - minX! + 2,
                    y: getY(p.y) - minY! + 2,
                }))

            const points = PixelLineHelper.get(p[0], p[1], PixelLineMode.Simple)
                .filter(p => p.x >= 0 && p.x < target.length && p.y >= 0 && p.y < target[0].length)

            heatmap[j] = points.length == 0
                ? 0
                : points.reduce((sum: number, p: WeightPoint) => sum + target[p.x][p.y], 0) / points.length

            if (j % 5693 == 0) {
                log(`j:${j} => heat:${heatmap[j]}`)
                // log(points)
            }
        }

        const hMax = Math.max(...heatmap)
        log(`hMax:${hMax}`)

        // clamp heatmap to [0;1]
        for (let j = 0; j < heatmap.length; j++)
            heatmap[j] = heatmap[j] / hMax

        // log(heatmap)
        log(`target[${target.length}][${target[0].length}]`)

        const linesWeights: WeightLine[] = lines.map((l: LineInfo) => {
            const p = [l.p0, l.p1].map(p => ({
                x: (p.x - center.x) / radius,
                y: -(p.y - center.y) / radius,
            }))

            return {
                line: l,
                weight: 1,
                ...radon(p[0], p[1])
            }
        })

        const steps: Array<LineInfo> = []

        log(`thread "${thread.description}" search path`)
        // log(linesWeights)
        var start = new Date()

        let nextLine: WeightLine | undefined
        let lineError: number | undefined
        let nextIndex: number | undefined

        do {
            nextIndex = 0

            for (let j = 1; j < heatmap.length; j++) {
                if (heatmap[j] <= heatmap[nextIndex])
                    continue

                nextIndex = j
            }

            if (!nextIndex)
                break;

            const r = getRadon(nextIndex)
            nextLine = undefined
            lineError = undefined

            for (const l of linesWeights) {
                const error = Math.sqrt(Math.pow(l.s - r.s, 2) + Math.pow(l.a - r.a, 2))

                if (l.weight <= 0 || lineError && error >= lineError)
                    continue

                lineError = error
                nextLine = l
            }

            if (!nextLine)
                break;

            steps.push({ ...nextLine.line })
            info.stepIndex++
            nextLine.weight = 0

            // update progress
            endTime = performance.now()
            const timeDiff = endTime - startTime
            if (timeDiff > 200) {
                startTime = endTime
                post({ info })
            }

            for (let j = 0; j < heatmap.length; j++) {
                const r = getRadon(j)
                const t = (Math.pow(nextLine.s, 2) + Math.pow(r.s, 2) - 2 * nextLine.s * r.s * Math.cos(nextLine.a - r.a)) / Math.pow(Math.sin(nextLine.a - r.a), 2)

                if (t > 1)
                    continue

                heatmap[j] -= 1 / (Math.abs(Math.sin(nextLine.a - r.a)))
            }
        }
        while (nextLine && info.stepIndex < thread.maxStep)

        // temp because no continuity
        for (const step of steps) {
            result.push({
                nailIndex: step.n0Idx,
                direction: RotationDirection.ClockWise,
            })
            result.push({
                nailIndex: step.n1Idx,
                direction: RotationDirection.ClockWise,
            })
        }

        return {
            nails,
            steps: result
        }

        let step: Step = {
            nailIndex: 0,
            direction: RotationDirection.ClockWise,
        }

        const dst = (idx: number) => {
            if (idx > step.nailIndex)
                return Math.min(idx - step.nailIndex, step.nailIndex + nails.length - idx)
            else
                return Math.min(step.nailIndex - idx, idx + nails.length - step.nailIndex)
        }


        // for (let j = -1000; j < 1000; j++) {

        // combine lines
        while (steps.length > 0) {
            let d = 9999
            let index: number | undefined = undefined
            let reverse: boolean = false

            // direct             
            for (let j = 0; j < steps.length; j++) {
                const s = steps[j]
                const dst0 = dst(s.n0Idx)
                const dst1 = dst(s.n1Idx)

                if (dst0 == 0) {
                    result.push(step = {
                        nailIndex: s.n1Idx,
                        direction: RotationDirection.ClockWise,
                    })
                    steps.splice(j, 1)
                    break
                }
                if (dst1 == 0) {
                    result.push(step = {
                        nailIndex: s.n0Idx,
                        direction: RotationDirection.ClockWise,
                    })
                    steps.splice(j, 1)
                    break
                }
                if (dst0 < d) {
                    d = dst0
                    index = j
                }
                if (dst1 < d) {
                    d = dst1
                    index = j
                    reverse = true
                }
            }

            if (index === undefined)
                continue

            const s = steps[Math.abs(index!)]
            log(`step:${step.nailIndex} index:${index} d:${d} s:${s.n0Idx}.${s.n1Idx}`)

            if (reverse) {
                result.push({
                    nailIndex: s.n1Idx,
                    direction: RotationDirection.ClockWise,
                })
                result.push(step = {
                    nailIndex: s.n0Idx,
                    direction: RotationDirection.ClockWise,
                })
            } else {
                result.push({
                    nailIndex: s.n0Idx,
                    direction: RotationDirection.ClockWise,
                })
                result.push(step = {
                    nailIndex: s.n1Idx,
                    direction: RotationDirection.ClockWise,
                })
            }
            steps.splice(index!, 1)
        }
    }

    return {
        nails: [],
        steps: [],
    }
}

parentPort?.on('message', (data: CalculationWorkerStartData) => {
    log('start')
    const result = mri(data)
    post({ result })
})

function post(message: CalculationWokerMessage) {
    parentPort?.postMessage(message)
}

function log(message: string | any) {
    if (typeof message !== 'string' && !(message instanceof String))
        message = JSON.stringify(message)

    console.log(`[mriCalculation.worker] ${message}`)
}