'use client'

import { Instructions, Nail, RotationDirection, Step } from "@/model"
import { Point, Line, LineHelper, PointHelper, Vector, VectorHelper } from "@/tools/geometry"
import { Fragment, useEffect, useState } from "react"

type Options = {
    instructions: Instructions
    fromStep?:number
    toStep?: number
    showNails?: boolean
    showArrow?: boolean
    showNumber?: boolean
    highlightLast?: boolean
    strokeWidth?: number
    nailOffset?: number
}

type SVGInfo = {
    minX: number
    maxX: number
    minY: number
    maxY: number
    center: Point
}

const SVG_MARGIN = 60

export default function ({ instructions, fromStep, toStep, showArrow, showNails, showNumber, highlightLast, strokeWidth, nailOffset }: Options) {
    const [state, setState] = useState<SVGInfo | undefined>()    
    
    useEffect(() => {
        const minX = Math.min(...instructions.nails.map(n => n.position.x - n.diameter / 2)) - SVG_MARGIN
        const maxX = Math.max(...instructions.nails.map(n => n.position.x + n.diameter / 2)) + SVG_MARGIN
        const minY = Math.min(...instructions.nails.map(n => n.position.y - n.diameter / 2)) - SVG_MARGIN
        const maxY = Math.max(...instructions.nails.map(n => n.position.y + n.diameter / 2)) + SVG_MARGIN

        setState({
            minX,
            maxX,
            minY,
            maxY,
            center: {
                x: (minX + maxX) / 2,
                y: (minY + maxY) / 2,
            }
        })
    }, [instructions])

    function getPosition(s: number) {
        const s1: Step = getStep(s - 1)
        const s2: Step = getStep(s)
        const n1: Nail = instructions!.nails[s1.nailIndex]
        const n2: Nail = instructions!.nails[s2.nailIndex]
        const l: Line = LineHelper.getTangeant(n1.position, n1.diameter, s1.direction, n2.position, n2.diameter, s2.direction)

        return {
            x1: l.p0.x,
            y1: l.p0.y,
            x2: l.p1.x,
            y2: l.p1.y,
        }
    }

    function getArrowAngle(s: number) {
        const p = getPosition(s)

        return 90 + 180 / Math.PI * Math.atan2(p.y2 - p.y1, p.x2 - p.x1)
    }

    function getTextPosition(nail: Nail) {
        if (instructions!.steps.length > 1) {
            const v: Vector = VectorHelper.fromPoints(state!.center, nail.position)
            return PointHelper.add(nail.position, VectorHelper.scale(VectorHelper.normalize(v), 20))
        }
        else return {
            x: 100,
            y: 100,
        }
    }

    function getStep(idx: number): Step {
        if (idx < 0 || idx >= instructions.steps.length)
            return {
                nailIndex: 0,
                direction: RotationDirection.ClockWise,
            }

        return instructions.steps[idx]
    }

    function getNail(idx: number): Nail | undefined {
        if (idx < 0 || idx >= instructions.nails.length)
            return

        return instructions.nails[idx]
    }

    if (!state || instructions.steps.length == 0)
        return <Fragment>
            No data
        </Fragment>

    fromStep ??= 0
    toStep ??= instructions.steps.length - 1
    strokeWidth ??= 0.15
    nailOffset ??= 0

    const { nailIndex: srcNailIdx } = getStep(toStep - 1)
    const { nailIndex: dstNailIdx } = getStep(toStep)

    const srcNail = getNail(srcNailIdx)
    const dstNail = getNail(dstNailIdx)

    function renderLines() {
        const result: Array<React.JSX.Element> = []
        for(let i = fromStep!; i < toStep!; i++) {
            result.push(<line
                key={`line_${i}`}
                {...getPosition(i)}
                stroke="black" 
                strokeWidth={strokeWidth} />)
        }
        return result
    }

    return (
        <svg
            viewBox={`${state.minX} ${state.minY} ${state.maxX - state.minX} ${state.maxY - state.minY}`}
            preserveAspectRatio="xMidYMid"
            height='100%'
            width='100%'
        >
            <linearGradient
                id="gradient_0000" >
                <stop offset="0" stopColor="#000000" />
                <stop offset="1" stopColor="#ff0000" />
            </linearGradient>
            {renderLines()}
            <g>
                {dstNail && showNumber && <text {...getTextPosition(dstNail)} >{(nailOffset + dstNailIdx) % instructions.nails.length}</text>}
                <linearGradient
                    id="currentLineGradient"
                    xlinkHref="#gradient_0000"
                    gradientUnits="userSpaceOnUse"
                    {...getPosition(toStep)} />
                {dstNail && showArrow && <path
                    fill="red"
                    transform={`translate(${dstNail.position.x}, ${dstNail.position.y}) rotate(${getArrowAngle(toStep)})`}
                    d={
                        instructions.steps[toStep].direction == RotationDirection.ClockWise
                            ? "M 0 -16.697266 C -9.203444 -16.697266 -16.697266 -9.203444 -16.697266 0 A 1.7007855 1.7007855 0 0 0 -15 1.6972656 A 1.7007855 1.7007855 0 0 0 -13.302734 0 C -13.302734 -7.3650985 -7.3650985 -13.302734 0 -13.302734 C 5.0059037 -13.302734 9.3464603 -10.555968 11.617188 -6.4863281 C 11.444061 -6.5903516 11.266602 -6.6851953 11.101562 -6.8066406 C 11.051801 -6.842206 10.992725 -6.8622365 10.931641 -6.8652344 C 10.702673 -6.8781604 10.536333 -6.6528318 10.615234 -6.4375 L 14.71875 4.7089844 C 14.821712 4.9861409 15.215399 4.9861409 15.318359 4.7089844 L 19.414062 -6.4375 C 19.5252 -6.7342496 19.183315 -6.9939635 18.927734 -6.8066406 C 17.954342 -6.1080174 16.842903 -5.7144588 15.712891 -5.5917969 C 13.404801 -12.051512 7.2403535 -16.697266 0 -16.697266 z"
                            : "m 0,-16.697266 c -7.2412369,0 -13.407417,4.646475 -15.714844,11.1074222 -1.128002,-0.1209083 -2.229501,-0.5147211 -3.183594,-1.2167968 -0.04976,-0.035565 -0.108832,-0.055596 -0.169921,-0.058594 -0.228968,-0.012926 -0.395308,0.2124026 -0.316407,0.4277344 l 4.103516,11.1464844 c 0.102962,0.2771565 0.496649,0.2771565 0.599609,0 L -10.585938,-6.4375 c 0.111138,-0.2967496 -0.230747,-0.5564635 -0.486328,-0.3691406 -0.17778,0.1275963 -0.368518,0.2275186 -0.554687,0.3359375 C -9.3587198,-10.549229 -5.0125174,-13.302734 0,-13.302734 7.3650977,-13.302734 13.302734,-7.3650977 13.302734,0 13.30436,0.9370142 14.062986,1.6956404 15,1.6972656 15.937014,1.6956404 16.69564,0.9370142 16.697266,0 16.697266,-9.2034448 9.2034448,-16.697266 0,-16.697266 Z"
                    }
                />}
                {highlightLast && <line
                    {...getPosition(toStep)}
                    style={{
                        stroke: "url(#currentLineGradient)",
                        strokeWidth: 1,
                    }} />
                }
            </g>
            
            {
                showNails
                && instructions.nails.map((n: Nail) => (
                    <ellipse key={`nail_${instructions.nails.indexOf(n)}`} cx={n.position.x} cy={n.position.y} rx={n.diameter / 2} ry={n.diameter / 2} fill="#ff0000" />
                ))
            }
        </svg>
    )
}
