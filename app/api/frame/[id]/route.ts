import { NextRequest, NextResponse } from "next/server"
import { withMiddleware, APINextResponse } from "@/tools/api"
import { IdParameters } from "@/app/parameters"
import { Entity, Frame } from "@/model"
import { frameRepository } from "@/global"

// READ
export const GET = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id
    const result = await frameRepository.read(id)

    return NextResponse.json(result)
})

// UPDATE
export const PUT = withMiddleware(async (req: NextRequest, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id
    const data: Frame & Entity = await req.json()
    data.id = id

    await frameRepository.update(data)

    return APINextResponse.Success
})

// DELETE
export const DELETE = withMiddleware(async (_, {params}: {params: Promise<IdParameters>}) => {
    const id = (await params).id

    await frameRepository.delete(id)

    return APINextResponse.Success
})