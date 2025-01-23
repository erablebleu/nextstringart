
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
}