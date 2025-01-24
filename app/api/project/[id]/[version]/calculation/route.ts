import { NextResponse } from "next/server"
import { withMiddleware, calculator } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { CalculationJob, CalculationJobInfo } from "@/tools/calculation"

export type Parameters = IdParameters & {
    version: string
}

// READ
export const GET = withMiddleware(async (_, { params }: { params: Promise<Parameters> }) => {
    const projectId = (await params).id
    const projectVersion = (await params).version
    const result: CalculationJobInfo | undefined = calculator
        .getJobs()
        .find((x: CalculationJob) => x.projectId == projectId && x.projectVersion == projectVersion)
        ?.getInfo()

    return NextResponse.json(result ?? {})
})