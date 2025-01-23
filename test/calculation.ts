import { DataDirectory } from "@/global"
import { Project, Thread } from "@/model"
import { File } from "@/tools/file.back"
import { JimpHelper } from "@/tools/imaging/jimpHelper"
import { Jimp } from "jimp"
import { join } from "node:path"

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const projectFilePath: string = join(DataDirectory, 'project/0b0bed28-e497-4590-a02d-5d5385257696/project.json')
    const project: Project = await File.readJSON<Project>(projectFilePath)
    const thread: Thread = project.threads[0]

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