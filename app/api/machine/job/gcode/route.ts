import { withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"
import { machine } from "@/global"

export const POST = withMiddleware(async (req: NextRequest) => {
    const gcode: string = await req.text()

    machine.enqueueJob(gcode.split('\n'), {
        name: 'gcode_fromUI',
        autoStart: true,
    })

    return NextResponse.json({ ok: true })
})