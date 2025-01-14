import { Project } from "@/model";
import { FileRepository } from "@/tools/fileRepository";
import { InstructionsRepository } from "./instructionsRepository";
import { join } from "node:path";

export class ProjectRepository extends FileRepository<Project> {
    private instructionsRepositories = new Map<string, InstructionsRepository>

    constructor(directory: string) {
        super(directory, 'project.json')
    }

    public getInstructionsRepository(id: string): InstructionsRepository {
        let result: InstructionsRepository | undefined = this.instructionsRepositories.get(id)

        if (!result) {
            result = new InstructionsRepository(join(this.directory, id, 'instructions'))
            this.instructionsRepositories.set(id, result)
        }

        return result
    }
}