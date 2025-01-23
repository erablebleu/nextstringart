'use client'

import { Button, ButtonGroup, Grid, MenuItem, Select, Stack, Typography } from "@mui/material";
import React from "react";
import { Action } from "@/app/action";
import { fetchAndThrow } from "@/tools/fetch";
import { ChevronLeft, ChevronRight, FirstPage, LastPage, Save } from "@mui/icons-material";
import { enqueueSnackbar } from "notistack";
import { Project, Frame, NailMap, NailMapHelper, Nail, Entity } from "@/model";

type Options = {
    projectId: string
}

type SVGInfo = {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

const SVG_MARGIN = 60

export default function ({ projectId }: Options) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [index, setIndex] = React.useState(0)

    const [state, setState] = React.useState<{
        project: Project
        frames: Array<Frame & Entity>
        nailMap: NailMap
        svgInfo: SVGInfo
    } | undefined>()

    React.useEffect(() => {
        Action.try(async () => {
            const resProject = await fetchAndThrow(`/api/project/${projectId}`, { method: 'GET' })
            const project: Project = await resProject.json()
            const resFrames = await fetchAndThrow(`/api/frame`, { method: 'GET' })
            const frames: Array<Frame & Entity> = await resFrames.json()
            const frame: Frame & Entity = frames.find((x: Frame & Entity) => x.id == project.frameId) ?? frames[0]
            const nailMap: NailMap = NailMapHelper.get(frame)

            project.frameId = frame.id

            setState({
                project,
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
            project: {
                ...state!.project,
                nailMapTransformation: {
                    ...state!.project.nailMapTransformation,
                    scale: state!.project.nailMapTransformation.scale * (1 - 0.0002 * event.deltaY)
                }
            }
        })
    }

    async function onMouseMove(event: any) {
        if (!isDragging) return
        setState({
            ...state!,
            project: {
                ...state!.project,
                nailMapTransformation: {
                    ...state!.project.nailMapTransformation,
                    position: {
                        x: state!.project.nailMapTransformation.position.x + event.movementX * state!.project.nailMapTransformation.scale,
                        y: state!.project.nailMapTransformation.position.y + event.movementY * state!.project.nailMapTransformation.scale,
                    }
                }
            }
        })
    }

    async function handleFrameChange(frameId: string) {
        if (!state)
            return

        const frame: Frame & Entity = state.frames.find((x: Frame & Entity) => x.id == frameId) ?? state.frames[0]
        const nailMap: NailMap = NailMapHelper.get(frame)

        setState({
            ...state!,
            project: {
                ...state!.project,
                frameId,
            },
            nailMap,
            svgInfo: getSvgInfo(nailMap),
        })
        setIndex(0)
        setIsDragging(false)
    }

    async function handleSave() {
        try {
            await fetchAndThrow(`/api/project/${projectId}`, {
                method: 'POST',
                body: JSON.stringify(state!.project),
            })

            enqueueSnackbar('Data saved', { variant: 'success' })
        }
        catch (e) {
            console.error(e)
            enqueueSnackbar('Error saving data', { variant: 'error' })
        }
    }

    if (!state)
        return <React.Fragment>Loading ...</React.Fragment>

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
                    <ButtonGroup
                        size="small">
                        <Button
                            color="success"
                            onClick={handleSave}
                            endIcon={<Save />}>
                            Save
                        </Button>
                        <Select
                            size="small"
                            value={state.project.frameId}
                            onChange={(e) => handleFrameChange(e.target.value as string)}
                        >
                            {state.frames.map((x: Frame & Entity) => (
                                <MenuItem key={x.id} value={x.id}>{x.name}</MenuItem>
                            ))}
                        </Select>
                    </ButtonGroup>

                </Grid>
                <Grid
                    item
                    container
                    xs={7}
                    direction='column'
                    alignItems="center"
                    justifyContent='center' >
                    <ButtonGroup>
                        <Button
                            onClick={() => setIndex(0)}>
                            <FirstPage />
                        </Button>
                        <Button
                            onClick={() => setIndex(index == 0 ? state.nailMap.nails.length - 1 : index - 1)}>
                            <ChevronLeft />
                        </Button>
                        <Button disabled sx={{ width: '100px' }}>
                            {index} / {state.nailMap.nails.length}
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
                    onWheel={onWheel}
                    onMouseDown={(e) => setIsDragging(e.shiftKey)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={onMouseMove}>
                    <g
                        transform={`translate(${state.project.nailMapTransformation.position.x}, ${state.project.nailMapTransformation.position.y}) scale(${state.project.nailMapTransformation.scale})`}>
                        {state.project.threads.length > 0 &&
                            <image
                                onDragStart={e => e.preventDefault()}
                                xlinkHref={`data:image/png;${state.project.threads[0].imageInfo.imageData}`} />}
                    </g>
                    <g>
                        {state.nailMap.lines.length > 0 && state.nailMap.lines[index].map((value: number) => (
                            <line
                                key={crypto.randomUUID()}
                                x1={state.nailMap.nails[index].position.x}
                                y1={state.nailMap.nails[index].position.y}
                                x2={state.nailMap.nails[value].position.x}
                                y2={state.nailMap.nails[value].position.y}
                                stroke="black"
                                strokeWidth={0.1} />
                        ))}
                    </g>
                    <g>
                        {state.nailMap.nails.map((n: Nail, index: number) => (
                            <ellipse
                                key={`nail_${index}`}
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