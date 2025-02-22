'use client'

import { ColorOptions, ContinuityMode, LuminosityOptions, Thread } from "@/model"
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material"
import { Delete } from "@mui/icons-material"
import ImageSelector from "./imageSelector"
import ColorSettings from "./colorSettings"
import LuminositySettings from "./luminositySettings"
import ImagePreview from "./imagePreview"
import NumericInput from "./numericInput"
import ColorPicker from "./colorPicker"
import { ChangeEvent, useEffect, useState } from "react"

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
        <Stack
            spacing={1}>
            <Grid container>
                <Grid item xs={3}>
                    <ImageSelector
                        imageData={data.imageData}
                        onChange={(newValue: string) => setNewValue({
                            ...state,
                            imageData: newValue,
                        })} />
                </Grid>
                <Grid item xs={6}>
                    <Stack spacing={1} margin={1}>
                        <Stack
                            display='flex'
                            flexDirection='row'
                            direction='row'
                            spacing={1}>
                            <Box
                                alignContent='center'>
                                <ColorPicker
                                    value={state.color}
                                    onChange={(color) => setNewValue({
                                        ...state,
                                        color: color
                                    })} />
                            </Box>
                            <TextField
                                sx={{
                                    flexGrow: 1
                                }}
                                label="Description"
                                size="small"
                                variant="outlined"
                                value={state.description}
                                onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(event.target.value, "description")} />
                            <Button color="error" onClick={() => onDelete?.(state)}>
                                <Delete />
                            </Button>
                        </Stack>

                        <FormControl fullWidth>
                            <InputLabel
                                id="continuity-mode-label">
                                Continuity mode
                            </InputLabel>
                            <Select
                                labelId="continuity-mode-label"
                                label="Continuity mode"
                                size="small"
                                value={state.continuityMode ?? ContinuityMode.continuous}
                                onChange={(e) => handleChange(e.target.value as ContinuityMode, 'continuityMode')}>
                                    <MenuItem value={ContinuityMode.continuous}>continuous</MenuItem>
                                    <MenuItem value={ContinuityMode.discontinuous}>discontinuous</MenuItem>
                            </Select>
                        </FormControl>


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
                        />
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
                        imageData={state.imageData}
                        colorOptions={state.colorOptions}
                        luminosityOptions={state.luminosityOptions}
                    />
                </Grid>
            </Grid>
        </Stack>
    )
}