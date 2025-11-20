import { Instructions } from "@/model"
import { File } from "@/tools/file.back"
import { withMiddleware } from "@/tools/api"
import { MachineSettings } from "@/tools/machine/settings"
import { NextRequest, NextResponse } from "next/server"
import { SettingsFilePath } from "@/global"
import { machine } from "@/global"
import { WiringGCodeGenerator, WiringGCodeSettings } from "@/tools/machine/gcode/wiringGenerator"

export const POST = withMiddleware(async (req: NextRequest) => {
    const data: Instructions & WiringGCodeSettings = await req.json()
    const settings: MachineSettings = machine.getSettings() ?? await File.readJSON<MachineSettings>(SettingsFilePath)

    const gCodeGenerator = new WiringGCodeGenerator(data.nails, settings, data)

    gCodeGenerator.addSteps(data.steps)

    const gCode = gCodeGenerator.generate()

    machine.enqueueJob(gCode, {
        name: 'json_fromUI',
        autoStart: true,
    })

    return NextResponse.json({ ok: true })
})