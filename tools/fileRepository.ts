

import fs from 'node:fs'
import { join } from 'node:path'
import { Entity } from '@/model'
import { File } from '@/tools/file.back'

export class FileRepository<T> {
    protected readonly directory: string
    protected readonly fileName: string

    constructor(directory: string, fileName: string) {
        this.directory = directory
        this.fileName = fileName

        fs.mkdirSync(this.directory, { recursive: true })
    }

    private getFilePath(id: string): string {
        return join(this.directory, id, this.fileName)
    }

    public async create(data: T): Promise<string> {
        const id: string = crypto.randomUUID()
        await fs.promises.mkdir(join(this.directory, id), { recursive: true })

        await this.update({
            ...data,
            id,
        })

        return id!
    }

    public async read(id: string): Promise<T & Entity> {
        const filePath = this.getFilePath(id)
        console.log('readfile: ' + filePath)
        const data = await File.readJSON<T>(filePath)

        return { ...data, id }
    }

    public async readAll(): Promise<Array<T & Entity>> {
        return await Promise.all((await fs.promises.readdir(this.directory, { withFileTypes: true }))
            .filter(x => x.isDirectory() && fs.existsSync(join(this.directory, x.name, this.fileName)))
            .map(async x => {
                const data = await File.readJSON<T>(join(this.directory, x.name, this.fileName))
                return { ...data, id: x.name }
            }))
    }

    public async update(data: T & Entity): Promise<void> {
        if (!data.id)
            data.id = crypto.randomUUID()

        const filePath = this.getFilePath(data.id)
        await File.writeJSON(filePath, data)
    }

    public async delete(id: string): Promise<void> {
        await fs.promises.rm(join(this.directory, id), { recursive: true, force: true })
    }
}
