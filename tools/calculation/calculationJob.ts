import { Entity, Instructions, Project, ProjectSettings } from "@/model"
import EventEmitter from "node:events"
import { PromiseWithResolvers } from "../promiseWithResolver"
import { CalculationWorker, CalculationWorkerInfo } from "./workers/calculationWorker"
import { CalculationHelper } from "./workers/calculationHelper"

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
}

export class CalculationJob {
    private readonly _worker: CalculationWorker
    private _status: CalculationJobStatus = CalculationJobStatus.Pending
    private readonly _promiseWithResolvers = new PromiseWithResolvers<Instructions>()
    private _result: Instructions = {
        nails: [],
        steps: [],
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
                this._worker.cancel()
                this.setStatus(CalculationJobStatus.Canceled)
                break
        }

        return this._promiseWithResolvers.promise
    }

    public getInfo(): CalculationJobInfo {
        return {
            ...this._worker.getInfo(),
            id: this.id,
            projectId: this.projectId,
            status: this._status,
        }
    }

    private async work(): Promise<void> {
        try {
            this._result = await this._worker.run()
            this.setStatus(CalculationJobStatus.Finished)
        }
        catch(e) {
            console.error(e)
            this.setStatus(CalculationJobStatus.Error)
        }
    }
}