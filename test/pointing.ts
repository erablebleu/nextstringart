import fs from 'node:fs';
import { Frame, NailMap, NailMapHelper } from "@/model"
import { join } from "node:path"
import { frameRepository, SettingsFilePath } from "@/global"
import { File } from "@/tools/file.back"
import { PointingGCodeGenerator, PointingGCodeSettings } from "@/tools/machine/gcode/pointingGenerator"
import { MachineSettings } from "@/tools/machine/settings"

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const frameId = '86a1c8e2-6d8f-4b69-874e-48e877262232'
    const frame: Frame = await frameRepository.read(frameId)
    const nailMap: NailMap = NailMapHelper.get(frame)
    const machineSettings: MachineSettings = await File.readJSON<MachineSettings>(SettingsFilePath)

    machineSettings.radius -= 30

    const gCodeSettings: PointingGCodeSettings = {
        zLow: 23,
        zHigh: 10,
        pauseDuration: 2500,
    }
    const gCodeGenerator = new PointingGCodeGenerator(nailMap.nails, machineSettings, gCodeSettings)

    const gCode: string[] = gCodeGenerator.generate()

    if (!fs.existsSync(outDirectory))
        await fs.promises.mkdir(outDirectory)

    await fs.promises.writeFile(join(outDirectory, 'pointing.gcode'), gCode.join('\n'), { flag: 'w' })
}