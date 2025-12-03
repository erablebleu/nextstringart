'use client'

import { Box, Button, ButtonGroup, Stack, Typography } from "@mui/material"
import { Action } from "@/app/action"
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from "@mui/icons-material"
import { Frame, NailMap, NailMapHelper, Nail, Thread, NailMapTransformation } from "@/model"
import { Fragment, useEffect, useState } from "react"
import NumericInput from "./numericInput"

type Options = {
    thread: Thread
    frame: Frame
    onTransformationChange?: (transformation: NailMapTransformation) => void
}

type SVGInfo = {
    minX: number
    maxX: number
    minY: number
    maxY: number
}

const SVG_MARGIN = 60

export default function ({ thread, frame, onTransformationChange }: Options) {
    const nailMap: NailMap = NailMapHelper.get(frame)
    const [isDragging, setIsDragging] = useState(false)
    const [index, setIndex] = useState(0)

    const [state, setState] = useState<{
        nailMap: NailMap
        svgInfo: SVGInfo
    } | undefined>()

    useEffect(() => {
        Action.try(async () => {
            setState({
                nailMap,
                svgInfo: getSvgInfo(nailMap)
            })
        })
    }, [frame])

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

        onTransformationChange?.({
            ...thread.imageTransformation,
            scale: thread.imageTransformation.scale * (1 - 0.0002 * event.deltaY)
        })
    }

    async function onMouseMove(event: any) {
        if (!isDragging) return

        onTransformationChange?.({
            ...thread.imageTransformation,
            position: {
                x: thread.imageTransformation.position.x + event.movementX * thread.imageTransformation.scale,
                y: thread.imageTransformation.position.y + event.movementY * thread.imageTransformation.scale,
            }
        })
    }

    if (!state)
        return <Fragment>
            Loading ...
        </Fragment>

    return (
        <Stack
            spacing={1}
            direction='column'
        >
            <Stack
                display='flex'
                flexDirection='row'
                direction='row'
                spacing={1}
            >
                <Stack
                    spacing={1}
                    flexGrow={1}
                    direction='column'
                    alignItems="center" >
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

                    <Typography fontSize={12} color='grey' sx={{ marginTop: 1 }}>x:{state.nailMap.nails[index].position.x.toFixed(2)} y:{state.nailMap.nails[index].position.y.toFixed(2)} | {state.nailMap.lines[index].length} paths</Typography>
                </Stack>
                <Stack>
                    <Typography fontSize={12} color='grey'>Shift + Drag to move</Typography>
                    <Typography fontSize={12} color='grey'>Shift + Wheel to zoom</Typography>
                    <Typography fontSize={12} color='grey'>ox:{thread.imageTransformation.position.x.toFixed(2)} oy:{thread.imageTransformation.position.y.toFixed(2)} scale:{thread.imageTransformation.scale.toFixed(3)}</Typography>
                </Stack>
            </Stack>
            <Box
                justifyContent='center'
                sx={{ background: 'white' }}>
                <svg
                    viewBox={`${state.svgInfo.minX} ${state.svgInfo.minY} ${state.svgInfo.maxX - state.svgInfo.minX} ${state.svgInfo.maxY - state.svgInfo.minY}`}
                    preserveAspectRatio="xMidYMid"
                    height='500px'
                    width='100%'
                    onWheel={onWheel}
                    onMouseDown={(e) => setIsDragging(e.shiftKey)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={onMouseMove}>
                    <g
                        transform={`translate(${thread.imageTransformation.position.x}, ${thread.imageTransformation.position.y}) scale(${thread.imageTransformation.scale})`}>
                        <image
                            onDragStart={e => e.preventDefault()}
                            xlinkHref={`data:image/png;${thread.imageData}`} />
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
            </Box>
        </Stack>
    )
}