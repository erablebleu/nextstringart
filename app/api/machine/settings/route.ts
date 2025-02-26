
import { NextRequest, NextResponse } from "next/server"
import { File } from "@/tools/file.back"
import { withMiddleware } from "@/tools/api"
import { MachineSettings } from "@/tools/machine/settings"
import { SettingsFilePath } from "@/global"

// READ
export const GET = withMiddleware(async (req: NextRequest) => {
    const settings: MachineSettings = await File.readJSON<MachineSettings>(SettingsFilePath)
    return NextResponse.json(settings)
})

// UPDATE
export const PUT = withMiddleware(async (req: NextRequest) => {
    await File.writeJSON(SettingsFilePath, await req.json())
    return NextResponse.json({ ok: true })
})