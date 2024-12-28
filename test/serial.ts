
import { NailMap } from '@/model/nailMap'
import fs from 'node:fs';
import { join } from 'path';
import { Await } from '../tools/await'
import { SerialMachine } from '../tools/machine/serial'
import { DefaultFrame } from '@/model/frame'
import { GCodeGenrator } from '@/tools/machine/gcode/generator'
import { MachineSettings } from '@/tools/machine/settings'
import { RotationDirection } from '@/enums/rotationDirection'

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const machineSettings: MachineSettings = {
        xLength: 400,
        x0Radius: 500,
        zLow: 2,
        zHigh: 0,
    }

    const nailMap = NailMap.fromPolygon(DefaultFrame())

    
    if (!fs.existsSync(outDirectory))
        fs.mkdirSync(outDirectory)

    fs.writeFileSync(join(outDirectory, 'nailmap.json'), JSON.stringify(nailMap, null, 2), { flag: 'w' })

    const gcode: Array<string> = GCodeGenrator.generate({
        map: nailMap.nails,
        steps: nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise }))
    }, machineSettings)

    fs.writeFileSync(join(outDirectory, 'serial.gcode'), gcode.join('\n'), { flag: 'w' })

    const machine = new SerialMachine({
        path: '/dev/ttyUSB0',
        baudRate: 250000,
    })

    await machine.connect()

    while (true) {
        let data: string | undefined
        let idx: number = 0

        while (machine.bufferSize < 50 && idx < gcode.length)
            await machine.write(gcode[idx++])

        await Await.delay(50)
    }

}