import { RotationDirection } from "@/enums/rotationDirection"
import { IStep, IInstructions, INail } from "@/model/instructions"
import { IProject, Thread } from "@/model/project"
import { IPixelLine, IPixelLineEvaluation, IWeightPoint2D, PixelLine, PixelLineMode } from "@/tools/calculation/PixelLine"
import { ILine2D, Line2D } from "@/tools/geometry/Line2D"
import { IPoint2D } from "@/tools/geometry/Point2D"
import { CalculatorMessageType, ICalculatorInput, ICalculatorMessage, ICalculatorProgress } from "./workers"

interface ILineInfo extends ILine2D {
    n0Idx: number
    r0: RotationDirection
    n1Idx: number
    r1: RotationDirection
}

type WeightLine = {
    line: ILineInfo
    s: number // distance to center [-1;1]
    a: number // angle with x [0;PI]
    weight: number
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

/* Get radon coordinates
 * p0, p1 point in [-1; 1] space
 * a in [0; PI]
 * s in [-1; 1]
 */
function radon(p0: IPoint2D, p1: IPoint2D): { a: number, s: number } {
    const a = -Math.atan2(p1.x - p0.x, p1.y - p0.y) + Math.PI
    const s = Math.abs(p1.x * p0.y - p1.y * p0.x) / Math.sqrt(Math.pow(p1.y - p0.y, 2) + Math.pow(p1.x - p0.x, 2))

    return a < Math.PI ? { a, s } : { a: a - Math.PI, s: -s }
}

function calculate(project: IProject, imageDatas: Array<Uint8ClampedArray>, threads: Array<boolean>): Array<IStep> {
    const nails: Array<INail> = project.nailMap.nails
    const HEATMAP_SIZE = 400

    let minX: number = 99999999,
        maxX: number = -99999999,
        minY: number = 99999999,
        maxY: number = -99999999

    const updateMinMax = (p: IPoint2D) => {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
    }

    const getLineInfo = (n0Idx: number, r0: RotationDirection, n1Idx: number, r1: RotationDirection): ILineInfo => {
        const line: ILine2D = Line2D.getTangeant(nails[n0Idx].position, nails[n0Idx].diameter, r0, nails[n1Idx].position, nails[n1Idx].diameter, r1)
        updateMinMax(line.p0)
        updateMinMax(line.p1)
        return { ...line, n0Idx, r0, n1Idx, r1 }
    }

    console.log(`worker: calculate tangeant lines`)
    const lines: ILineInfo[] = project.nailMap.lines.map((lines: number[], n0Idx: number) =>
        lines.map((n1Idx: number) => [
            getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.ClockWise),
            // getLineInfo(n0Idx, RotationDirection.ClockWise, n1Idx, RotationDirection.AntiClockWise)
        ]).reduce((a: ILineInfo[], b: ILineInfo[]) => a.concat(b), [])
            .concat(
                lines.map((n1Idx: number) => [
                    // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.ClockWise),
                    // getLineInfo(n0Idx, RotationDirection.AntiClockWise, n1Idx, RotationDirection.AntiClockWise)
                ]).reduce((a: ILineInfo[], b: ILineInfo[]) => a.concat(b), []))
    ).reduce((a: ILineInfo[], b: ILineInfo[]) => a.concat(b), [])

    const center = {
        x: (maxX + minX) / 2,
        y: (maxY + minY) / 2,
    } // center
    const radius = Math.max(maxX - center.x, maxY - center.y, center.x - minX, center.y - minY) // radius


    console.log(center)
    console.log(radius)

    // nailMap ref to picture ref
    minX = (minX! - project.nailMap.position.x) / project.nailMap.scale
    maxX = (maxX! - project.nailMap.position.x) / project.nailMap.scale
    minY = (minY! - project.nailMap.position.y) / project.nailMap.scale
    maxY = (maxY! - project.nailMap.position.y) / project.nailMap.scale

    console.log(`worker: calculate pixel lines`)

    for(let d of [
        { p0: { x: 1.1, y: -1.1 }, p1 : { x: 1, y: 1 }},
        { p0: { x: 1.1, y: 0.1 }, p1 : { x: 0, y: 1 }},
        { p0: { x: -1.1, y: 1.1 }, p1 : { x: 1, y: 1 }},
        { p0: { x: 0.1, y: 1.1 }, p1 : { x: -1, y: 0 }},
        { p0: { x: -1.1, y: -1.1 }, p1 : { x: -1, y: 1 }},
        { p0: { x: -1.1, y: 0.1 }, p1 : { x: 0, y: -1 }},
        { p0: { x: -1.1, y: -1.1 }, p1 : { x: 1, y: -1 }},
        { p0: { x: 0.1, y: -1.1 }, p1 : { x: 1, y: 0 }},
    ])
        console.log(`x0:${d.p0.x} y0:${d.p0.y} x1:${d.p1.x} y1:${d.p1.y} ${JSON.stringify(radon(d.p0, d.p1))}`)

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

        // clamp image as BW [0;1]
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
        
        // Get Radon heatmap of the image
        const heatmap: number[] = new Array(HEATMAP_SIZE * HEATMAP_SIZE)

        const getRadon = (idx: number) => {
            const is = idx / HEATMAP_SIZE
            const ia = idx % HEATMAP_SIZE
            return {                
                s:  -1 + (is + 0.5) * 2 / HEATMAP_SIZE,
                a: (ia + 0.5) * Math.PI / HEATMAP_SIZE,
            }
        }

        for(let j = 0; j < heatmap.length; j++) {
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
                    x: (p.x - project.nailMap.position.x) / project.nailMap.scale - minX! + 2,
                    y: (p.y - project.nailMap.position.y) / project.nailMap.scale - minY! + 2,
                }))
            
            const points = PixelLine.get(p[0], p[1], PixelLineMode.Simple)
                .points
                .filter(p => p.x >= 0 && p.x < target.length && p.y >= 0 && p.y < target[0].length)                

            heatmap[j] = points.length == 0
                ? 0 
                : points.reduce((sum: number, p: IWeightPoint2D) => sum + target[p.x][p.y], 0) / points.length                
            
            if(j %5693 == 0){
                console.log(`j:${j} => heat:${heatmap[j]}`)
                console.log(points)
            }
        }

        const hMax = Math.max(...heatmap)
        console.log(`hMax:${hMax}`)

        // clamp heatmap to [0;1]
        for(let j = 0; j < heatmap.length; j++)
            heatmap[j] = heatmap[j] / hMax

        console.log(heatmap)
        console.log(`target[${target.length}][${target[0].length}]`)

        const linesWeights: WeightLine[] = lines.map((l: ILineInfo) => {
            const p = [l.p0, l.p1].map(p => ({
                x:  (p.x - center.x) / radius,
                y: -(p.y - center.y) / radius,
            }))

            return {
                line: l,
                weight: 1,
                ...radon(p[0], p[1])
            }
        })

        const steps: Array<ILineInfo> = []

        console.log(`worker: thread "${thread.description}" search path`)
        console.log(linesWeights)
        var start = new Date()

        let nextLine: WeightLine | undefined
        let lineError: number | undefined
        let nextIndex: number | undefined

        do {
            nextIndex = 0

            for(let j = 1; j < heatmap.length; j++) {
                if(heatmap[j] <= heatmap[nextIndex])
                    continue

                nextIndex = j
            }

            if(!nextIndex)
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
            
            if(!nextLine)
                break;            

            console.log(`nextIndex:${nextIndex} a:${r.a} s:${r.s} heat:${heatmap[nextIndex]} => l a:${nextLine.a} s:${nextLine.s} err:${lineError}`)

            steps.push({ ...nextLine.line })
            stepCount++
            nextLine.weight = 0
            
            for(let j = 0; j < heatmap.length; j++) {
                const r = getRadon(j)                
                const t = (Math.pow(nextLine.s, 2) + Math.pow(r.s, 2) - 2 * nextLine.s * r.s * Math.cos(nextLine.a - r.a)) / Math.pow(Math.sin(nextLine.a - r.a), 2)

                if (t > 1)
                    continue

                heatmap[j] -= 1 / (Math.abs(Math.sin(nextLine.a - r.a)))
            }

            const end = new Date()
            if (end.valueOf() - start.valueOf() > 500) {
                postProgress({
                    stepIndex: stepCount,
                    threadIndex: i
                })
                start = end
            }

        }
        while (nextLine && stepCount < thread.maxStep)

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

        console.log(result)

        return result

        let step: IStep = {
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

            if (index != undefined) {
                const s = steps[Math.abs(index)]
                console.log(`step:${step.nailIndex} index:${index} d:${d} s:${s.n0Idx}.${s.n1Idx}`)

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
                steps.splice(index, 1)
            }
        }

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