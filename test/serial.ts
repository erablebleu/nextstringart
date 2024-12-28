
import { NailMap } from '@/model/nailMap'
import { Await } from '../tools/await'
import { SerialMachine } from '../tools/machine/serial'
import { DefaultFrame } from '@/model/frame'
import { GCodeGenrator } from '@/tools/machine/gcode/generator'
import { MachineSettings } from '@/tools/machine/settings'
import { RotationDirection } from '@/enums/rotationDirection'

run()

async function run() {
    const machineSettings: MachineSettings = {
        xLength: 400,
        x0Radius: 500,
        zLow: 2,
        zHigh: 0,
    }

    const nailMap = NailMap.fromPolygon(DefaultFrame())
    const gcode: Array<string> = GCodeGenrator.generate({
        map: nailMap.nails,
        steps: nailMap.nails.map((n, idx) => ({ nailIndex: idx, direction: RotationDirection.ClockWise}))
    }, machineSettings)

    const machine = new SerialMachine({
        path: '/dev/ttyUSB0',
        baudRate: 250000,
    })

    await machine.connect()

    await machine.write('G28')
    await machine.write('G91')
    await machine.write('G0 Y 20')

    while (true) {
        let data: string | undefined
        let idx: number = 0

        while(machine.bufferSize < 50 && idx < gcode.length)
            await machine.write(gcode[idx++])

        await Await.delay(50)
    }
}