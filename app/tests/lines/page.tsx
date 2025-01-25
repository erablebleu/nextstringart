'use client'

import { PixelLineHelper, PixelLineMode, WeightPoint } from "@/tools/calculation/pixelLine"
import { Point } from "@/tools/geometry"
import { Refresh } from "@mui/icons-material"
import { Button, Stack } from "@mui/material"
import { useEffect, useState } from "react"

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
    const p0: Point = { x: random(minX, maxX), y: random(minY, maxY) }
    const p1: Point = { x: random(minX, maxX), y: random(minY, maxY) }
    const [lines, setLines] = useState<Array<Array<WeightPoint>>>([])

    const refresh = async () => {
        setLines([
            PixelLineHelper.get(p0, p1, PixelLineMode.Simple),
            PixelLineHelper.get(p0, p1, PixelLineMode.Bresenham),
            PixelLineHelper.get(p0, p1, PixelLineMode.XiaolinWu)
        ])
    }
    
    useEffect(() => { refresh() }, [])

    lines.forEach((points: Array<WeightPoint>) =>
        points.forEach((p: WeightPoint) => {
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
            {lines.map((points: Array<WeightPoint>) => (
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

                    {points.map((p: WeightPoint) => (<rect key={crypto.randomUUID()} x={p.x} y={p.y} width={1} height={1} opacity={p.weight}></rect>))}
                </svg>
            ))}
        </Stack>
    )
}
