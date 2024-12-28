import { MachineSettings } from "./settings"

/* Machine description
 *                 
 *             Xmax        <= X =>          Xmin
 *              │                            │ 
 *              │             ╓── Zmin       │
 *              │           ┌─╨─┐   ^        │
 *              ════════════╡   ╞══ Z ═══════╗
 *                          └─╥─┘   v        ║
 *                            ╙── Zmax       ║
 *     Z                                     ║
 *  rotation                                 ║
 *     │                                     ║ 
 *  ═══╬═════════════════════════════════════╣
 *     │
 *     <────────────── radius ───────────────>
 *
 *
 * 
 * 
 * X translation
 *   0 = outside ring
 *   400mm = closer to X rotation center
 * Z rotation
 *   3200 steps per motor rotation (80 steps per unit)
 *   2 stages of 80x20 reduction
 *   => 51200 steps per axis rotation
 *   => 640 units per axis rotation
 * Z Translation
 *   0: up
 *   2: down 
 */

const Z_MIN = 0
const Z_MAX = 2.8

const X_ROTATION_RATIO = 640 / (2 * Math.PI) // units per rad

export class MachineReferential {
    private _settings: MachineSettings
    private _x_min: number
    private _x_max: number
    private _a: number = 0
    private _x: number = 0
    private _z: number = 0

    constructor(settings: MachineSettings, startOptions: { a?: number, x?: number, z?: number } = {}) {
        this._settings = settings
        this._x_min = settings.x0Radius - settings.xLength
        this._x_max = settings.x0Radius

        this._a = startOptions.a ?? 0
        this._x = startOptions.x ?? settings.x0Radius
        this._z = startOptions.z ?? 0
    }

    public translateZTo(t_z: number): number {
        if (t_z < Z_MIN || t_z > Z_MAX)
            throw Error(`Target is outside of the machine: z=${t_z}, mechanical limits are [${Z_MIN};${Z_MAX}]`)

        const d_z = t_z - this._z // relative positionning
        const m_z = Number(d_z.toFixed(3)) // mechanical coordinate

        this._z += m_z

        return m_z
    }

    public translateXTo(t_x: number): number {
        if (t_x < this._x_min || t_x > this._x_max)
            throw Error(`Target is outside of the machine: x=${t_x}, mechanical limits are [${this._x_min};${this._x_max}]`)

        const d_x = t_x - this._x // relative positionning
        const m_x = Number((-d_x).toFixed(3)) // mechanical coordinate

        this._x += -m_x

        return m_x
    }

    public rotateZTo(t_a: number): number {
        let d_a = t_a - this._a // relative positionning

        // limit d_a to [-PI;PI]
        while (d_a < Math.PI) d_a += 2 * Math.PI
        while (d_a > Math.PI) d_a -= 2 * Math.PI

        const m_a = Number((d_a * X_ROTATION_RATIO).toFixed(3)) // mechanical coordiante

        this._a += m_a / X_ROTATION_RATIO

        return m_a
    }
}