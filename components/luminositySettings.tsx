import { LuminosityOptions } from "@/model";
import { Card, CardContent, CardHeader, Checkbox, Grid, Slider } from "@mui/material";
import React from "react";
import NumericInput from "./numericInput";

interface Options {
    luminosityOptions: LuminosityOptions
    onChange: (newValue: LuminosityOptions) => void
}

export default function ({ luminosityOptions, onChange }: Options) {
    const [state, setState] = React.useState(luminosityOptions)

    React.useEffect(() => {
        setState(luminosityOptions)
    }, [luminosityOptions])

    const setNewValue = (newValue: LuminosityOptions) => {
        setState(newValue)
        onChange?.(newValue)
    }

    const handleChange = (newValue: any, propertyName: string | undefined) => {
        setNewValue({
            ...state,
            [propertyName!]: newValue
        })
    }

    return (
        <React.Fragment>
            <Card>
                <CardHeader
                    title="Luminosity settings"
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
                        <Grid container sx={{alignItems: "flex-end"}}>
                            <Grid item xs={4}>
                                <NumericInput label="Brightness"
                                    value={state.brightness}
                                    onChange={handleChange}
                                    propertyName="brightness" />
                            </Grid>
                            <Grid item xs={8}>
                                <Slider min={0} max={3} value={state.brightness}
                                    disabled={!state.isEnabled}
                                    step={0.01}
                                    onChange={(event: Event, newValue: number | number[]) => {
                                        if (Array.isArray(newValue)) {
                                            return;
                                        }
                                        handleChange(newValue, "brightness")
                                    }} />
                            </Grid>
                            <Grid item xs={4}>
                                <NumericInput label="Contrast"
                                    value={state.contrast}
                                    onChange={handleChange}
                                    propertyName="contrast" />
                            </Grid>
                            <Grid item xs={8} >
                                <Slider min={0} max={3} value={state.contrast}
                                    disabled={!state.isEnabled}
                                    step={0.01}
                                    onChange={(event: Event, newValue: number | number[]) => {
                                        if (Array.isArray(newValue)) {
                                            return;
                                        }
                                        handleChange(newValue, "contrast")
                                    }} />
                            </Grid>
                        </Grid>
                    </CardContent>
                }
            </Card>

        </React.Fragment>
    )
}