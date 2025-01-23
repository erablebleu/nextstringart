import { IdParameters } from "@/app/parameters"
import { calculator, withMiddleware } from "@/tools/api"
import { CalculationJob } from "@/tools/calculation"
import { NextResponse } from "next/server"

export type Parameters = IdParameters

export const POST = withMiddleware(async (_, { params }: { params: Promise<Parameters> }) => {
    const jobId = (await params).id
    const job: CalculationJob | undefined = calculator.getJob(jobId)

    job?.cancel()

    return NextResponse.json({ ok: job !== undefined })
})