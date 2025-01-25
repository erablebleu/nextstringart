'use client'

import { Box } from "@mui/material"
import { Fragment, useState } from "react"
import { SketchPicker } from 'react-color'

interface Options {
    value: string
    onChange: (newValue: string) => void
}

export default function ({ value, onChange }: Options) {
    const [state, setState] = useState({ displayColorPicker: false })

    const handleClick = () => {
        setState({
            displayColorPicker: !state.displayColorPicker
        })
    };

    const handleClose = () => {
        setState({
            displayColorPicker: false
        })
    };

    const handleChange = (color) => {
        onChange(color.hex)
    };

    return (
        <Fragment>
            <Box sx={{ display: 'inline-block', cursor: 'pointer' }}>
                <Box onClick={handleClick}
                    sx={{ width: '30px', height: '30px', background: value, borderRadius: '2px' }} />
            </Box>
            {
                state.displayColorPicker &&
                <Box sx={{ position: 'absolute', zIndex: 2 }}>

                    <Box onClick={handleClose}
                        sx={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }} />

                    <SketchPicker
                        color={value}
                        onChange={handleChange} />
                </Box>
            }
        </Fragment>
    )
}