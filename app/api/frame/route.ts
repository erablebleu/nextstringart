
import { NextRequest, NextResponse } from "next/server"
import { Frame } from "@/model"
import { frameRepository, withMiddleware } from "@/tools/api"

const repository = frameRepository

// READ ALL
export const GET = withMiddleware(async () => {
    const result = await repository.readAll()

    return NextResponse.json(result)
})

// CREATE
export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Frame = await req.json()
    const result = await repository.create(data)

    return NextResponse.json(result)
})