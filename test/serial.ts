
import { Await } from '../tools/await'
import { SerialMachine } from '../tools/machine/serial'

run()

async function run() {

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

        do{
            data = await machine.read()
            if(!data)
                break

            console.log(data)
        }
        while(data)


        await Await.delay(500)
    }

}