import fs from 'node:fs';
import { join } from 'path';
import { MachineJob, SerialMachine } from '../tools/machine/serial'
import { GCodeGenerator } from '@/tools/machine/gcode/generator'
import { MachineSettings } from '@/tools/machine/settings'
import { Polar } from '@/tools/geometry/polar';
import { Await } from '@/tools/await';
import { Step, NailMap, RotationDirection, NailMapHelper, FrameShape } from '@/model';

const outDirectory = join(__dirname, 'out')
const stdin = process.openStdin()

run()

async function run() {
    const machineSettings: MachineSettings = {
        path: '/dev/ttyUSB1', 
        baudRate: 250000,
        radius: 481.5
    }

    // G
    // const nailMap = NailMap.fromPolygon({
    //     nailCount: 294,
    //     nailDiameter: 1.8,
    //     edgeCount: 6,
    //     excludeVertex: true,
    //     diameter: 690
    // })

    const nailMap = NailMapHelper.get({
        shape: FrameShape.polygon,
        nailCount: 384,
        nailDiameter: 1.8,
        edgeCount: 6,
        excludeVertex: false,
        diameter: 910
    })

    if (!fs.existsSync(outDirectory))
        fs.mkdirSync(outDirectory)

    fs.writeFileSync(join(outDirectory, 'nailmap.json'), JSON.stringify(nailMap, null, 2), { flag: 'w' })
    fs.writeFileSync(join(outDirectory, 'nailmap.csv'),
        nailMap.nails.map(x => ({ ...x, polar: Polar.fromCartesian(x.position) }))
            .map(x => `${x.position.x},${x.position.y},${x.polar.a},${x.polar.r}`).join('\r\n'),
        { flag: 'w' })

    const gCodeSettings = {
        zLow: 35,
        zHigh: 20,
    }
    const gCodeGenerator = new GCodeGenerator(nailMap.nails, machineSettings, gCodeSettings)

    const steps: Array<Step> = [
        ...Array.from({length: 100}, (_, index) => ({ 
            nailIndex: (89 + (index * 63)) % 384, 
            direction: RotationDirection.ClockWise 
        }))
        // { nailIndex: 0, direction: RotationDirection.ClockWise },
        // { nailIndex: 64, direction: RotationDirection.ClockWise },
        // { nailIndex: 128, direction: RotationDirection.ClockWise },
        // { nailIndex: 192, direction: RotationDirection.ClockWise },
        // { nailIndex: 256, direction: RotationDirection.ClockWise },
        // { nailIndex: 320, direction: RotationDirection.ClockWise },

        // { nailIndex: 293, direction: RotationDirection.ClockWise },
        // { nailIndex: 182, direction: RotationDirection.AntiClockWise },
        // { nailIndex: 34, direction: RotationDirection.ClockWise },
        // { nailIndex: 289, direction: RotationDirection.ClockWise },
        // { nailIndex: 12, direction: RotationDirection.ClockWise },
        // { nailIndex: 0, direction: RotationDirection.AntiClockWise },
        // { nailIndex: 45, direction: RotationDirection.ClockWise },
        // { nailIndex: 12, direction: RotationDirection.AntiClockWise },
        // { nailIndex: 67, direction: RotationDirection.AntiClockWise },
        // { nailIndex: 8, direction: RotationDirection.ClockWise },
        // { nailIndex: 290, direction: RotationDirection.ClockWise },
        //...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })),
        // ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })),
        // ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })).reverse(),
        // ...nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise })).reverse(),
    ]

    gCodeGenerator.addSteps(steps)

    const gCode: Array<string> = gCodeGenerator.generate()

    fs.writeFileSync(join(outDirectory, 'serial.gcode'), gCode.join('\n'), { flag: 'w' })

    const machine = new SerialMachine()
    const machineJob: MachineJob = machine.enqueueJob(gCode)

    stdin.addListener("data", function (data) {
        switch (data.toString().trim()) {
            case 'p':
                console.log('### Pause')
                machineJob.pause()
                break

            case 's':
            case 'r':
                console.log('### Start/Resume')
                machineJob.startOrResume()
                break

            case 'h':
                console.log('### Home')

        }
    })

    await machine.connect(machineSettings)
    // await Await.delay(2000)
    // machine.startOrResume()
}