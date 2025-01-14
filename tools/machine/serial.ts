import { SerialPort } from 'serialport'
import { MachineInfo, MachineJobInfo, MachineJobStatus, MachineStatus } from './machineInfo'
import { MachineSettings } from './settings'
import { MachineMoveInstruction } from './machineMoveInstruction'
import { EventEmitter } from 'stream'
import { PromiseWithResolvers } from '../promiseWithResolver'
import { GCodeGenerator } from './gcode/generator'

export class SerialMachine {
    private _settings?: MachineSettings
    private _port?: SerialPort
    private _incommingData: string = ''
    private _jobQueue: Array<MachineJob> = []

    private _status: MachineStatus = MachineStatus.Disconnected
    private _currentJob?: MachineJob

    public getCurrentJob = () => this._currentJob

    private onData(data: any) {
        this._incommingData += data.toString('ascii')
        const lines = this._incommingData.split(this._settings!.delimiter!)

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i]

            console.debug(`onData: ${line}`)
            if (line.startsWith('ok')) {
                this._currentJob?.acknowledgeLine()
                this.sendNextLine()
            }
        }

        this._incommingData = lines[lines.length - 1]
    }

    private sendNextLine() {
        if (!this._currentJob)
            return

        const line: string | undefined = this._currentJob?.getNextLine()

        if (!line)
            return

        this._port!.write(line + this._settings!.delimiter, undefined, err => {
            if (err) {
                this.setStatus(MachineStatus.Error)
            }
        })
    }

    private setStatus(status: MachineStatus) {
        this._status = status
    }

    public async connect(settings?: MachineSettings): Promise<void> {
        if (settings) {
            this._port?.off('data', this.onData.bind(this))

            this._settings = settings
            this._settings.delimiter ??= '\n'
            this._port = new SerialPort({
                ...settings,
                autoOpen: false,
            })

            this._port.on('data', this.onData.bind(this))
        }

        if (!this._port || !this._settings)
            throw new Error('Settings must be initialized')

        this._incommingData = ''

        return new Promise((resolve, reject) => {
            this._port!.open(err => {
                if (err) {
                    reject(err)
                }
                else {
                    this._port!.flush()
                    this._port!.write(this._settings!.delimiter)
                    this.setStatus(MachineStatus.Connected)

                    resolve()
                }
            })
        })
    }

    public async disconnect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this._port!.close(err => {
                if (err) {
                    reject(err)
                }
                else {
                    this._port = undefined
                    this.setStatus(MachineStatus.Disconnected)

                    resolve()
                }
            })
        })
    }

    public enqueueJob(data: Array<string>, options?: MachineJobOptions): MachineJob {
        const job = new MachineJob(data, options)
        this._jobQueue.push(job)

        this.tryStartJob()

        return job
    }

    private tryStartJob() {
        if (!this._port
            || this._currentJob
            || this._jobQueue.length <= 0)
            return

        const job: MachineJob = this._jobQueue[0]
        this._jobQueue.splice(0, 1)
        this._currentJob = job

        if (!job.autoStart)
            return

        this._currentJob.event.addListener('status', this.onJobStatusChanged.bind(this))
        this._currentJob.startOrResume()
    }

    private onJobStatusChanged(sender: MachineJob, status: MachineJobStatus) {
        if (sender != this._currentJob)
            return

        switch (status) {
            case MachineJobStatus.Running:
                this.sendNextLine()
                break

            case MachineJobStatus.Finished:
            case MachineJobStatus.Canceled:
                this._currentJob?.event.removeAllListeners()
                this._currentJob = undefined
                this.tryStartJob()
                break
        }
    }

    public getInfo(): MachineInfo {
        return {
            tx: 0,
            tz: 0,
            rz: 0,
            status: this._status,
            waitingJobs: this._jobQueue.length,
            job: this._currentJob?.getInfo(),
        }
    }

    public async move(instruction: MachineMoveInstruction) {
        const result: Array<string> = []

        const isHome = (value?: number | 'home') => {
            return value === 'home'
        }

        const getMove = (value?: number | 'home') => {
            return value === 'home'
        }

        const home = {
            x: isHome(instruction.rz),
            y: isHome(instruction.tx),
            z: isHome(instruction.tz),
        }

        const move = {
            x: getMove(instruction.rz),
            y: getMove(instruction.rz),
            z: getMove(instruction.rz),
        }

        if (home.x || home.y || home.z)
            result.push('G28'
                + (home.x ? ' X' : '')
                + (home.y ? ' Y' : '')
                + (home.z ? ' Z' : '')
            )

        if (move.x || move.y || move.z)
            result.push('G0'
                + (move.x ? `X${move.x}` : '')
                + (move.y ? `Y${move.y}` : '')
                + (move.z ? `Z${move.z}` : '')
            )

        this.enqueueJob(result, { autoStart: true, name: instruction.name })
    }

    public pauseJob() {
        this._currentJob?.pause()
    }

    public async startOrResumeJob(): Promise<void> {
        await this._currentJob?.startOrResume()
    }

    public async cancelJob() {
        this._currentJob?.cancel()
    }
}

