import { Instructions, Nail, ProjectSettings, RotationDirection, Step, Thread } from "@/model"
import { buildContinuity, CalculationWokerMessage, CalculationWorkerInfo, CalculationWorkerStartData } from "./calculationWorker"
import { Line, LineHelper, Point } from "@/tools/geometry"
import { parentPort } from "worker_threads"
import { PixelLineHelper, PixelLineMode, WeightPoint } from "../pixelLine"
import { ImageInfo } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { MathHelper } from "@/tools/mathHelper"
import fs from 'node:fs'

type LineInfo = Line & {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

type RadonPoint = {
    s: number // distance to center [-1;1]
    a: number // angle with x [0;PI]
}

type WeightLine = RadonPoint & {
    line: LineInfo
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

function getRadonError(p0: RadonPoint, p1: RadonPoint): number {

    return  Math.sqrt(Math.pow((p0.s - p1.s) / 2, 2) + Math.pow((p0.a - p1.a) / Math.PI, 2))
}

export async function mri({ nailMap, imageDatas, projectSettings }: CalculationWorkerStartData): Promise<Instructions> {
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

    const result: Instructions = {
        nails,
        steps: []
    }

    startTime = performance.now()

    for (info.threadIndex = 0; info.threadIndex < project.threads.length; info.threadIndex++) {
        const thread: Thread = project.threads[info.threadIndex]
        const imageInfo: ImageInfo = imageDatas[info.threadIndex]
        const imageData: Uint8Array = imageInfo.data
        const steps: Array<LineInfo> = []
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
        const lines: LineInfo[] = nailMap.lines.map((lines: number[], n0Idx: number) =>
            lines.map((n1Idx: number) => [
                getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.ClockWise),
                // getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.AntiClockWise),
                // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.ClockWise),
                // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.AntiClockWise),
            ])
        ).flat(2)

        const center = {
            x: (maxX! + minX!) / 2,
            y: (maxY! + minY!) / 2,
        }
        const radius = Math.max(maxX! - center.x, maxY! - center.y, center.x - minX!, center.y - minY!)

        log('center: ', center)
        log('radius: ', radius)

        // nailMap ref to picture ref
        minX = getX(minX!)
        maxX = getX(maxX!)
        minY = getY(minY!)
        maxY = getY(maxY!)

        // TODO : thread.calculationThickness should be scaled

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
            const is = Math.floor(idx / HEATMAP_SIZE)
            const ia = idx % HEATMAP_SIZE
            return {
                s: -1 + (is + 0.5) * 2 / HEATMAP_SIZE,
                a: (ia + 0.5) * Math.PI / HEATMAP_SIZE,
            }
        }

        // build heatmap
        for (let i = 0; i < heatmap.length; i++) {
            heatmap[i] = 0
            const r = getRadon(i)
            // x = z sin(a) + s cos(a)
            // y = -z cos(a) + s sin(a)
            // => look for points on the cercke x² + y² = R²
            // z² = R² - s²
            const z = Math.sqrt(1 - Math.pow(r.s, 2))
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

            if (points.length == 0)
                continue

            heatmap[i] = MathHelper.sum(points.map(p => target[p.x][p.y])) /*/ points.length*/
        }

        const hMax = MathHelper.max(heatmap)
        log('hMax: ', hMax)

        // clamp heatmap to [0;1]
        for (let j = 0; j < heatmap.length; j++)
            heatmap[j] /= hMax




        /* save heatmap image */
        await exportImage(`./test/out/heatmap.png`, heatmap, { width: HEATMAP_SIZE, height: HEATMAP_SIZE })
        /* save heatmap image */

        /* save heatmap csv */
        await fs.promises.writeFile('./test/out/radon.csv', heatmap.map((_, j) => {
            const r = getRadon(j)
            return `${j},${j % HEATMAP_SIZE},${Math.floor(j / HEATMAP_SIZE)},${r.a},${r.s}`
        }).join('\r\n'))
        /* save heatmap csv */




        const linesWeights: WeightLine[] = lines.map((l: LineInfo) => {
            const p: Array<Point> = [l.p0, l.p1].map(p => ({
                x: (p.x - center.x) / radius,
                y: -(p.y - center.y) / radius,
            }))

            return {
                line: l,
                weight: 1,
                ...radon(p[0], p[1])
            }
        })

        log(`thread "${thread.description}" search path`)
        let nextLine: WeightLine | undefined
        let lineError: number | undefined
        let nextIndex: number | undefined
        let nextHeat: number | undefined

        do {
            nextHeat = undefined
            nextIndex = undefined

            /* save heatmap image */
            if (info.stepIndex < 10)
                await exportImage(`./test/out/step_${info.stepIndex}_heatmap.png`, heatmap, { width: HEATMAP_SIZE, height: HEATMAP_SIZE })
            /* save heatmap image */

            // search heatmap max
            for (let i = 1; i < heatmap.length; i++) {
                const heat = heatmap[i]

                if (nextHeat && heat <= nextHeat)
                    continue

                nextHeat = heat
                nextIndex = i
            }

            if (nextIndex === undefined
                || nextHeat == 0)
                break


            const maxLineError = 0.02
            const r = getRadon(nextIndex)
            nextLine = undefined
            lineError = undefined

            // search the closest line of heatmap max
            for (const l of linesWeights) {
                const error = getRadonError(l, r)

                if (error >= maxLineError
                    || l.weight <= 0 
                    || lineError && error >= lineError)
                    continue

                lineError = error
                nextLine = l
            }

            if (!nextLine)
                break;

            // console.log({
            //     ...r,
            //     lineError,
            //     nextIndex,
            //     nextLine,
            // })

            steps.push(nextLine.line)
            info.stepIndex++
            nextLine.weight = 0

            // update progress
            endTime = performance.now()
            const timeDiff = endTime - startTime
            if (timeDiff > 200) {
                startTime = endTime
                post({ info })
            }

            const mask = heatmap.map((_, i) => {
                const r = getRadon(i)

                if (!nextLine)
                    return 0

                // (s² + s0² - 2 * s * s0 * cos(da)) / sin²(da)
                const t = (Math.pow(nextLine.s, 2) + Math.pow(r.s, 2) - 2 * nextLine.s * r.s * Math.cos(nextLine.a - r.a)) / Math.pow(Math.sin(nextLine.a - r.a), 2)

                if (t > 1)
                    return 0

                // const k = 0.01
                const k = 0.01
                // const k = thread.calculationThickness
                return k * 1 / Math.abs(Math.sin(nextLine.a - r.a)) / hMax
            })

            /* save heatmap mask image */
            if (info.stepIndex < 10)
                await exportImage(`./test/out/step_${info.stepIndex - 1}_heatmap_mask.png`, mask, { width: HEATMAP_SIZE, height: HEATMAP_SIZE })
            /* save heatmap mask image */

            // apply mask
            for (let j = 0; j < heatmap.length; j++)
                heatmap[j] = MathHelper.clamp(heatmap[j] - mask[j], 0, 1)
        }
        while (nextLine && info.stepIndex < thread.maxStep)

        result.steps.push(...buildContinuity(nails, steps))
    }

    return result
}

parentPort?.on('message', async (data: CalculationWorkerStartData) => {
    log('start')
    const result = await mri(data)
    post({ result })
})

function post(message: CalculationWokerMessage) {
    parentPort?.postMessage(message)
}

function log(message?: any, ...optionalParams: any[]) {
    console.log(`[mriCalculation.worker] `, message, ...optionalParams)
}

async function exportImage(path: string, data: Array<number>, { width, height, min, max }: { width: number, height: number, min?: number, max?: number }) {
    let image = new Jimp({
        width,
        height,
        color: 'white'
    })

    min ??= 0
    max ??= MathHelper.max(data)

    image.scan((_, __, i) => {
        for (let j = 0; j < 3; j++)
            image.bitmap.data[i + j] = 255 * (data[i / 4] - min) / max
    })

    await image.write(path as any)
}