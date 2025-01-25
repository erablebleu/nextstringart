import { Instructions } from "@/model"
import { File } from "@/tools/file.back"
import { withMiddleware } from "@/tools/api"
import { GCodeGenerator, GCodeSettings } from "@/tools/machine/gcode/generator"
import { MachineSettings } from "@/tools/machine/settings"
import { NextRequest, NextResponse } from "next/server"
import { SettingsFilePath } from "@/global"
import { machine } from "@/global"

export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Instructions & GCodeSettings = await req.json()
    const settings: MachineSettings = machine.getSettings() ?? await File.readJSON<MachineSettings>(SettingsFilePath)

    const gCodeGenerator = new GCodeGenerator(data.nails, settings, data)

    gCodeGenerator.addSteps(data.steps)

    const gCode = gCodeGenerator.generate()

    machine.enqueueJob(gCode, {
        name: 'json_fromUI',
        autoStart: true,
    })

    return NextResponse.json({ ok: true })
})