import { NextResponse } from "next/server"
import { withMiddleware, projectRepository } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { ProjectVersionInfo } from "@/model"

export type Parameters = IdParameters & {
    version: string
}

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const result: ProjectVersionInfo = await projectRepository.getVersion(projectId, projectVersion)

    return NextResponse.json(result)
})