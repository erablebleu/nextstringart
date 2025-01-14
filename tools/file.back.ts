

import fs from 'node:fs';

export class File {
    public static async readJSON<T>(path: string): Promise<T> {
        const data = (await fs.promises.readFile(path)).toString()
        return JSON.parse(data)
    }

    public static async writeJSON<T>(path: string, data: T) {
        const json = JSON.stringify(data, null, 4)
        await fs.promises.writeFile(path, json, { flag: 'w' })
    }
}
