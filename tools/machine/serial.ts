import { SerialPort } from 'serialport'

export type SerialSettings = {
    path: string,
    baudRate: number,
    delimiter?: string,
}

export class SerialMachine {
    private _settings: SerialSettings
    private _port: SerialPort
    private _incommingData: string = ''
    private _readData: Array<string> = []

    public bufferSize: number = 0

    constructor(settings: SerialSettings) {
        this._settings = settings
        this._settings.delimiter ??= '\n'
        this._port = new SerialPort({
            ...settings,
            autoOpen: false,
        })

        this._port.on('data', this.onData.bind(this))
    }

    private onData(data: any) {
        this._incommingData += data.toString('ascii')
        const lines = this._incommingData.split(this._settings.delimiter!)

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i]
            this._readData.push(line)

            if (line == 'ok')
                this.bufferSize--

        }

        this._incommingData = lines[lines.length - 1]
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._port.open(err => {
                if (err) reject(err)
                resolve()
            })
        })
    }

    public async write(data: string): Promise<void> {
        console.debug(`write data: ${data}, buffer size: ${this.bufferSize}`)

        return new Promise((resolve, reject) => {
            this._port.write(data + this._settings.delimiter, undefined, err => {
                if (err) reject(err)
                else {
                    this.bufferSize++
                    resolve()
                }
            })
        })
    }

    public async read(): Promise<string | undefined> {
        if (this._readData.length == 0)
            return undefined

        const result = this._readData[0]

        this._readData.splice(0, 1)

        console.debug(`read data: ${result}, buffer size: ${this.bufferSize}`)
        return result
    }
}