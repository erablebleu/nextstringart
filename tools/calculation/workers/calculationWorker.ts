import { Frame, Instructions, NailMap, NailMapHelper, ProjectSettings, Thread } from "@/model"
import { frameRepository } from "@/tools/api"
import { JimpHelper } from "@/tools/imaging/jimpHelper"

export type CalculationWorkerInfo = {
    threadIndex: number
    threadCount: number
    stepIndex: number
    stepCount: number
    startedAt: Date
    progress: number
}

export abstract class CalculationWorker {
    protected readonly projectSettings: ProjectSettings
    protected canceled: boolean = false
    protected threadIndex: number = 0
    protected stepIndex: number = 0
    protected readonly threadCount: number = 0
    protected stepCount: number = 0
    protected startedAt: Date = new Date()


    public getProgress = () => Math.min(1, this.threadIndex / this.threadCount + (this.stepIndex / this.stepCount / this.threadCount))

    constructor(projectSettings: ProjectSettings) {
        this.projectSettings = projectSettings
        this.threadCount = projectSettings.threads.length
    }

    public cancel() {
        this.canceled = true
    }

    public getInfo(): CalculationWorkerInfo {
        return {
            threadIndex: this.threadIndex,
            threadCount: this.threadCount,
            stepIndex: this.stepIndex,
            stepCount: this.stepCount,
            progress: this.getProgress(),
            startedAt: this.startedAt,
        }
    }

    public async run(): Promise<Instructions> {
        this.startedAt = new Date()
        const frame: Frame = await frameRepository.read(this.projectSettings.frameId)
        const nailMap: NailMap = NailMapHelper.get(frame)
        const imageDatas: Array<Uint8Array<ArrayBuffer>> = await Promise.all(this.projectSettings.threads
            .map((thread: Thread) => JimpHelper.getImageData(thread)))

        return await this.internalRun(nailMap, imageDatas)
    }

    protected abstract internalRun(nailMap: NailMap, imageDatas: Array<Uint8Array<ArrayBuffer>>): Promise<Instructions>
}