import { NextResponse } from "next/server"
import { withMiddleware, APINextResponse } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { calculator, projectRepository } from "@/global"
import { ProjectVersionInfo } from "@/model"

export type Parameters = IdParameters & {
    version: string
}

// READ ALL
export const GET = withMiddleware(async (_, { params }: { params: Promise<IdParameters> }) => {
    const projectId = (await params).id
    const projectVersions = await projectRepository.getVersions(projectId)
    const result = projectVersions.map((x: ProjectVersionInfo) => ({ ...x, ...calculator.getJob({ projectId, projectVersion: x.version })?.getInfo() }))

    return NextResponse.json(result)
})

// DELETE
export const DELETE = withMiddleware(async (_, { params }: { params: Promise<Parameters> }) => {
    const projectId = (await params).id
    const projectVersion = (await params).version

    await projectRepository.deleteVersion(projectId, projectVersion)
    calculator.getJob({ projectId, projectVersion })?.cancel()

    return APINextResponse.Success
})