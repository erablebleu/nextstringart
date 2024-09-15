import { INail } from "@/model/instructions";
import { NailMap } from "@/model/nailMap";
import { Button, ButtonGroup, Stack, Typography } from "@mui/material";
import React from "react";
import NumericInput from "./numericInput";
import { Frame } from "@/model/frame";
import FrameBuilder from "./frameBuilder";

interface Options {
    frame: Frame
    nailMap: NailMap
    imageData?: string
    onChange?: (frame: Frame, nailMap: NailMap) => void
}

export default function ({ frame, nailMap, imageData, onChange }: Options) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [state, setState] = React.useState<{ frame: Frame, nailMap: NailMap }>({ frame, nailMap })
    const [index, setIndex] = React.useState(0)
    const [editFrame, setEditFrame] = React.useState(false)

    const m = 60
    const minX = Math.min(...state.nailMap.nails.map(n => n.position.x - n.diameter / 2)) - m
    const maxX = Math.max(...state.nailMap.nails.map(n => n.position.x + n.diameter / 2)) + m
    const minY = Math.min(...state.nailMap.nails.map(n => n.position.y - n.diameter / 2)) - m
    const maxY = Math.max(...state.nailMap.nails.map(n => n.position.y + n.diameter / 2)) + m

    React.useEffect(() => {
        setState({ frame, nailMap })
    }, [frame, nailMap])

    const setNewValue = (frame: Frame, nailMap: NailMap) => {
        setState({
            frame, nailMap
        })
        onChange?.(frame, nailMap)
    }

    const onWheel = async (event: any) => {
        if (!event.shiftKey) return
        setNewValue(frame, {
            ...state.nailMap,
            scale: state.nailMap.scale * (1 - 0.0002 * event.deltaY)
        })
    }

    const onMouseMove = async (event: any) => {
        if (!isDragging) return
        setNewValue(frame, {
            ...state.nailMap,
            position: {
                x: state.nailMap.position.x + event.movementX * state.nailMap.scale,
                y: state.nailMap.position.y + event.movementY * state.nailMap.scale,
            }
        })
    }

    const handleFrameBuilderChange = (frame: Frame | undefined) => {
        if(frame)
            setNewValue(frame, NailMap.get(frame))

        setEditFrame(false)
    }



    return (
        <React.Fragment>
            {editFrame &&
                <FrameBuilder onChange={handleFrameBuilderChange} />
            }
            {!editFrame && <React.Fragment>
                <Stack>
                    <ButtonGroup>
                        <Button onClick={() => setEditFrame(true)}>Edit Frame</Button>
                    </ButtonGroup>
                </Stack>
                <Stack direction='row' spacing={1}>
                    <Typography>{state.nailMap.nails.length} nails | selected: {index} | {state.nailMap.lines[index].length} paths</Typography>
                    <ButtonGroup>
                        <Button onClick={() => setIndex(index == 0 ? state.nailMap.nails.length - 1 : index - 1)}>-</Button>
                        <Button onClick={() => setIndex(index == state.nailMap.nails.length - 1 ? 0 : index + 1)}>+</Button>
                    </ButtonGroup>
                </Stack>

                <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                    preserveAspectRatio="xMidYMid"
                    width='100%'
                    height='calc(100% - 250px)'
                    onWheel={onWheel}
                    onMouseDown={(e) => setIsDragging(e.shiftKey)}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    onMouseMove={onMouseMove}>
                    <g transform={`translate(${state.nailMap.position.x}, ${state.nailMap.position.y}) scale(${state.nailMap.scale})`}>
                        {imageData && <image onDragStart={e => e.preventDefault()} xlinkHref={`data:image/png;${imageData}`} />}
                    </g>
                    {state.nailMap.lines.length > 0 && state.nailMap.lines[index].map((value: number) => (
                        <line key={crypto.randomUUID()}
                            x1={state.nailMap.nails[index].position.x}
                            y1={state.nailMap.nails[index].position.y}
                            x2={state.nailMap.nails[value].position.x}
                            y2={state.nailMap.nails[value].position.y}
                            stroke="black" strokeWidth={0.1} />
                    ))
                    }
                    {state.nailMap.nails.map((n: INail, index: number) => (
                        <ellipse key={`nail_${index}`} cx={n.position.x} cy={n.position.y} rx={n.diameter / 2} ry={n.diameter / 2} fill="#ff0000" />
                    ))}
                </svg>
                <Typography>Shift + Drag to move</Typography>
                <Typography>Shift + Wheel to zoom</Typography>
            </React.Fragment>}
        </React.Fragment>
    )
}