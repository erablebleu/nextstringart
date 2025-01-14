import { machine, withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"

export const GET = withMiddleware(async (req: NextRequest) => {
    return NextResponse.json(machine.getInfo())
})