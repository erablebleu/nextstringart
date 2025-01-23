import { NextResponse } from "next/server"
import { withMiddleware, calculator } from "@/tools/api"
import { CalculationJob, CalculationJobInfo } from "@/tools/calculation"

// READ ALL
export const GET = withMiddleware(async () => {
    const result: Array<CalculationJobInfo> = calculator
        .getJobs()
        .map((x: CalculationJob) => x.getInfo())

    return NextResponse.json(result)
})