
import { NextRequest, NextResponse } from "next/server"
import { projectRepository, withMiddleware } from "@/tools/api"
import { Project } from "@/model"

const repository = projectRepository

// READ ALL
export const GET = withMiddleware(async () => {
    const result = await repository.readAll()

    return NextResponse.json(result)
})

// CREATE
export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Project = await req.json()
    const result = await repository.create(data)

    return NextResponse.json(result)
})