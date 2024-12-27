
/* Machine description
 * X translation
 *   0 = outside ring
 *   400mm = closer to rotation center
 * X rotation
 *   3200 steps per motor rotation (80 steps per unit)
 *   2 stages of 80x20 reduction
 *   => 51200 steps per axis rotation
 *   => 640 units per axis rotation
 * Z Translation
 *   0: up
 *   2: down 
 */

/* GCode infos
 *
 * home: G28 Z
 * relative positioning: G91
 *
 */

export type MachineSettings = {
    xLength: number
    x0Radius: number
    zLow: number
    zHigh: number
}

export class GCodeGenrator {

    public static Generate(machineSettings: MachineSettings): string[] {
        const result: Array<string> = []

        return result
    }
}