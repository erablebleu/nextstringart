import { machine, withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (req: NextRequest) => {
    const gcode: string = await req.text()

    machine.enqueueJob(gcode.split('\n'), {
        name: 'gcode_fromUI',
        autoStart: true,
    })

    return NextResponse.json({ ok: true })
})