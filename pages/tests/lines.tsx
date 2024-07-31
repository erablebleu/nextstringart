import { IPixelLine, IWeightPoint2D, PixelLine, PixelLineMode } from "@/tools/calculation/PixelLine";
import { IPoint2D } from "@/tools/geometry/Point2D";
import { Refresh } from "@mui/icons-material";
import { Button, Stack } from "@mui/material";
import React from "react";

function range(startAt: number, count: number): number[] {
    return Array.from(Array(count).keys()).map(i => i + startAt)
}
function random(min: number, max: number): number {
    return Math.random() * (max - min + min)
}

export default function Home() {
    const minX: number = -50
    const maxX: number = 100
    const minY: number = 0
    const maxY: number = 50
    const p0: IPoint2D = { x: random(minX, maxX), y: random(minY, maxY) }
    const p1: IPoint2D = { x: random(minX, maxX), y: random(minY, maxY) }
    const [lines, setLines] = React.useState<IPixelLine[]>([])

    const refresh = async () => {
        setLines([
            PixelLine.get(p0, p1, PixelLineMode.Simple),
            PixelLine.get(p0, p1, PixelLineMode.Bresenham),
            PixelLine.get(p0, p1, PixelLineMode.XiaolinWu)
        ])
    }
    
    React.useEffect(() => { refresh() }, [])

    lines.forEach((line: IPixelLine) =>
        line.points.forEach((p: IWeightPoint2D) => {
            if (p.x % 1 != 0
                || p.y % 1 != 0) {
                console.error(p)
            }
        }))

    return (
        <Stack direction="column">
            <Button onClick={refresh} >
                <Refresh />
            </Button>
            {lines.map((line: IPixelLine) => (
                <svg key={`line_${crypto.randomUUID()}`} viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid" height={400} width='100%'>
                    {range(minX, maxX - minX).map((x: number) => (<line
                        key={`line_x_${x}`}
                        stroke="red"
                        strokeWidth="0.02"
                        x1={x}
                        x2={x}
                        y1={minY}
                        y2={maxY} />))}
                    {range(minY, maxY - minY).map((y: number) => (<line
                        key={`line_y_${y}`}
                        stroke="red"
                        strokeWidth="0.1"
                        x1={minX}
                        x2={maxX}
                        y1={y}
                        y2={y} />))}

                    {line.points.map((p: IWeightPoint2D) => (<rect key={crypto.randomUUID()} x={p.x} y={p.y} width={1} height={1} opacity={p.weight}></rect>))}
                </svg>
            ))}
        </Stack>
    )
}
