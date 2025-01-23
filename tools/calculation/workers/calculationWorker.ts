import { CalculationMethod, Frame, Instructions, NailMap, NailMapHelper, Project, Thread } from "@/model"
import { MriCalculationWorker } from "./mriCalculationWorker"
import { DeltaCalculationWorker } from "./deltaCalculationWorker"
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
    protected readonly project: Project
    protected canceled: boolean = false
    protected threadIndex: number = 0
    protected stepIndex: number = 0
    protected readonly threadCount: number = 0
    protected stepCount: number = 0
    protected startedAt: Date = new Date()


    public getProgress = () => Math.min(1, this.threadIndex / this.threadCount + (this.stepIndex / this.stepCount / this.threadCount))

    constructor(project: Project) {
        this.project = project
        this.threadCount = project.threads.length
    }

    public cancel() {
        this.canceled = true
    }

    public static get(project: Project): CalculationWorker {
        switch (project.calculationMethod) {
            case CalculationMethod.mri: return new MriCalculationWorker(project)
            case CalculationMethod.delta: return new DeltaCalculationWorker(project)
        }
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
        const frame: Frame = await frameRepository.read(this.project.frameId)
        const nailMap: NailMap = NailMapHelper.get(frame)
        const imageDatas: Array<Uint8Array<ArrayBuffer>> = await Promise.all(this.project.threads
            .map((thread: Thread) => JimpHelper.getImageData(thread)))

        return await this.internalRun(nailMap, imageDatas)
    }

    protected abstract internalRun(nailMap: NailMap, imageDatas: Array<Uint8Array<ArrayBuffer>>): Promise<Instructions>
}