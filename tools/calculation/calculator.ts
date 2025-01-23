import { Entity, Instructions, Project } from "@/model";
import { projectRepository } from "../api";
import { CalculationJob, CalculationJobStatus } from "./calculationJob";

export class Calculator {
    private readonly _jobs: Array<CalculationJob> = []

    public getJobs = () => this._jobs

    public async enqueueJob(projectId: string): Promise<CalculationJob> {
        const project: Project & Entity = await projectRepository.read(projectId)
        const result = new CalculationJob(project)

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
                const instructionsRepository = projectRepository.getInstructionsRepository(sender.projectId)
                const instructions: Instructions = await sender.getResult()
                await instructionsRepository.create(instructions, sender.id)

            case CalculationJobStatus.Canceled:
                sender?.event.removeAllListeners()
                const idx = this._jobs.indexOf(sender)
                if (idx >= 0)
                    this._jobs.splice(idx, 1)
                break
        }
    }

    public getJob(jobId: string): CalculationJob | undefined {
        return this._jobs.find((x: CalculationJob) => x.id == jobId)
    }
}