export type MachineMoveInstruction = {
    name?: string
    tx?: number | 'home'
    tz?: number | 'home'
    rz?: number | 'home'
}