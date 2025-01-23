import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, calculator } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { CalculationJob } from "@/tools/calculation"

// START CALCULATION
export const POST = withMiddleware(async (req: NextRequest, { params }: { params: Promise<IdParameters> }) => {
    const projectId = (await params).id
    const job: CalculationJob = await calculator.enqueueJob(projectId)

    return NextResponse.json(job.getInfo())
})

// READ ALL
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const projectId = (await params).id    
    const result = calculator.getJobs()
        .filter((x: CalculationJob) => x.projectId == projectId)
        .map((x: CalculationJob) => x.getInfo())
        
    return NextResponse.json(result)
})