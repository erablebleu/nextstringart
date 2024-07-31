import { INail } from "@/model/instructions";
import { NailMap } from "@/model/nailMap";
import { Box, Button, ButtonGroup, Typography } from "@mui/material";
import React from "react";
import NumericInput from "./numericInput";

interface Options {
    nailMap: NailMap
    imageData?: string
    onChange?: (newValue: NailMap) => void
}

export default function ({ nailMap, imageData, onChange }: Options) {
    const [isDragging, setIsDragging] = React.useState(false)
    const [state, setState] = React.useState(nailMap.nails.length > 0 ? nailMap : NailMap.fromPolygon())
    const [index, setIndex] = React.useState(0)

    const minX = Math.min(...state.nails.map(n => n.position.x - n.diameter / 2))
    const maxX = Math.max(...state.nails.map(n => n.position.x + n.diameter / 2))
    const minY = Math.min(...state.nails.map(n => n.position.y - n.diameter / 2))
    const maxY = Math.max(...state.nails.map(n => n.position.y + n.diameter / 2))

    React.useEffect(() => {
        setState(nailMap.nails.length > 0 ? nailMap : NailMap.fromPolygon())
    }, [nailMap])

    const setNewValue = (newValue: NailMap) => {
        setState(newValue)
        onChange?.(newValue)
    }

    const onWheel = async (event: any) => {
        if (!event.shiftKey) return
        setNewValue({
            ...state,
            scale: state.scale * (1 - 0.0002 * event.deltaY)
        })
    }

    const onMouseMove = async (event: any) => {
        if (!isDragging) return
        setNewValue({
            ...state,
            position: {
                x: state.position.x + event.movementX * state.scale,
                y: state.position.y + event.movementY * state.scale,
            }
        })
    }

    const handleChange = (newValue: any, propertyName: string | undefined) => {
        setState({
            ...state,
            [propertyName!]: newValue
        })
    }

    return (
        <React.Fragment>
            <NumericInput
                label="scale"
                value={state.scale}
                propertyName="scale"
                onChange={handleChange}
            />
            <NumericInput
                label="position x"
                value={state.scale}
                onChange={(newValue: number) => setState({
                    ...state,
                    position: {
                        x: newValue,
                        y: state.position.y
                    }
                })}
            />
            <NumericInput
                label="position y"
                value={state.scale}
                onChange={(newValue: number) => setState({
                    ...state,
                    position: {
                        x: state.position.x,
                        y: newValue
                    }
                })}
            />
            <Box>
                <Typography>{state.nails.length} nails</Typography>
                <Typography>selected nail: {index} | {state.lines[index].length} paths</Typography>
                <ButtonGroup>
                    <Button onClick={() => setIndex(index == 0 ? state.nails.length - 1 : index - 1)}>-</Button>
                    <Button onClick={() => setIndex(index == state.nails.length - 1 ? 0 : index + 1)}>+</Button>
                </ButtonGroup>
            </Box>

            <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                preserveAspectRatio="xMidYMid"
                height='80vh'
                width='100%'
                onWheel={onWheel}
                onMouseDown={(e) => setIsDragging(e.shiftKey)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={onMouseMove}>
                <g transform={`translate(${state.position.x}, ${state.position.y}) scale(${state.scale})`}>
                    {imageData && <image onDragStart={e => e.preventDefault()} xlinkHref={`data:image/png;${imageData}`} />}
                </g>
                {state.lines.length > 0 && state.lines[index].map((value: number) => (
                    <line key={crypto.randomUUID()}
                        x1={state.nails[index].position.x}
                        y1={state.nails[index].position.y}
                        x2={state.nails[value].position.x}
                        y2={state.nails[value].position.y}
                        stroke="black" strokeWidth={0.1} />
                ))
                }
                {state.nails.map((n: INail, index: number) => (
                    <ellipse key={`nail_${index}`} cx={n.position.x} cy={n.position.y} rx={n.diameter / 2} ry={n.diameter / 2} fill="#ff0000" />
                ))}
            </svg>
            <Typography>Shift + Drag to move</Typography>
            <Typography>Shift + Wheel to zoom</Typography>
        </React.Fragment>
    )
}