import { NextRequest, NextResponse } from "next/server"

export function GET(req: NextRequest, res: NextResponse) {
    return NextResponse.json({
        state: 'online',
        x: 0,
        z: 0,
        rz: 0,
    })
}