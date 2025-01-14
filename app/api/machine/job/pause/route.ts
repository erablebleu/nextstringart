import { machine, withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (req: NextRequest) => {
    machine.pauseJob()

    return NextResponse.json({ ok: true })
})