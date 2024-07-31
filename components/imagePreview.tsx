import React from "react";

interface Options {
    imageData: string
    filter?: string
    filterFunc?: (data: Uint8ClampedArray) => void
    onChange?: (data: Uint8ClampedArray) => void
}

export default function ({ imageData, filter, filterFunc, onChange }: Options) {
    const canvas = React.useRef<HTMLCanvasElement>(null)

    React.useEffect(() => {
        if (typeof window === 'undefined') return
        const image = new Image()
        image.src = imageData
        image.onload = () => {
            if (!canvas.current) return
            canvas.current.width = image.width
            canvas.current.height = image.height
            const context = canvas.current.getContext('2d')
            if (!context) return
            context.clearRect(0, 0, context.canvas.width, context.canvas.height)
            context.filter = filter ?? ''
            context.drawImage(image, 0, 0)
            if (filterFunc) {
                const imageData = context.getImageData(0, 0, image.width, image.height)
                filterFunc(imageData.data)
                context.putImageData(imageData, 0, 0)
            }
            onChange?.(context.getImageData(0, 0, image.width, image.height).data)     
        }
    }, [imageData, filter, filterFunc])

    return (
        <React.Fragment>
            <canvas ref={canvas} style={{
                margin: 2,
                width: "100%"
                // display: "block",
                // maxHeight: `${height}px`
            }} />
        </React.Fragment>
    )
}