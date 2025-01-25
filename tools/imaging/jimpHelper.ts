import { ColorOptions, LuminosityOptions, Thread } from "@/model"
import { Jimp } from "jimp"

export namespace JimpHelper {
    export async function getImageData(thread: Thread): Promise<Uint8Array> {
        const image = await Jimp.read(thread.imageInfo.imageData)

        JimpHelper.applyOptions(image, thread.colorOptions, thread.luminosityOptions)

        return Uint8Array.from(image.bitmap.data) // data rgba
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