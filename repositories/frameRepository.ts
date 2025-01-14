import { Frame } from "@/model";
import { FileRepository } from "@/tools/fileRepository";

export class FrameRepository extends FileRepository<Frame> {
    constructor(directory: string) {
        super(directory, 'frame.json')
    }
}