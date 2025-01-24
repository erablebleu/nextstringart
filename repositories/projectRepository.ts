import fs from 'node:fs'
import { Instructions, Project, ProjectSettings, ProjectVersionInfo } from "@/model"
import { FileRepository } from "@/tools/fileRepository"
import { join } from "node:path"
import { File } from '@/tools/file.back'

const settingsFileName = 'settings.json'
const instructionsFileName = 'instructions.json'
const versionFileName = 'version.json'

export class ProjectRepository extends FileRepository<Project> {

    constructor(directory: string) {
        super(directory, 'project.json')
    }

    public async set(projectId: string, projectVersion: string, { instructions, settings, versionInfo }: {
        instructions?: Instructions,
        settings?: ProjectSettings,
        versionInfo?: ProjectVersionInfo,
    }) {
        const directory = join(this.directory, projectId, projectVersion)

        await fs.promises.mkdir(directory, { recursive: true })

        if (instructions) {
            const filePath = join(directory, instructionsFileName)
            await File.writeJSON(filePath, instructions)
        }
        if (settings) {
            const filePath = join(directory, settingsFileName)
            await File.writeJSON(filePath, settings)

        }
        if (versionInfo) {
            const filePath = join(directory, versionFileName)
            await File.writeJSON(filePath, versionInfo)
        }
    }

    public async getInstructions(projectId: string, projectVersion: string): Promise<Instructions> {
        const filePath = join(this.directory, projectId, projectVersion, instructionsFileName)

        return await File.readJSON<Instructions>(filePath)
    }

    public async getSettings(projectId: string, projectVersion: string): Promise<ProjectSettings> {
        const filePath = join(this.directory, projectId, projectVersion, settingsFileName)

        return await File.readJSON<ProjectSettings>(filePath)
    }

    public async getVersion(projectId: string, projectVersion: string): Promise<ProjectVersionInfo> {
        const filePath = join(this.directory, projectId, projectVersion, versionFileName)

        return await File.readJSON<ProjectVersionInfo>(filePath)
    }

    public async getVersions(projectId: string): Promise<Array<ProjectVersionInfo>> {
        const directory = join(this.directory, projectId)

        return await Promise.all((await fs.promises.readdir(directory, { withFileTypes: true }))
            .map((dirent: fs.Dirent) => ({ dirent, filePath: join(directory, dirent.name, versionFileName) }))
            .filter(x => x.dirent.isDirectory() && fs.existsSync(x.filePath))
            .map(async x => {
                const data = await File.readJSON<ProjectVersionInfo>(x.filePath)
                return { ...data, version: x.dirent.name }
            }))
    }

    public async createVersion(projectId: string, settings: ProjectSettings): Promise<string> {
        const date = new Date()
        
        const projectVersion = date.toISOString()
            .replaceAll('-', '')
            .replaceAll('T', '')
            .replaceAll(':', '')
            .replaceAll('.', '')
            .replaceAll('Z', '')

        await this.set(projectId, projectVersion, {
            settings,
            versionInfo: {
                version: projectVersion,
                date: date,
            }
        } )

        return projectVersion
    }

    public async deleteVersion(projectId: string, projectVersion: string): Promise<void> {
        const directory = join(this.directory, projectId, projectVersion)

        await fs.promises.rm(directory, { recursive: true, force: true })
    }
}