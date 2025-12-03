import { Nail } from "@/model"
import { GCodeGenerator, SpeedProfile } from "./generator"
import { MachineSettings } from "../settings"
import { MachineReferential } from "../referential"

export type PointingGCodeSettings = {
    zLow: number
    zHigh: number
    pauseDuration: number
}

const INNER_RING_MARGIN = 100

export class PointingGCodeGenerator extends GCodeGenerator {
    private _gCodeSettings: PointingGCodeSettings

    constructor(map: Nail[], machineSettings: MachineSettings, gCodeSettings: PointingGCodeSettings, referential?: MachineReferential) {
        super(map, machineSettings, referential)
        this._gCodeSettings = gCodeSettings
    }

    public generate(): Array<string> {
        for(let i = 100; i < this.map.length + 1; i++) {
            const nail = this.map[i % this.map.length]
            super.moveToCartesian(nail.position)
            super.pause(this._gCodeSettings.pauseDuration)
            super.setSpeedProfile(SpeedProfile.Slow)
            super.moveToPolar({ z: this._gCodeSettings.zLow })
            super.setSpeedProfile(SpeedProfile.Fast)
            super.moveToPolar({ z: this._gCodeSettings.zHigh })
        }

        return [
            ...this.gCode,
            ...GCodeGenerator.EndGCode,
        ]
    }
}