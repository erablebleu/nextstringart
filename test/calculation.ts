import fs from 'node:fs';
import { Frame, FrameHelper, Instructions, NailMap, NailMapHelper, Project, ProjectSettings, Thread } from "@/model"
import { Jimp } from "jimp"
import { join } from "node:path"
import { calculator, frameRepository, projectRepository } from "@/global"
import { CalculationJob } from "@/tools/calculation/calculationJob"
import { delta } from '@/tools/calculation/workers/deltaCalculation.worker';
import { CalculationWorkerStartData } from '@/tools/calculation/workers/calculationWorker';
import { ImageInfo, JimpHelper } from '@/tools/imaging/jimpHelper';

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const projectId = 'bc4aedb3-6479-479d-9c2b-d098b4c2b117'
    const projectVersion = '20251201141202755'

    const project: Project = await projectRepository.read(projectId)

    const projectSettings: ProjectSettings = await projectRepository.getSettings(projectId, projectVersion)
    const frame: Frame = await frameRepository.read(projectSettings.frameId)


    const imageData: Buffer = await fs.promises.readFile('D:\\Documents\\Images\\StringArt\\OJP\\o_map.png')
    const image = await Jimp.read(imageData)

    projectSettings.threads[0].heatMapData = await image.getBase64('image/png')

    const nailMap: NailMap = NailMapHelper.get(frame)
    const imageDatas: Array<ImageInfo | null> = await Promise.all(projectSettings.threads
        .map((thread: Thread) => JimpHelper.getImageData(thread.imageData, thread.colorOptions, thread.luminosityOptions)))
    const heatMapDatas: Array<ImageInfo | null> = await Promise.all(projectSettings.threads
        .map((thread: Thread) => JimpHelper.getImageData(thread.heatMapData)))

    const instructions: Instructions = delta({
        project,
        projectSettings,
        nailMap,
        imageDatas,
        heatMapDatas,
    })

    await projectRepository.set(projectId, projectVersion, { instructions })
    console.log(projectVersion)
}