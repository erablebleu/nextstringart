import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, APINextResponse, projectRepository } from "@/tools/api"
import { IdParameters } from "@/app/parameters"

export type Parameters = IdParameters & {
    instructionsId: string
}

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const instructionsId = (await params).instructionsId    
    const repository = projectRepository.getInstructionsRepository(projectId)
    const result = await repository.read(instructionsId)

    return NextResponse.json(result)
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<Parameters>}) => {
    const projectId = (await params).id
    const instructionsId = (await params).instructionsId
    const repository = projectRepository.getInstructionsRepository(projectId)

    await repository.delete(instructionsId)

    return APINextResponse.Success
})