export type MachineJobOptions = {
    autoStart?: boolean
    name?: string
}

export class MachineJob {
    private readonly _data: Array<string> = []
    private _lineIndex: number = 0
    private _lineCount: number
    private _commandIndex: number = 0
    private _commandCount: number
    private _promiseWithResolvers = new PromiseWithResolvers<void>()
    private _status: MachineJobStatus = MachineJobStatus.Pending
    private _commandAck: boolean = false

    public readonly autoStart?: boolean
    public readonly name?: string
    public readonly event: EventEmitter = new EventEmitter()

    constructor(data: Array<string>, options?: MachineJobOptions) {
        this._data = [...data]
        this.autoStart = options?.autoStart
        this.name = options?.name
        this._lineCount = this._data.length
        this._commandCount = this._data.filter(l => !l.startsWith(';')).length
    }

    public getLineIndex = () => this._lineIndex
    public getLineCount = () => this._lineCount
    public getCommandIndex = () => this._commandIndex
    public getProgress = () => this._commandIndex / this._commandCount
    public getStatus = () => this._status

    private setStatus(status: MachineJobStatus) {
        if (this._status == status)
            return

        this._status = status

        this.event.emit('status', this, this._status)

        switch (status) {
            case MachineJobStatus.Finished:
                this._promiseWithResolvers.resolve()
                break
        }
    }

    public acknowledgeLine() {
        console.debug({
            type: 'ack',
            commandIndex: this._commandIndex,
            lineIndex: this._lineIndex
        })
        this._commandAck = true
    }

    public getNextLine(): string | undefined {
        if (this._status != MachineJobStatus.Running) return

        if (!this._commandAck) {
            console.warn('Try to send next line but previous one is not acknowledged')
            return
        }

        do {
            if (this._lineIndex == this._lineCount - 1) {
                this.setStatus(MachineJobStatus.Finished)
                return
            }

            this._lineIndex++

            const line: string = this._data[this._lineIndex]

            // Comment line
            if (GCodeGenerator.CommentRegex.test(line)) {
                const md = GCodeGenerator.MetadataRegex.exec(line)

                switch (md?.groups?.key) {
                    case 'command':
                        switch (md.groups.value) {
                            case 'pause':
                                this.setStatus(MachineJobStatus.Finished)
                                break
                        }
                        break

                    case 'step':
                        // todo: manage step metadata
                        break
                }

                continue
            }

            // Command line
            this._commandIndex++
            this._commandAck = false

            return line
        }
        while (true)
    }

    public pause() {
        if (this._status != MachineJobStatus.Running) return

        this.setStatus(MachineJobStatus.Paused)
    }

    public startOrResume(): Promise<void> {
        switch (this._status) {
            // Start
            case MachineJobStatus.Pending:
                this._lineIndex = -1
                this._commandIndex = -1
                this._commandAck = true

            // Resume
            case MachineJobStatus.Paused:
            case MachineJobStatus.Error:
                this.setStatus(MachineJobStatus.Running)
                break
        }

        return this._promiseWithResolvers.promise
    }

    public cancel() {
        this.setStatus(MachineJobStatus.Canceled)
    }

    public getInfo(): MachineJobInfo {
        return {
            name: this.name,
            status: this._status,
            commandIndex: this._commandIndex,
            commandCount: this._commandCount,
        }
    }
}