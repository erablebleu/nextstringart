import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, APINextResponse, projectRepository, calculator } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { Entity, Project, ProjectSettings } from "@/model"

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id
    const result = await projectRepository.read(projectId)

    return NextResponse.json(result)
})

// UPDATE
export const PUT = withMiddleware(async (req: NextRequest, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id
    const data: Project & Entity = await req.json()
    data.id = projectId

    await projectRepository.update(data)

    return APINextResponse.Success
})

// CREATE VERSION
export const POST = withMiddleware(async (req: NextRequest, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id
    const data: ProjectSettings = await req.json()
    const projectVersion = await projectRepository.createVersion(projectId, data)

    calculator.enqueueJob(projectId, projectVersion)

    return NextResponse.json(projectVersion)
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id

    await projectRepository.delete(projectId)

    return APINextResponse.Success
})