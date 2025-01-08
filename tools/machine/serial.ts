import { SerialPort } from 'serialport'
import { ActivablePromise } from '../activablePromise'

export type SerialSettings = {
    path: string,
    baudRate: number,
    delimiter?: string,
}

export enum MachineStatus {
    Waiting,
    Running,
    Paused,
    Error,
    Finished,
}

export class SerialMachine {
    private _settings: SerialSettings
    private _data: Array<string> = []
    private _port: SerialPort
    private _incommingData: string = ''

    private _lineIndex: number = 0
    private _lineCount: number
    private _commandIndex: number = 0
    private _commandCount: number
    private _commandAck: boolean = false
    private _status: MachineStatus = MachineStatus.Waiting
    private _activablePromise = new ActivablePromise<void>()

    constructor(settings: SerialSettings, data: Array<string>) {
        this._settings = settings
        this._settings.delimiter ??= '\n'
        this._port = new SerialPort({
            ...settings,
            autoOpen: false,
        })

        this._data = [...data] // copy array to protect from outside modification
        this._lineCount = this._data.length
        this._commandCount = this._data.filter(l => !l.startsWith(';')).length
        this._port.on('data', this.onData.bind(this))
    }

    public getLineIndex = () => this._lineIndex
    public getLineCount = () => this._lineCount
    public getCommandIndex = () => this._commandIndex
    public getProgress = () => this._commandIndex / this._commandCount
    public getStatus = () => this._status

    private onData(data: any) {
        this._incommingData += data.toString('ascii')
        const lines = this._incommingData.split(this._settings.delimiter!)

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i]

            console.debug(`onData: ${line}`)
            if (line.startsWith('ok')) {
                this.acknowledgeLine()
                this.sendNextLine()
            }
        }

        this._incommingData = lines[lines.length - 1]
    }

    private acknowledgeLine() {
        console.debug({
            type: 'ack',
            commandIndex: this._commandIndex,
            lineIndex: this._lineIndex
        })
        this._commandAck = true
    }

    private sendNextLine() {
        if (this._status != MachineStatus.Running) return

        if (!this._commandAck) {
            console.warn('Try to send next line but previous one is not acknowledged')
            return
        }

        do {
            if (this._lineIndex == this._lineCount - 1) {
                this.setStatus(MachineStatus.Finished)
                return
            }

            this._lineIndex++

            const line: string = this._data[this._lineIndex]

            // Comment line
            if (line.startsWith(';'))
                continue

            // Command line
            this._commandIndex++
            this._commandAck = false
            console.debug({
                type: 'send',
                line,
                commandIndex: this._commandIndex,
                lineIndex: this._lineIndex
            })
            this._port.write(line + this._settings.delimiter, undefined, err => {
                if (err) {
                    this.setStatus(MachineStatus.Error)
                }
            })
            break
        }
        while (true)
    }

    private setStatus(status: MachineStatus) {
        this._status = status

        switch (status) {
            case MachineStatus.Finished:
                this._activablePromise.resolve()
                break
        }
    }

    public async connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._port.open(err => {
                if (err) {
                    reject(err)
                }
                else {
                    this._port.flush()
                    this._port.write(this._settings.delimiter)
                    
                    resolve()
                }
            })
        })
    }

    public pause() {
        if (this._status != MachineStatus.Running) return

        this.setStatus(MachineStatus.Paused)
    }

    public startOrResume(): Promise<void> {
        switch (this._status) {
            // Start
            case MachineStatus.Waiting:
                this._lineIndex = -1
                this._commandIndex = -1
                this._commandAck = true

            // Resume
            case MachineStatus.Paused:
            case MachineStatus.Error:
                this.setStatus(MachineStatus.Running)
                this.sendNextLine()
                break
        }

        return this._activablePromise.getPromise()
    }
}