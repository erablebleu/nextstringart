export enum MachineJobStatus {
    Pending,
    Running,
    Paused,
    Error,
    Canceled,
    Finished,
}

export enum MachineStatus {
    Disconnected,
    Connected,
    Error,
}

export type MachineJobInfo = {
    name?: string
    status: MachineJobStatus
    commandIndex: number
    commandCount: number
}

export type MachineInfo = {
    tx: number
    tz: number
    rz: number
    status: MachineStatus
    waitingJobs: number
    job?: MachineJobInfo
}