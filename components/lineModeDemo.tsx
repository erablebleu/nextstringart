import React from "react";
import { IPixelLine, IWeightPoint2D, PixelLine, PixelLineMode } from "@/tools/calculation/PixelLine";
import { IPoint2D } from "@/tools/geometry/Point2D";

export default function () {
    const p0: IPoint2D = { x: 10, y: 10 }
    const p1: IPoint2D = { x: 94, y: 34 }

    const sline: IPixelLine = PixelLine.get(p0, p1, PixelLineMode.Simple)
    const bline: IPixelLine = PixelLine.get(p0, p1, PixelLineMode.Bresenham)
    const xline: IPixelLine = PixelLine.get(p0, p1, PixelLineMode.XiaolinWu)

    return (
        <React.Fragment>
            <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid" height={200} width='100%'>
                { sline.points.map((p: IWeightPoint2D) => (<rect key={crypto.randomUUID()} x={p.x} y={p.y} width={1} height={1}></rect>)) }
            </svg>
            <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid" height={200} width='100%'>
                { bline.points.map((p: IWeightPoint2D) => (<rect key={crypto.randomUUID()} x={p.x} y={p.y} width={1} height={1} opacity={p.weight}></rect>)) }
            </svg>
            <svg viewBox="0 0 100 50" preserveAspectRatio="xMidYMid" height={200} width='100%'>
                { xline.points.map((p: IWeightPoint2D) => (<rect key={crypto.randomUUID()} x={p.x} y={p.y} width={1} height={1} opacity={p.weight}></rect>)) }
            </svg>
        </React.Fragment>
    )
}