import fs from 'node:fs';
import { Instructions } from "@/model"
import { join } from "node:path"
import { projectRepository, SettingsFilePath } from "@/global"
import { File } from "@/tools/file.back"
import { MachineSettings } from "@/tools/machine/settings"
import { WiringGCodeGenerator, WiringGCodeSettings } from '@/tools/machine/gcode/wiringGenerator';

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const projectId = '51ee426a-c77e-47f9-a2d7-aea2b2564f46'
    const projectVersion = '20250827150056019'
    const instructions: Instructions = await projectRepository.getInstructions(projectId, projectVersion)
    const machineSettings: MachineSettings = await File.readJSON<MachineSettings>(SettingsFilePath)
    
    const gCodeSettings: WiringGCodeSettings = {
        zMove: 15,
        zHigh: 28,
        zLow: 27,
    }
    const gCodeGenerator = new WiringGCodeGenerator(instructions.nails, machineSettings, gCodeSettings)

    gCodeGenerator.addFlatSteps(instructions.steps)
    // gCodeGenerator.testNails(instructions.steps)
    // gCodeGenerator.addSteps(instructions.steps.slice(187))

    const gCode: string[] = gCodeGenerator.generate()

    if (!fs.existsSync(outDirectory))
        await fs.promises.mkdir(outDirectory)

    await fs.promises.writeFile(join(outDirectory, 'threading.gcode'), gCode.join('\n'), { flag: 'w' })
}