
import { NextResponse } from "next/server"
import { projectRepository, withMiddleware } from "@/tools/api"
import { IdParameters } from "@/app/parameters"

// READ ALL
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id    
    const repository = projectRepository.getInstructionsRepository(projectId)

    return NextResponse.json(await repository.readAll())
})