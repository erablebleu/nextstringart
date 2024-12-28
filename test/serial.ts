
import { NailMap } from '@/model/nailMap'
import fs from 'node:fs';
import { join } from 'path';
import { Await } from '../tools/await'
import { SerialMachine } from '../tools/machine/serial'
import { DefaultFrame } from '@/model/frame'
import { GCodeGenrator } from '@/tools/machine/gcode/generator'
import { MachineSettings } from '@/tools/machine/settings'
import { RotationDirection } from '@/enums/rotationDirection'
import { Polar } from '@/tools/geometry/polar';

const outDirectory = join(__dirname, 'out')

run()

async function run() {
    const machineSettings: MachineSettings = {
        xLength: 400,
        x0Radius: 470,
        zLow: 2,
        zHigh: 0,
    }

    const nailMap = NailMap.fromPolygon({
        nailCount: 360,
        nailDiameter: 1.8,
        edgeCount: 6,
        excludeVertex: false,
        diameter: 700
    })
    
    if (!fs.existsSync(outDirectory))
        fs.mkdirSync(outDirectory)

    fs.writeFileSync(join(outDirectory, 'nailmap.json'), JSON.stringify(nailMap, null, 2), { flag: 'w' })
    fs.writeFileSync(join(outDirectory, 'nailmap.csv'),
        nailMap.nails.map(x => ({ ...x, polar: Polar.fromCardinal(x.position)}))
        .map(x => `${x.position.x},${x.position.y},${x.polar.a},${x.polar.r}`).join('\r\n'),
        { flag: 'w' })

    const gcode: Array<string> = GCodeGenrator.generate({
        map: nailMap.nails,
        steps: [
            ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })),
             ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })),
             ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })).reverse(),
             ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })).reverse(),
        ]
    }, machineSettings)

    fs.writeFileSync(join(outDirectory, 'serial.gcode'), gcode.join('\n'), { flag: 'w' })

    const machine = new SerialMachine({
        path: '/dev/ttyUSB0',
        baudRate: 250000,
    })

    await machine.connect()

    let idx: number = 0
    
    while (true) {
        let data: string | undefined

        while (machine.bufferSize < 5 && idx < gcode.length)
            await machine.write(gcode[idx++])

        await Await.delay(50)
    }

}