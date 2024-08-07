import { ColorOptions, IImageInfo, LuminosityOptions, Thread } from "@/model/project";
import React from "react";
import { Button, Card, CardContent, CardHeader, Grid, Stack, TextField } from "@mui/material";
import { ImageFilter } from "@/tools/imaging/ImageFilter";
import { Delete } from "@mui/icons-material";
import ImageSelector from "./imageSelector";
import ColorSettings from "./colorSettings";
import LuminositySettings from "./luminositySettings";
import ImagePreview from "./imagePreview";
import NumericInput from "./numericInput";
import ColorPicker from "./colorPicker";

interface Options {
    data: Thread
    onChange?: (value: Thread) => void
    onDelete?: (value: Thread) => void
    onImageChange?: (data: Uint8ClampedArray) => void
}

export default function ({ data, onChange, onDelete, onImageChange }: Options) {
    const [state, setState] = React.useState(data)

    React.useEffect(() => {
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
        <React.Fragment>
            <Grid container>
                <Grid item xs={3}>
                    <ImageSelector
                        imageData={data.imageInfo.imageData}
                        onChange={(newValue: IImageInfo) => setNewValue({
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
                                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleChange(event.target.value, "description")} />
                                    <NumericInput
                                        value={state.maxStep}
                                        label="Max Step"
                                        propertyName="maxStep"
                                        onChange={handleChange} />
                                    <NumericInput
                                        value={state.calculationThickness}
                                        label="thickness"
                                        propertyName="calculationThickness"
                                        onChange={handleChange} /></Stack>
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
                        filter={state.luminosityOptions.isEnabled ? `brightness(${state.luminosityOptions.brightness}) contrast(${state.luminosityOptions.contrast})` : undefined}
                        filterFunc={state.colorOptions.isEnabled ? (d) => ImageFilter.RGB(d, state.colorOptions.colorMatrix) : undefined}
                        onChange={(data: Uint8ClampedArray) => onImageChange?.(data)}
                    />
                </Grid>
            </Grid>
        </React.Fragment>
    )
}