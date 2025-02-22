
import { join } from "node:path"
import { SerialMachine } from "@/tools/machine/serial"
import { FrameRepository, ProjectRepository } from "@/repositories"
import { Calculator } from "@/tools/calculation/calculator"

export const DataDirectory = process.env.DATA_DIRECTORY ?? './data'
export const SettingsFilePath = join(DataDirectory, '/machine/settings.json')

const globalForApp = global as unknown as {
    machine: SerialMachine
    calculator: Calculator
    projectRepository: ProjectRepository
    frameRepository: FrameRepository
}

if (process.env.RENOUN_SERVER_STARTED !== 'true') {
    globalForApp.machine = new SerialMachine()
    globalForApp.calculator = new Calculator()
    globalForApp.projectRepository = new ProjectRepository(join(DataDirectory, 'project'))
    globalForApp.frameRepository = new FrameRepository(join(DataDirectory, 'frame'))
    process.env.RENOUN_SERVER_STARTED = 'true'
}

export const machine = globalForApp.machine
export const calculator = globalForApp.calculator
export const projectRepository = globalForApp.projectRepository
export const frameRepository = globalForApp.frameRepository