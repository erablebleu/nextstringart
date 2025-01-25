import { withMiddleware } from "@/tools/api"
import { NextRequest, NextResponse } from "next/server"
import { projectRepository, calculator, machine } from "@/global"

export const GET = withMiddleware(async (req: NextRequest) => {

    return NextResponse.json(machine.getInfo())
})