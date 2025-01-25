import { NextResponse } from "next/server"
import { withMiddleware } from "@/tools/api"
import { calculator } from "@/global"
import { CalculationJob, CalculationJobInfo } from "@/tools/calculation/calculationJob"

// READ ALL
export const GET = withMiddleware(async () => {
    const result: Array<CalculationJobInfo> = calculator
        .getJobs()
        .map((x: CalculationJob) => x.getInfo())

    return NextResponse.json(result)
})