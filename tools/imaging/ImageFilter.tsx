
export class ImageFilter {
    public static async RGB(data: Uint8ClampedArray, matrix: number[][]) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i],
                g = data[i + 1],
                b = data[i + 2]

            for (let j = 0; j < 3; j++) {
                data[i + j] = r * matrix[0][j]
                    + g * matrix[1][j]
                    + b * matrix[2][j]
            }
        }
    }

    public static async BC(data: Uint8ClampedArray, brightness: number, contrast: number) {
        const result: Uint8Array = new Uint8Array()
        for (let i = 0; i < data.length / 3; i++) {

        }

        return result
    }

}