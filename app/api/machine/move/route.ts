import { withMiddleware, machine } from "@/tools/api"
import { MachineMoveInstruction } from "@/tools/machine/machineMoveInstruction"
import { NextRequest, NextResponse } from "next/server"

export const POST = withMiddleware(async (req: NextRequest) => {
    const instruction: MachineMoveInstruction = await req.json()

    machine.move(instruction)

    return NextResponse.json({ ok: true })
})