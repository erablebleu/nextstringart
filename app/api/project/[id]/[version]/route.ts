import { NextResponse } from "next/server"
import { withMiddleware, APINextResponse, projectRepository } from "@/tools/api"
import { IdParameters } from "@/app/parameters"

export type Parameters = IdParameters & {
    version: string
}

// READ ALL
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id    
    const result = await projectRepository.getVersions(projectId)

    return NextResponse.json(result)
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const projectVersion = (await params).version

    await projectRepository.deleteVersion(projectId, projectVersion)

    return APINextResponse.Success
})