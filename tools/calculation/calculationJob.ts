import { Entity, Frame, Instructions, NailMap, NailMapHelper, Project, ProjectSettings, Thread } from "@/model"
import EventEmitter from "node:events"
import { PromiseWithResolvers } from "../promiseWithResolver"
import { CalculationWokerMessage, CalculationWorkerInfo } from "./workers/calculationWorker"
import { CalculationHelper } from "./workers/calculationHelper"
import { Worker } from "worker_threads"
import { ImageInfo, JimpHelper } from "../imaging/jimpHelper"
import { frameRepository } from "@/global"

export enum CalculationJobStatus {
    Pending,
    Running,
    Error,
    Canceled,
    Finished,
}

export type CalculationJobInfo = CalculationWorkerInfo & {
    id: string
    projectId: string
    status: CalculationJobStatus
    startedAt?: Date
    progress: number
}

export class CalculationJob {
    private readonly _worker: Worker
    private _status: CalculationJobStatus = CalculationJobStatus.Pending
    private readonly _promiseWithResolvers = new PromiseWithResolvers<Instructions>()
    private readonly _project: Project & Entity
    private readonly _projectSettings: ProjectSettings
    private _result: Instructions = {
        nails: [],
        steps: [],
    }
    private _startedAt?: Date
    private _calculationWorkerInfo: CalculationWorkerInfo = {
        threadIndex: 0,
        threadCount: 0,
        stepIndex: 0,
        stepCount: 0,
    }

    public readonly id: string
    public readonly projectId: string
    public readonly projectVersion: string
    public readonly event: EventEmitter = new EventEmitter()

    public getStatus = () => this._status
    public getResult = async () => this._promiseWithResolvers.promise

    constructor(projectId: string, projectVersion: string, project: Project & Entity, projectSettings: ProjectSettings) {
        this.projectId = projectId
        this.projectVersion = projectVersion
        this._project = project
        this._projectSettings = projectSettings

        this.id = crypto.randomUUID()
        this._worker = CalculationHelper.getWorker(projectSettings)
    }

    private setStatus(status: CalculationJobStatus) {
        if (this._status == status)
            return

        this._status = status

        this.event.emit('status', this, this._status)

        switch (status) {
            case CalculationJobStatus.Finished:
                this._promiseWithResolvers.resolve(this._result)
                break

            case CalculationJobStatus.Canceled:
            case CalculationJobStatus.Error:
                this._promiseWithResolvers.reject()
                break
        }
    }

    public async start(): Promise<Instructions> {
        switch (this._status) {
            case CalculationJobStatus.Pending:
                this.setStatus(CalculationJobStatus.Running)
                this.work()
                break
        }

        return this._promiseWithResolvers.promise
    }

    public cancel(): Promise<Instructions> {
        switch (this._status) {
            case CalculationJobStatus.Pending:
            case CalculationJobStatus.Running:
                this._worker.terminate()
                this.setStatus(CalculationJobStatus.Canceled)
                break
        }

        return this._promiseWithResolvers.promise
    }

    public getInfo(): CalculationJobInfo {
        return {
            ...this._calculationWorkerInfo,
            progress: CalculationHelper.getProgress(this._calculationWorkerInfo),
            id: this.id,
            projectId: this.projectId,
            status: this._status,
        }
    }

    private async work(): Promise<void> {
        try {
            this._worker.on('message', (data: CalculationWokerMessage) => {
                if (data.info) {
                    // console.log(`[CalculationJob.${this.projectId}.${this.projectVersion}]: progress received`)
                    this._calculationWorkerInfo = data.info
                }
                if (data.result) {
                    console.log(`[CalculationJob.${this.projectId}.${this.projectVersion}]: result received`)
                    this._result = data.result
                    this._worker.terminate()
                    this.setStatus(CalculationJobStatus.Finished)
                }
            })

            this._worker.on('error', (error) => {
                console.error(error)
                this.setStatus(CalculationJobStatus.Error)
            })

            this._startedAt = new Date()

            const frame: Frame = await frameRepository.read(this._projectSettings.frameId)
            const nailMap: NailMap = NailMapHelper.get(frame)
            const imageDatas: Array<ImageInfo> = await Promise.all(this._projectSettings.threads
                .map((thread: Thread) => JimpHelper.getImageData(thread)))

            this._worker.postMessage({
                project: this._project,
                projectSettings: this._projectSettings,
                nailMap,
                imageDatas,
            })
        }
        catch (e) {
            console.error(e)
            this.setStatus(CalculationJobStatus.Error)
        }
    }
}