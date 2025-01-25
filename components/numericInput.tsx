import { TextField } from "@mui/material"
import { ChangeEvent, forwardRef } from "react"
import { NumericFormat, NumericFormatProps } from "react-number-format"

interface Options {
    value: number
    label?: string
    disabled?: boolean
    propertyName?: string
    onChange: (newValue: number, propertyName: string | undefined) => void
}

interface CustomProps {
    onChange: (event: { target: { name: string; value: string } }) => void;
    name: string;
}

const NumericFormatCustom = forwardRef<NumericFormatProps, CustomProps>(
    function NumericFormatCustom(props, ref) {
        const { onChange, ...other } = props;
        return (
            <NumericFormat
                {...other}
                getInputRef={ref}
                onValueChange={(values) => {
                    onChange({
                        target: {
                            name: props.name,
                            value: values.value,
                        },
                    });
                }}
                valueIsNumericString
            />
        );
    },
);

export default function ({ value, onChange, label, disabled, propertyName }: Options) {

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(Number.parseFloat(event.target.value), propertyName)
    };

    return (
        <TextField
            value={value}
            onChange={handleChange}
            label={label}
            name={label}
            disabled={disabled}
            id="formatted-numberformat-offset"
            InputProps={{ inputComponent: NumericFormatCustom as any }}
            variant="standard" />
    )
}