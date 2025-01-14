import { NextRequest, NextResponse } from "next/server";
import { SerialMachine } from "@/tools/machine/serial";
import { FrameRepository, ProjectRepository } from "@/repositories";
import { InstructionsRepository } from "@/repositories/instructionsRepository";
import { join } from "node:path";
import { DataDirectory } from "@/global";

export class APINextResponse {
    public static Success = new NextResponse(null, { status: 200 })
}

export function withMiddleware(fn: (request: NextRequest, ...args: any[]) => Promise<NextResponse>) {
    return async function (request: NextRequest, ...args: any[]) {
        try {
            return await fn(request, ...args);
        } catch (e) {
            console.error(e)
            return NextResponse.json(`${e}`, { status: 500 })
        }
    }
}


const globalForAPI = globalThis as unknown as {
    machine?: SerialMachine
    frameRepository?: FrameRepository
    projectRepository?: ProjectRepository
    instructionsRepository?: InstructionsRepository
}

export const SettingsFilePath = join(DataDirectory, '/machine/settings.json')
export const machine = globalForAPI.machine ?? new SerialMachine()
export const frameRepository = globalForAPI.frameRepository ?? new FrameRepository(join(DataDirectory, 'frame'))
export const projectRepository = globalForAPI.projectRepository ?? new ProjectRepository(join(DataDirectory, 'project'))

if (process.env.NODE_ENV !== 'production') {
    globalForAPI.machine = machine
    globalForAPI.frameRepository = frameRepository
    globalForAPI.projectRepository = projectRepository
}