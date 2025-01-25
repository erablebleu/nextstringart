import { withMiddleware } from "@/tools/api"
import { machine } from "@/global"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (req: NextRequest) => {
    machine.disconnect()

    return NextResponse.json({ ok: true })
})