import { withMiddleware, machine } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (req: NextRequest) => {
    machine.startOrResumeJob()

    return NextResponse.json({ ok: true })
})