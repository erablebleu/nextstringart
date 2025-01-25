
import { NextRequest, NextResponse } from "next/server"
import { Frame } from "@/model"
import { withMiddleware } from "@/tools/api"
import { frameRepository } from "@/global"

// READ ALL
export const GET = withMiddleware(async () => {
    const result = await frameRepository.readAll()

    return NextResponse.json(result)
})

// CREATE
export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Frame = await req.json()
    const result = await frameRepository.create(data)

    return NextResponse.json(result)
})