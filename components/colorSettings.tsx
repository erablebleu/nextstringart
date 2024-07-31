import { ColorOptions } from "@/model/project";
import { Card, CardContent, CardHeader, Checkbox, FormControlLabel, Stack } from "@mui/material";
import React from "react";
import NumericInput from "./numericInput";

interface Options {
    colorOptions: ColorOptions
    onChange: (newValue: ColorOptions) => void
}

export default function ({ colorOptions, onChange }: Options) {
    const [state, setState] = React.useState(colorOptions)

    React.useEffect(() => {
        setState(colorOptions)
    }, [colorOptions])

    const setNewValue = (newValue: ColorOptions) => {
        setState(newValue)
        onChange?.(newValue)
    }

    return (
        <React.Fragment>
            <Card>
                <CardHeader
                    title="Color settings"
                    action={
                        <Checkbox
                            checked={state.isEnabled}
                            onChange={(event) => setNewValue({
                                ...state,
                                isEnabled: event.target.checked
                            })} />
                    }>
                </CardHeader>
                {state.isEnabled &&
                    <CardContent>
                        {state.colorMatrix.map((l: number[], line: number) => (<Stack key={`matrix_l_${line}`} direction="row">
                            {l.map((value: number, column: number) => (
                                <NumericInput
                                    key={`matrix_${line}_${column}`}
                                    value={value}
                                    disabled={!state.isEnabled}
                                    onChange={(newValue: number) => setNewValue({
                                        ...state,
                                        colorMatrix: state.colorMatrix.map((l0, lIdx) => l0.map((c0, cIdx) => lIdx == line && cIdx == column ? newValue : c0))
                                    })} />
                            ))}
                        </Stack>))}
                    </CardContent>
                }
            </Card>
        </React.Fragment>
    )
}