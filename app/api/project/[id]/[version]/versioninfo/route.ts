import { NextResponse } from "next/server"
import { withMiddleware } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { ProjectVersionInfo } from "@/model"
import { calculator, projectRepository } from "@/global"

export type Parameters = IdParameters & {
    version: string
}

// READ
export const GET = withMiddleware(async (_, { params }: { params: Promise<Parameters> }) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const projectVersionInfo: ProjectVersionInfo = await projectRepository.getVersion(projectId, projectVersion)
    const result = {
        ...projectVersionInfo,
        ...calculator.getJob({ projectId, projectVersion })?.getInfo()
    }

    return NextResponse.json(result)
})