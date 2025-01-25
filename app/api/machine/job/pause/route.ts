import { withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"
import { machine } from "@/global"


export const POST = withMiddleware(async (req: NextRequest) => {
    machine.pauseJob()

    return NextResponse.json({ ok: true })
})