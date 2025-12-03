import { ColorOptions, LuminosityOptions, Thread } from "@/model"
import { Jimp } from "jimp"

export type ImageInfo = {
    data: Uint8Array
    width: number
    height: number
}

export namespace JimpHelper {
    export async function getImageData(imageData: string | undefined, colorOptions?: ColorOptions, luminosityOptions?: LuminosityOptions): Promise<ImageInfo | null> {
        if (!imageData)
            return null

        const image = await Jimp.read(imageData)

        JimpHelper.applyOptions(image, colorOptions, luminosityOptions)

        return {
            data: Uint8Array.from(image.bitmap.data), // data rgba
            width: image.bitmap.width,
            height: image.bitmap.height,
        }
    }

    export function applyOptions(image: Awaited<ReturnType<typeof Jimp.read>>, colorOptions?: ColorOptions, luminosityOptions?: LuminosityOptions) {
        if (colorOptions?.isEnabled) {
            const matrix = colorOptions.colorMatrix
            image.scan((_, __, i) => {
                const r = image.bitmap.data[i]
                const g = image.bitmap.data[i + 1]
                const b = image.bitmap.data[i + 2]

                for (let j = 0; j < 3; j++)
                    image.bitmap.data[i + j] = r * matrix[0][j]
                        + g * matrix[1][j]
                        + b * matrix[2][j]
            })
        }

        if (luminosityOptions?.isEnabled) {
            image.brightness(luminosityOptions.brightness)
            image.contrast(luminosityOptions.contrast)
        }
    }
}