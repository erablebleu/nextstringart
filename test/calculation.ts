import { Instructions, Project, ProjectSettings, Thread } from "@/model"
import { JimpHelper } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { join } from "node:path"
import { projectRepository } from "@/global"

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const projectId = '0b0bed28-e497-4590-a02d-5d5385257696'
    const projectVersion = '20250124134500000'
    const project: Project = await projectRepository.read(projectId)

    const projectSettings: ProjectSettings = await projectRepository.getSettings(projectId, projectVersion)
    const instructions: Instructions = await projectRepository.getInstructions(projectId, projectVersion)

    const thread: Thread = projectSettings.threads[0]

    const image = await Jimp.read(thread.imageInfo.imageData)

    console.log(thread.colorOptions)
    console.log(thread.luminosityOptions)

    JimpHelper.applyOptions(image, thread.colorOptions, thread.luminosityOptions)

    const imageData = Uint8Array.from(image.bitmap.data) // data rgba
    console.log(image.bitmap.width)
    console.log(image.bitmap.height)
    console.log(imageData.length)


    // @ts-ignore: invalid type
    await image.write(join(outDirectory, 'test-small.jpg'))
}