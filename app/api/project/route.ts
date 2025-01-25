
import { NextRequest, NextResponse } from "next/server"
import { withMiddleware } from "@/tools/api"
import { Project, ProjectHelper } from "@/model"
import { projectRepository } from "@/global"

// READ ALL
export const GET = withMiddleware(async () => {
    const result = await projectRepository.readAll()

    return NextResponse.json(result)
})

// CREATE
export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Project = await req.json()
    const result = await projectRepository.create(data)

    await projectRepository.createVersion(result, ProjectHelper.defaultSettings())

    return NextResponse.json(result)
})