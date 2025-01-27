'use client'

import { Button, ButtonGroup, Grid, Stack, Typography } from "@mui/material"
import { Action } from "@/app/action"
import { fetchAndThrow } from "@/tools/fetch"
import { ChevronLeft, ChevronRight, FirstPage, LastPage, Save } from "@mui/icons-material"
import { enqueueSnackbar } from "notistack"
import { Frame, NailMap, NailMapHelper, Nail, Entity, ProjectSettings } from "@/model"
import { Fragment, useEffect, useState } from "react"
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
}

const SVG_MARGIN = 60

export default function ({ projectId, projectVersion }: Options) {
    const [isDragging, setIsDragging] = useState(false)
    const [index, setIndex] = useState(0)

    const [state, setState] = useState<{
        projectSettings: ProjectSettings
        frames: Array<Frame & Entity>
        nailMap: NailMap
        svgInfo: SVGInfo
    } | undefined>()

    useEffect(() => {
        Action.try(async () => {
            const projectPromise = fetchAndThrow(`/api/project/${projectId}/${projectVersion}/settings`, { method: 'GET' })
            const framePromise = fetchAndThrow(`/api/frame`, { method: 'GET' })
            const projectSettings: ProjectSettings = await (await projectPromise).json()
            const frames: Array<Frame & Entity> = await (await framePromise).json()
            const frame: Frame & Entity = frames.find((x: Frame & Entity) => x.id == projectSettings.frameId) ?? frames[0]
            const nailMap: NailMap = NailMapHelper.get(frame)

            projectSettings.frameId = frame.id

            setState({
                projectSettings,
                frames,
                nailMap,
                svgInfo: getSvgInfo(nailMap)
            })
        })
    }, [])

    function getSvgInfo(nailMap: NailMap): SVGInfo {
        return {
            minX: Math.min(...nailMap.nails.map(n => n.position.x - n.diameter / 2)) - SVG_MARGIN,
            maxX: Math.max(...nailMap.nails.map(n => n.position.x + n.diameter / 2)) + SVG_MARGIN,
            minY: Math.min(...nailMap.nails.map(n => n.position.y - n.diameter / 2)) - SVG_MARGIN,
            maxY: Math.max(...nailMap.nails.map(n => n.position.y + n.diameter / 2)) + SVG_MARGIN,
        }
    }

    async function onWheel(event: any) {
        if (!event.shiftKey) return
        setState({
            ...state!,
            projectSettings: {
                ...state!.projectSettings,
                nailMapTransformation: {
                    ...state!.projectSettings.nailMapTransformation,
                    scale: state!.projectSettings.nailMapTransformation.scale * (1 - 0.0002 * event.deltaY)
                }
            }
        })
    }

    async function onMouseMove(event: any) {
        if (!isDragging) return
        setState({
            ...state!,
            projectSettings: {
                ...state!.projectSettings,
                nailMapTransformation: {
                    ...state!.projectSettings.nailMapTransformation,
                    position: {
                        x: state!.projectSettings.nailMapTransformation.position.x + event.movementX * state!.projectSettings.nailMapTransformation.scale,
                        y: state!.projectSettings.nailMapTransformation.position.y + event.movementY * state!.projectSettings.nailMapTransformation.scale,
                    }
                }
            }
        })
    }

    async function handleSave() {
        try {
            await fetchAndThrow(`/api/project/${projectId}`, {
                method: 'POST',
                body: JSON.stringify(state!.projectSettings),
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    if (!state)
        return <Fragment>
            Loading ...
        </Fragment>

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
                <Grid
                    item
                    xs={2}>
                    <ButtonGroup>
                        <Button
                            color="success"
                            onClick={handleSave}
                            endIcon={<Save />}>
                            Save
                        </Button>
                    </ButtonGroup>

                </Grid>
                <Grid
                    item
                    container
                    xs={7}
                    direction='column'
                    alignItems="center"
                    justifyContent='center' >
                    <ButtonGroup
                        size="small"
                    >
                        <Button
                            onClick={() => setIndex(0)}>
                            <FirstPage />
                        </Button>
                        <Button
                            onClick={() => setIndex(index == 0 ? state.nailMap.nails.length - 1 : index - 1)}>
                            <ChevronLeft />
                        </Button>
                        <NumericInput
                            value={index}
                            onChange={(v: number) => setIndex(v)}
                            min={0}
                            max={state.nailMap.nails.length - 1}
                            type='integer'
                            hideButtons
                            sx={{
                                width: '80px',
                            }}
                        />
                        <Button disabled sx={{ width: '60px' }}>
                            / {state.nailMap.nails.length}
                        </Button>
                        <Button
                            onClick={() => setIndex(index == state.nailMap.nails.length - 1 ? 0 : index + 1)}>
                            <ChevronRight />
                        </Button>
                        <Button>
                            <LastPage
                                onClick={() => setIndex(state.nailMap.nails.length - 1)} />
                        </Button>
                    </ButtonGroup>

                    <Stack direction='row' spacing={1}>
                        <Typography fontSize={12} color='grey' sx={{ marginTop: 1 }}>x:{state.nailMap.nails[index].position.x.toFixed(2)} y:{state.nailMap.nails[index].position.y.toFixed(2)} | {state.nailMap.lines[index].length} paths</Typography>
                    </Stack>
                </Grid>
                <Grid item xs={2}>
                    <Typography fontSize={12} color='grey'>Shift + Drag to move</Typography>
                    <Typography fontSize={12} color='grey'>Shift + Wheel to zoom</Typography>
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
                    onWheel={onWheel}
                    onMouseDown={(e) => setIsDragging(e.shiftKey)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={onMouseMove}>
                    <g
                        transform={`translate(${state.projectSettings.nailMapTransformation.position.x}, ${state.projectSettings.nailMapTransformation.position.y}) scale(${state.projectSettings.nailMapTransformation.scale})`}>
                        {state.projectSettings.threads.length > 0 &&
                            <image
                                onDragStart={e => e.preventDefault()}
                                xlinkHref={`data:image/png;${state.projectSettings.threads[0].imageData}`} />}
                    </g>
                    <g>
                        {state.nailMap.lines.length > 0 && state.nailMap.lines[index].map((value: number, idx: number) => (
                            <line
                                key={`line_${idx}`}
                                x1={state.nailMap.nails[index].position.x}
                                y1={state.nailMap.nails[index].position.y}
                                x2={state.nailMap.nails[value].position.x}
                                y2={state.nailMap.nails[value].position.y}
                                stroke="black"
                                strokeWidth={0.1} />
                        ))}
                    </g>
                    <g>
                        {state.nailMap.nails.map((n: Nail, idx: number) => (
                            <ellipse
                                key={`nail_${idx}`}
                                cx={n.position.x}
                                cy={n.position.y}
                                rx={n.diameter / 2}
                                ry={n.diameter / 2} fill="#ff0000" />
                        ))}
                    </g>
                </svg>
            </Grid>
        </Grid>
    )
}