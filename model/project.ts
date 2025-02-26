import { NailMapTransformation } from "./nailMap"

export enum CalculationMethod {
    delta = 'delta',
    mri = 'mri',
}

export enum ContinuityMode {
    continuous = 'continuous',
    discontinuous = 'discontinuous',
}

export type Project = {
    name?: string
    description?: string
}

export type ProjectSettings = {
    frameId: string
    threads: Thread[]
    calculationMethod: CalculationMethod
}

export type ProjectVersionInfo = {
    date: Date,
    version: string,
    rating?: number,
}

export type Thread = {
    color: string
    previewThickness: number
    maxStep: number
    calculationThickness: number
    imageData: string
    imageTransformation: NailMapTransformation
    colorOptions: ColorOptions
    luminosityOptions: LuminosityOptions
    description?: string
    continuityMode?: ContinuityMode
}

export type LuminosityOptions = {
    isEnabled: boolean
    brightness: number // [0; 2]
    contrast: number // [0; 2]
}

export type ColorOptions = {
    isEnabled: boolean
    colorMatrix: Array<Array<number>>
}

export namespace ProjectHelper {

    export function defaultSettings(): ProjectSettings {
        return {
            frameId: '',
            threads: [],
            calculationMethod: CalculationMethod.delta,
        }
    }

    export function defaultThread(): Thread {
        return {
            color: "#000000",
            previewThickness: 0.1,
            maxStep: 4000,
            calculationThickness: 0.1,
            imageData: '',
            imageTransformation: {
                scale: 1,
                angle: 0,
                position: {
                    x: 0,
                    y: 0,
                }
            },
            colorOptions: defaultColorOptions(),
            luminosityOptions: defaultLuminosityOptions(),
            description: "Black thread",
        }
    }

    export function defaultColorOptions(): ColorOptions {
        return {
            isEnabled: false,
            colorMatrix: [
                [0.30, 0.30, 0.30],
                [0.59, 0.59, 0.59],
                [0.11, 0.11, 0.11],
            ],
        }
    }

    export function defaultLuminosityOptions(): LuminosityOptions {
        return {
            isEnabled: false,
            brightness: 1,// [0; 2]
            contrast: 0, // [0; 2]
        }
    }
}