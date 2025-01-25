import { NextRequest } from "next/server"
import { withMiddleware, APINextResponse } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { ProjectVersionInfo } from "@/model"
import { projectRepository } from "@/global"

export type Parameters = IdParameters & {
    version: string
}

// SET VERSION RATING
export const POST = withMiddleware(async (req: NextRequest, { params }: { params: Promise<Parameters> }) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const data: ProjectVersionInfo = await req.json()

    const versionInfo: ProjectVersionInfo = await projectRepository.getVersion(projectId, projectVersion)

    versionInfo.rating = data.rating

    projectRepository.set(projectId, projectVersion, { versionInfo })

    return APINextResponse.Success
})