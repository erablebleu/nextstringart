'use client'

import { ColorOptions, LuminosityOptions } from "@/model"
import { JimpHelper } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { Fragment, useEffect, useRef, useState } from "react"

interface Options {
    imageData: string
    colorOptions?: ColorOptions
    luminosityOptions?: LuminosityOptions
}

export default function ({ imageData, colorOptions, luminosityOptions }: Options) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const [state, setState] = useState(imageData)

    async function updateImageImage() {
        const image = await Jimp.read(imageData)

        JimpHelper.applyOptions(image, colorOptions, luminosityOptions)

        setState(await image.getBase64('image/png'))
    }

    useEffect(() => {
        if (typeof window === 'undefined') return
        updateImageImage()
    }, [imageData, colorOptions, luminosityOptions])


    useEffect(() => {
        if (typeof window === 'undefined') 
            return

        const image = new Image()
        image.src = state
        image.onload = () => {
            if (!canvas.current)
                return

            canvas.current.width = image.width
            canvas.current.height = image.height
            const context = canvas.current.getContext('2d')

            if (!context)
                return

            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            context.drawImage(image, 0, 0)
        }
    }, [state])

    return (
        <Fragment>
            <canvas ref={canvas} style={{
                margin: 2,
                width: "100%"
                // display: "block",
                // maxHeight: `${height}px`
            }} />
        </Fragment>
    )
}