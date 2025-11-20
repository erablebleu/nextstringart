import fs from 'node:fs';
import { Frame, Instructions, NailMap, NailMapHelper, Project, ProjectSettings, RotationDirection, Step, Thread } from "@/model"
import { JimpHelper } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { join } from "node:path"
import { projectRepository, frameRepository, machine, SettingsFilePath } from "@/global"
import { File } from "@/tools/file.back"
import { PointingGCodeGenerator, PointingGCodeSettings } from "@/tools/machine/gcode/pointingGenerator"
import { MachineSettings } from "@/tools/machine/settings"
import { WiringGCodeGenerator, WiringGCodeSettings } from '@/tools/machine/gcode/wiringGenerator';

const outDirectory = join(__dirname, 'out')

// linux usb write permission :
// sudo chmod 666 /dev/ttyUSB0

// run()
// calculatePointing()
calculateThreading()

async function run() {
    const projectId = '0b0bed28-e497-4590-a02d-5d5385257696'
    const projectVersion = '20250130085059591'
    const project: Project = await projectRepository.read(projectId)

    const projectSettings: ProjectSettings = await projectRepository.getSettings(projectId, projectVersion)
    const instructions: Instructions = await projectRepository.getInstructions(projectId, projectVersion)

    const thread: Thread = projectSettings.threads[0]

    const image = await Jimp.read(thread.imageData)

    console.log(thread.colorOptions)
    console.log(thread.luminosityOptions)

    JimpHelper.applyOptions(image, thread.colorOptions, thread.luminosityOptions)

    const imageData = Uint8Array.from(image.bitmap.data) // data rgba
    console.log(image.bitmap.width)
    console.log(image.bitmap.height)
    console.log(imageData.length)

    instructions.steps = instructions.steps.filter((step: Step, index: number) => index <= 0 || step.nailIndex != instructions.steps[index - 1].nailIndex)

    await projectRepository.set(projectId, projectVersion, { instructions })


    // @ts-ignore: invalid type
    await image.write(join(outDirectory, 'test-small.jpg'))
}

async function calculatePointing() {
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

async function calculateThreading() {
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