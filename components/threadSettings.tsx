'use client'

import { ColorOptions, ImageInfo, LuminosityOptions, Thread } from "@/model"
import { Button, Card, CardContent, CardHeader, Grid, Stack, TextField } from "@mui/material"
import { Delete } from "@mui/icons-material"
import ImageSelector from "./imageSelector"
import ColorSettings from "./colorSettings"
import LuminositySettings from "./luminositySettings"
import ImagePreview from "./imagePreview"
import NumericInput from "./numericInput"
import ColorPicker from "./colorPicker"
import { ChangeEvent, Fragment, useEffect, useState } from "react"

interface Options {
    data: Thread
    onChange?: (value: Thread) => void
    onDelete?: (value: Thread) => void
}

export default function ({ data, onChange, onDelete }: Options) {
    const [state, setState] = useState(data)

    useEffect(() => {
        setState(data)
    }, [data])

    const setNewValue = (newValue: Thread) => {
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
        <Fragment>
            <Grid container>
                <Grid item xs={3}>
                    <ImageSelector
                        imageData={data.imageInfo.imageData}
                        onChange={(newValue: ImageInfo) => setNewValue({
                            ...state,
                            imageInfo: newValue
                        })} />
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={2}>
                        <Card>
                            <CardHeader title="Settings" />
                            <CardContent>
                                <Stack>
                                    <Button color="error" onClick={() => onDelete?.(state)}>
                                        <Delete />
                                    </Button>
                                    <ColorPicker
                                        value={state.color}
                                        onChange={(color) => setNewValue({
                                            ...state,
                                            color: color
                                        })} />
                                    <TextField
                                        label="Description"
                                        variant="standard"
                                        value={state.description}
                                        onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(event.target.value, "description")} />
                                    <NumericInput
                                        value={state.maxStep}
                                        label="Max Step"
                                        onChange={v => handleChange(v, 'maxStep')}
                                        type='integer'
                                        min={1}
                                    />
                                    <NumericInput
                                        value={state.calculationThickness}
                                        label="thickness"
                                        onChange={v => handleChange(v, 'calculationThickness')}
                                    /></Stack>
                            </CardContent>
                        </Card>
                        <ColorSettings
                            colorOptions={data.colorOptions}
                            onChange={(newValue: ColorOptions) => setNewValue({
                                ...state,
                                colorOptions: newValue
                            })} />
                        <LuminositySettings
                            luminosityOptions={data.luminosityOptions}
                            onChange={(newValue: LuminosityOptions) => setNewValue({
                                ...state,
                                luminosityOptions: newValue
                            })} />
                    </Stack>
                </Grid>
                <Grid item xs={3}>
                    <ImagePreview
                        imageData={state.imageInfo.imageData}
                        colorOptions={state.colorOptions}
                        luminosityOptions={state.luminosityOptions}
                    />
                </Grid>
            </Grid>
        </Fragment>
    )
}