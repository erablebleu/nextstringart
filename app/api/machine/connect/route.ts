import { withMiddleware } from "@/tools/api"
import { MachineSettings } from "@/tools/machine/settings"
import { NextRequest, NextResponse } from "next/server"
import { File } from "@/tools/file.back"
import { machine, SettingsFilePath } from "@/global"

export const POST = withMiddleware(async (req: NextRequest) => {
    const settings: MachineSettings = await File.readJSON<MachineSettings>(SettingsFilePath)
    await machine.connect(settings)

    return NextResponse.json({ ok: true })
})