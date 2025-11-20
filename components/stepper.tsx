'use client'

import { FormControlLabel, Checkbox, Grid, Button, ButtonGroup, Stack, TextField, Typography, Rating, InputAdornment } from "@mui/material"
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from "@mui/icons-material"
import { Instructions, Nail, ProjectVersionInfo, RotationDirection, Step } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { useLocalStorage } from "@/hooks"
import { Speech } from "@/tools/speech"
import { Point, Line, LineHelper, PointHelper, Vector, VectorHelper } from "@/tools/geometry"
import { ChangeEvent, Fragment, useEffect, useState } from "react"
import NumericInput from "./numericInput"


type Options = {
    projectId: string
    projectVersion: string
}

type SVGInfo = {
    minX: number
    maxX: number
    minY: number
    maxY: number
    center: Point
}

const SVG_MARGIN = 60

export default function ({ projectId, projectVersion }: Options) {
    const [settings, setSettings] = useLocalStorage(`stepper_settings_${projectId}_${projectVersion}`, {
        step: 0,
        offset: 0,
        thickness: 0.20,
        speech: false,
    })

    const [state, setState] = useState<{
        nails: Array<Nail>
        steps: Array<Step>
        svgInfo: SVGInfo,
        rating?: number
    } | undefined>()

    useEffect(() => {
        load()

        async function load() {
            try {
                const instructionPromise = fetchAndThrow(`/api/project/${projectId}/${projectVersion}/instructions`, { method: 'GET' })
                const versionInfoPromise = fetchAndThrow(`/api/project/${projectId}/${projectVersion}/versioninfo`, { method: 'GET' })

                const instructions: Instructions = await (await instructionPromise)?.json()
                const versionInfo: ProjectVersionInfo = await (await versionInfoPromise).json()

                const minX = Math.min(...instructions.nails.map(n => n.position.x - n.diameter / 2)) - SVG_MARGIN
                const maxX = Math.max(...instructions.nails.map(n => n.position.x + n.diameter / 2)) + SVG_MARGIN
                const minY = Math.min(...instructions.nails.map(n => n.position.y - n.diameter / 2)) - SVG_MARGIN
                const maxY = Math.max(...instructions.nails.map(n => n.position.y + n.diameter / 2)) + SVG_MARGIN
                setState({
                    ...instructions,
                    rating: versionInfo.rating,
                    svgInfo: {
                        minX,
                        maxX,
                        minY,
                        maxY,
                        center: {
                            x: (minX + maxX) / 2,
                            y: (minY + maxY) / 2,
                        }
                    }
                })
            }
            catch (e) {
            }
        }
    }, [projectId, projectVersion])

    async function goToStep(number: number) {
        setSettings({
            ...settings,
            step: number
        })
        const instruction: Step = state!.steps[number]

        if (settings.speech)
            Speech.say(`${(settings.offset + instruction.nailIndex) % state!.nails.length}. ${RotationDirection[instruction.direction]}`)
    }

    function getPosition(s: number) {
        const s1: Step = getStep(s - 1)
        const s2: Step = getStep(s)
        const n1: Nail = state!.nails[s1.nailIndex]
        const n2: Nail = state!.nails[s2.nailIndex]
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
        if (state!.steps.length > 1) {
            const v: Vector = VectorHelper.fromPoints(state!.svgInfo.center, nail.position)
            return PointHelper.add(nail.position, VectorHelper.scale(VectorHelper.normalize(v), 20))
        }
        else return {
            x: 100,
            y: 100,
        }
    }

    function handleChange(value: number, propertyName: string) {
        setSettings({
            ...settings,
            [propertyName]: value,
        })
    }

    function getStep(idx: number): Step {
        if (!state || idx < 0 || idx >= state.steps.length)
            return {
                nailIndex: 0,
                direction: RotationDirection.ClockWise,
            }

        return state.steps[idx]
    }

    function getNail(idx: number): Nail | undefined {
        if (!state || idx < 0 || idx >= state.nails.length)
            return

        return state.nails[idx]
    }

    async function handleRate(rating?: number) {
        try {
            setState({
                ...state!,
                rating,
            })
            await fetchAndThrow(`/api/project/${projectId}/${projectVersion}/rate`, {
                method: 'POST',
                body: JSON.stringify({
                    rating
                })
            })
        }
        catch (e) {
            console.error(e)
        }
    }

    if (!state || state.steps.length == 0)
        return <Fragment>
            No data
        </Fragment>

    let step = settings.step

    if (step >= state.steps.length) {
        step = 0
    }

    const { nailIndex: srcNailIdx } = getStep(step - 1)
    const { nailIndex: dstNailIdx } = getStep(step)

    const srcNail = getNail(srcNailIdx)
    const dstNail = getNail(dstNailIdx)

    return (
        <Grid
            container
            height='100%'
            display='flex'
            flexGrow={1}
            flexDirection='column'
            direction='column'
        >
            <Grid
                item
                container
                direction='row'
                spacing={1}
            >
                <Grid item xs={3}>
                    <Stack
                        direction='row'
                        spacing={1}
                        marginTop={1}
                    >
                        <NumericInput
                            label="offset"
                            value={settings.offset}
                            onChange={v => handleChange(v, 'offset')}
                            min={0}
                            max={state.nails.length}
                            type='integer'
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <NumericInput
                            label="thickness"
                            value={settings.thickness}
                            onChange={v => handleChange(v, 'thickness')}
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    size="small"
                                    checked={settings.speech}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, speech: e.target.checked })}
                                />
                            }
                            label="speech"
                        />
                    </Stack>
                </Grid>

                <Grid
                    item
                    container
                    xs={6}
                    direction='column'
                    alignItems="center"
                    justifyContent='center' >
                    <ButtonGroup
                        size="small"
                    >
                        <Button
                            onClick={() => goToStep(0)}>
                            <FirstPage />
                        </Button>
                        <Button
                            onClick={() => goToStep(step == 0 ? state.steps.length - 1 : step - 1)}>
                            <ChevronLeft />
                        </Button>
                        <NumericInput
                            value={step + 1}
                            onChange={(v: number) => goToStep(v - 1)}
                            min={1}
                            max={state.steps.length}
                            type='integer'
                            hideButtons
                            sx={{ width: '80px' }}
                        />
                        <Button disabled sx={{ width: '60px' }}>
                            / {state.steps.length}
                        </Button>
                        <Button
                            onClick={() => goToStep(step == state.steps.length - 1 ? 0 : step + 1)}>
                            <ChevronRight />
                        </Button>
                        <Button>
                            <LastPage
                                onClick={() => goToStep(state.steps.length - 1)} />
                        </Button>
                    </ButtonGroup>
                </Grid>

                <Grid item xs={3}>
                    <Rating
                        size="small"
                        value={state.rating ?? 0}
                        precision={0.5}
                        onChange={(e, newValue) => handleRate(newValue ?? undefined)}>
                    </Rating>
                    {srcNail && <Typography fontSize={12} color='grey'>src: {srcNailIdx} | x:{srcNail.position.x.toFixed(2)} y:{srcNail.position.y.toFixed(2)}</Typography>}
                    {dstNail && <Typography fontSize={12} color='grey'>dst: {dstNailIdx} | x:{dstNail.position.x.toFixed(2)} y:{dstNail.position.y.toFixed(2)}</Typography>}
                </Grid>
            </Grid>

            <Grid
                item
                flexGrow={1}
                display='flex'
                justifyContent='center'
                sx={{ background: 'white' }}>

                <svg
                    viewBox={`${state.svgInfo.minX} ${state.svgInfo.minY} ${state.svgInfo.maxX - state.svgInfo.minX} ${state.svgInfo.maxY - state.svgInfo.minY}`}
                    preserveAspectRatio="xMidYMid"
                    height='100%'
                    width='100%'
                >
                    <linearGradient
                        id="gradient_0000" >
                        <stop offset="0" stopColor="#000000" />
                        <stop offset="1" stopColor="#ff0000" />
                    </linearGradient>
                    {
                        Array.from(Array(step).keys()).map((i: number) => (
                            <line
                                key={`line_${i}`}
                                {...getPosition(i)}
                                stroke="black" strokeWidth={settings.thickness} />
                        ))
                    }
                    {
                        state.steps.length > 0
                        && <g>
                            {dstNail && <text {...getTextPosition(dstNail)} >{(settings.offset + dstNailIdx) % state.nails.length}</text>}
                            <linearGradient
                                id="currentLineGradient"
                                xlinkHref="#gradient_0000"
                                gradientUnits="userSpaceOnUse"
                                {...getPosition(step)} />
                            {dstNail && <path
                                fill="red"
                                transform={`translate(${dstNail.position.x}, ${dstNail.position.y}) rotate(${getArrowAngle(step)})`}
                                d={
                                    state.steps[step].direction == RotationDirection.ClockWise
                                        ? "M 0 -16.697266 C -9.203444 -16.697266 -16.697266 -9.203444 -16.697266 0 A 1.7007855 1.7007855 0 0 0 -15 1.6972656 A 1.7007855 1.7007855 0 0 0 -13.302734 0 C -13.302734 -7.3650985 -7.3650985 -13.302734 0 -13.302734 C 5.0059037 -13.302734 9.3464603 -10.555968 11.617188 -6.4863281 C 11.444061 -6.5903516 11.266602 -6.6851953 11.101562 -6.8066406 C 11.051801 -6.842206 10.992725 -6.8622365 10.931641 -6.8652344 C 10.702673 -6.8781604 10.536333 -6.6528318 10.615234 -6.4375 L 14.71875 4.7089844 C 14.821712 4.9861409 15.215399 4.9861409 15.318359 4.7089844 L 19.414062 -6.4375 C 19.5252 -6.7342496 19.183315 -6.9939635 18.927734 -6.8066406 C 17.954342 -6.1080174 16.842903 -5.7144588 15.712891 -5.5917969 C 13.404801 -12.051512 7.2403535 -16.697266 0 -16.697266 z"
                                        : "m 0,-16.697266 c -7.2412369,0 -13.407417,4.646475 -15.714844,11.1074222 -1.128002,-0.1209083 -2.229501,-0.5147211 -3.183594,-1.2167968 -0.04976,-0.035565 -0.108832,-0.055596 -0.169921,-0.058594 -0.228968,-0.012926 -0.395308,0.2124026 -0.316407,0.4277344 l 4.103516,11.1464844 c 0.102962,0.2771565 0.496649,0.2771565 0.599609,0 L -10.585938,-6.4375 c 0.111138,-0.2967496 -0.230747,-0.5564635 -0.486328,-0.3691406 -0.17778,0.1275963 -0.368518,0.2275186 -0.554687,0.3359375 C -9.3587198,-10.549229 -5.0125174,-13.302734 0,-13.302734 7.3650977,-13.302734 13.302734,-7.3650977 13.302734,0 13.30436,0.9370142 14.062986,1.6956404 15,1.6972656 15.937014,1.6956404 16.69564,0.9370142 16.697266,0 16.697266,-9.2034448 9.2034448,-16.697266 0,-16.697266 Z"
                                }
                            />}
                            <line
                                {...getPosition(step)}
                                style={{
                                    stroke: "url(#currentLineGradient)",
                                    strokeWidth: 1,
                                }} />
                        </g>
                    }
                    {
                        state.nails.map((n: Nail) => (
                            <ellipse key={`nail_${state.nails.indexOf(n)}`} cx={n.position.x} cy={n.position.y} rx={n.diameter / 2} ry={n.diameter / 2} fill="#ff0000" />
                        ))
                    }
                </svg>
            </Grid>
        </Grid>
    )
}
