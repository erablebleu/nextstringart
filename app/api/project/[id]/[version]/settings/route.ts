import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, projectRepository, APINextResponse } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { ProjectSettings } from "@/model"

export type Parameters = IdParameters & {
    version: string
}

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const result: ProjectSettings = await projectRepository.getSettings(projectId, projectVersion)

    return NextResponse.json(result)
})

// UPDATE
export const PUT = withMiddleware(async (req: NextRequest, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const settings: ProjectSettings = await req.json()

    await projectRepository.set(projectId, projectVersion, { settings })

    return APINextResponse.Success
})