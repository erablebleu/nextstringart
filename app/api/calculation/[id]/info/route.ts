import { IdParameters } from "@/app/parameters"
import { withMiddleware } from "@/tools/api"
import { NextResponse } from "next/server"
import { calculator } from "@/global"
import { CalculationJob } from "@/tools/calculation/calculationJob"

export type Parameters = IdParameters

export const GET = withMiddleware(async (_, { params }: { params: Promise<Parameters> }) => {
    const jobId = (await params).id
    const job: CalculationJob | undefined = calculator.getJob({ jobId })

    return NextResponse.json(job?.getInfo())
})