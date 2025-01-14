import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, APINextResponse, projectRepository } from "@/tools/api"
import { IdParameters } from "@/app/parameters"

export type Parameters = IdParameters & {
    instructionsId: string
}

const repository = projectRepository

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const instructionsId = (await params).instructionsId    
    const result = await repository.getInstructionsRepository(projectId).read(instructionsId)

    return NextResponse.json(result)
})

// UPDATE
export const POST = withMiddleware(async (req: NextRequest, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const instructionsId = (await params).instructionsId

    throw new Error('not implemented')

    return APINextResponse.Success
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const instructionsId = (await params).instructionsId

    throw new Error('not implemented')

    return APINextResponse.Success
})