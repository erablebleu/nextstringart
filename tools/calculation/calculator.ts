import { Entity, Instructions, Project, ProjectSettings } from "@/model"
import { projectRepository } from "@/global"
import { CalculationJob, CalculationJobStatus } from "./calculationJob"

export class Calculator {
    private readonly _jobs: Array<CalculationJob> = []
    constructor() {
        console.log('[Calculator].constructor')
    }

    public getJobs = () => this._jobs

    public async enqueueJob(projectId: string, projectVersion: string): Promise<CalculationJob> {
        const project: Project & Entity = await projectRepository.read(projectId)
        const projectSettings: ProjectSettings = await projectRepository.getSettings(projectId, projectVersion)

        const result = new CalculationJob(projectId, projectVersion, project, projectSettings)

        this._jobs.push(result)
        result.event.addListener('status', this.onJobStatusChanged.bind(this))
        result.start()

        return result
    }

    private async onJobStatusChanged(sender: CalculationJob, status: CalculationJobStatus) {
        switch (status) {
            case CalculationJobStatus.Running:
                break

            case CalculationJobStatus.Finished:
                const instructions: Instructions = await sender.getResult()
                await projectRepository.set(sender.projectId, sender.projectVersion, { instructions })

            case CalculationJobStatus.Canceled:
                sender?.event.removeAllListeners()
                const idx = this._jobs.indexOf(sender)
                if (idx >= 0)
                    this._jobs.splice(idx, 1)
                break
        }
    }

    public getJob({ jobId, projectId, projectVersion }: { jobId?: string, projectId?: string, projectVersion?: string }): CalculationJob | undefined {
        if (jobId)
            return this._jobs.find((x: CalculationJob) => x.id == jobId)
        else
            return this._jobs.find((x: CalculationJob) => x.projectId == projectId && x.projectVersion == projectVersion)
    }
}