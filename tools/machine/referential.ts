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

const Z_TRANSLATION_STEP_COUNT = 3200
const Z_TRANSLATION_MIN = 0
const Z_TRANSLATION_MAX = 40

const Z_TRANSLATION_STEP_PER_UNIT = 40

// 3200 steps / tr
// 4 = 80 / 20 pulley ratio
// 4 steps per unit (see marlin/Configuration.h)
const Z_ROTATION_STEP_COUNT = 3200
const Z_ROTATION_PULLEY_RATIO = 4 * 4
const Z_ROTATION_STEPS_PER_UNIT = 16
const Z_ROTATION_UNITS_PER_RAD = Z_ROTATION_STEP_COUNT * Z_ROTATION_PULLEY_RATIO / (Z_ROTATION_STEPS_PER_UNIT * 2 * Math.PI) // units per rad

type AxisTransform = (value: number) => number

type Axis = {
    value: number,
    name: string,
    motorLabel: string,
    minValue?: number,
    maxValue?: number,
    toM: AxisTransform, // to machine coordinate
    toR: AxisTransform, // to ref coordinate
}

export class MachineReferential {
    private readonly _settings: MachineSettings
    private _tx: Axis
    private _tz: Axis
    private _rz: Axis

    constructor(settings: MachineSettings, startOptions: { rz?: number, tx?: number, tz?: number } = {}) {
        this._settings = settings
        this._tx = {
            value: startOptions.tx ?? this._settings.radius,
            name: 'tx',
            motorLabel: 'Y',
            toM: v => this._settings.radius - v,
            toR: v => this._settings.radius - v,
            minValue: this._settings.radius - X_MAX,
            maxValue: this._settings.radius
        }
        this._tz = {
            value: startOptions.tz ?? 0,
            name: 'tz',
            motorLabel: 'Z',
            toM: v => Math.acos(1 - 2 * v / (Z_TRANSLATION_MAX - Z_TRANSLATION_MIN)) * Z_TRANSLATION_STEP_COUNT / 2 / Math.PI / Z_TRANSLATION_STEP_PER_UNIT,
            toR: v => (1 - Math.cos(v / (Z_TRANSLATION_STEP_COUNT / 2 / Math.PI / Z_TRANSLATION_STEP_PER_UNIT))) * (Z_TRANSLATION_MAX - Z_TRANSLATION_MIN) / 2,
            minValue: Z_TRANSLATION_MIN,
            maxValue: Z_TRANSLATION_MAX,
        }
        this._rz = {
            value: startOptions.rz ?? 0,
            name: 'rz',
            motorLabel: 'X',
            toM: v => v * Z_ROTATION_UNITS_PER_RAD,
            toR: v => v / Z_ROTATION_UNITS_PER_RAD,
        }
    }

    public getRZ(): number { return this._rz.value }
    public getTX(): number { return this._tx.value }
    public getTZ(): number { return this._tz.value }
    public homeRZ() { this._rz.value = 0 }
    public homeTX() { this._tx.value = this._settings.radius }
    public homeTZ() { this._tz.value = 0 }

    public translateZ(d_tz: number): number {
        return this.translateZTo(this._tz.value + d_tz)
    }
    public translateZTo(tz: number): number {
        this.validate(this._tz, tz)

        const m_0 = this._tz.toM(this._tz.value)
        const m_1 = this._tz.toM(tz)
        const m_d = Number((m_1 - m_0).toFixed(3))

        this._tz.value = this._tz.toR(m_0 + m_d)

        return m_d
    }

    public translateX(d_tx: number): number {
        return this.translateXTo(this._tx.value + d_tx)
    }
    public translateXTo(tx: number): number {
        this.validate(this._tx, tx)

        const m_0 = this._tx.toM(this._tx.value)
        const m_1 = this._tx.toM(tx)
        const m_d = Number((m_1 - m_0).toFixed(3))

        this._tx.value = this._tx.toR(m_0 + m_d)

        return m_d
    }

    public rotateZ(d_rz: number): number {
        return this.rotateZTo(this._rz.value + d_rz)
    }
    public rotateZTo(rz: number): number {
        this.validate(this._rz, rz)

        const r_d = Polar.normalizeAngle(rz - this._rz.value)
        const m_d = Number(this._rz.toM(r_d).toFixed(3))
        this._rz.value = Polar.normalizeAngle(this._rz.value + this._rz.toR(m_d))

        return m_d
    }

    private validate(axis: Axis, value: number) {
        if (axis.minValue != undefined && value < axis.minValue
            || axis.maxValue != undefined && value > axis.maxValue)
            throw Error(`Axis ${axis.name} (motor ${axis.motorLabel}): target is outside of the machine: ${value}, mechanical limits are [${axis.minValue};${axis.maxValue}]`)
    }
}