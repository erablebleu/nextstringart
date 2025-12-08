import fs from 'node:fs';
import { Instructions, RotationDirection } from "@/model"
import { join } from "node:path"
import { projectRepository, SettingsFilePath } from "@/global"
import { File } from "@/tools/file.back"
import { MachineSettings } from "@/tools/machine/settings"
import { WiringGCodeGenerator, WiringGCodeSettings } from '@/tools/machine/gcode/wiringGenerator';

const outDirectory = join(__dirname, 'out')

run()

async function run() {


    const projectId = 'ee0b62be-7861-4608-990f-6332954af547'
    const projectVersion = '20251205192843931'

    
    const instructions: Instructions = await projectRepository.getInstructions(projectId, projectVersion)

    instructions.steps = instructions.steps.reverse()
    
    instructions.steps.forEach(s => {
        s.direction = s.direction == RotationDirection.AntiClockWise ? RotationDirection.ClockWise : RotationDirection.AntiClockWise
    })
    
    await projectRepository.set(projectId, projectVersion, { instructions })
    return





    
}