import { Instructions, Project, ProjectSettings, Step, Thread } from "@/model"
import { JimpHelper } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { join } from "node:path"
import { projectRepository } from "@/global"

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const projectId = 'bc4aedb3-6479-479d-9c2b-d098b4c2b117'
    const projectVersion = '20251201105633062'
    
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