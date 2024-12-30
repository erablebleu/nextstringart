import { Polar } from "../geometry/polar"
import { MachineSettings } from "./settings"

/* Machine description
 *                 
 * Xmin          <= X =>          Xmax
 *  │             ┌───┐            │
 *  ╔══════ Zmin ═╡   ╞════════════╡
 *  ║        ^    └─╫─┘
 *  ║        Z      ║
 *  ║        v      │ <= needle
 *  ║       Zmax    │
 *  ║
 *  ║                                    frame
 *  ║      XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
 *  ║<────────────── radius ──────────────>║
 *  ╚══════════════════════════════════════╣
 *                                         │
 *                                         Z 
 *                                      rotation
 * 
 * X translation
 *   0 = outside ring
 *   400mm = closer to X rotation center
 * Z rotation
 *   3200 steps per motor rotation (80 steps per unit)
 *   2 stages of 80x20 reduction
 *   => 51200 steps per axis rotation
 *   => 640 units per axis rotation
 * Z Translation: 
 *   rod crank, 20mm radius
 *   0: up
 *   2: down 
 */

// Mechanical limits
const X_MIN = 0
const X_MAX = 400

const Z_TRANSLATION_MIN = 0
const Z_TRANSLATION_MAX = 4

const Z_TRANSLATION_STEP_PER_UNIT = 400

const Z_ROTATION_RATIO = 640 / (2 * Math.PI) // units per rad

export class MachineReferential {
    private _x_min: number
    private _x_max: number
    private _a: number = 0
    private _x: number = 0
    private _z: number = 0

    constructor(settings: MachineSettings, startOptions: { a?: number, x?: number, z?: number } = {}) {
        this._x_min = settings.radius - X_MAX
        this._x_max = settings.radius

        this._a = startOptions.a ?? 0
        this._x = startOptions.x ?? settings.radius
        this._z = startOptions.z ?? 0
    }

    public translateZTo(t_z: number): number {
        if (t_z < Z_TRANSLATION_MIN || t_z > Z_TRANSLATION_MAX)
            throw Error(`Target is outside of the machine: z=${t_z}, mechanical limits are [${Z_TRANSLATION_MIN};${Z_TRANSLATION_MAX}]`)

        t_z = Math.acos(1 - 2 * t_z / (Z_TRANSLATION_MAX - Z_TRANSLATION_MIN)) * 1600 / Math.PI / Z_TRANSLATION_STEP_PER_UNIT
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
        const d_a = Polar.normalizeAngle(t_a - this._a) // relative positionning
        const m_a = Number((d_a * Z_ROTATION_RATIO).toFixed(3)) // mechanical coordiante

        this._a += m_a / Z_ROTATION_RATIO

        return m_a
    }
}