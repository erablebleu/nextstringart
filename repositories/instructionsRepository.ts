import { Instructions } from "@/model";
import { FileRepository } from "@/tools/fileRepository";

export class InstructionsRepository extends FileRepository<Instructions> {
    constructor(directory: string) {
        super(directory, 'instructions.json')
    }
}