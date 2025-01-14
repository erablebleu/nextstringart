import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, APINextResponse, frameRepository } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { Entity, Frame } from "@/model"

const repository = frameRepository

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id
    const result = await repository.read(id)

    return NextResponse.json(result)
})

// UPDATE
export const POST = withMiddleware(async (req: NextRequest, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id
    const data: Frame & Entity = await req.json()
    data.id = id

    await repository.update(data)

    return APINextResponse.Success
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id

    await repository.delete(id)

    return APINextResponse.Success
})