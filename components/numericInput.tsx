import { SxProps, TextField, Theme } from "@mui/material"
import { ChangeEvent, forwardRef } from "react"

interface Options {
    value: number
    label?: string
    disabled?: boolean
    min?: number
    max?: number
    onChange: (newValue: number) => void
    type?: 'integer' | 'float'
    hideButtons?: boolean
    sx?: SxProps<Theme>
    slotProps?: any
}

export default function ({ value, onChange, label, disabled, min, max, type, hideButtons, sx, slotProps }: Options) {

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const string = event.target.value

        if (!string)
            return

        let result: number

        switch (type) {

            case 'integer':
                result = Number.parseInt(string)
                break

            case undefined:
            case 'float':
            default:
                result = Number.parseFloat(string)
                break
        }

        if (min !== undefined && result < min)
            result = min

        if (max !== undefined && result > max)
            result = max

        console.log({
            string,
            min, max, result
        })
        onChange?.(result)
    };

    return (
        <TextField
            size="small"
            value={value}
            onChange={handleChange}
            label={label}
            disabled={disabled}
            type="number"
            slotProps={{
                ...slotProps,
                inputLabel: {
                    shrink: true,
                },
            }}
            variant="outlined"
            sx={{
                ...sx,
                ...hideButtons && {
                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                        display: 'none'
                    },
                    '& input[type=number]': {
                        MozAppearance: 'textfield'
                    },
                }
            }}
        />
    )
}