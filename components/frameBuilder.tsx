'use client'

import { Box, Button, ButtonGroup, Stack, TextField } from "@mui/material"
import { CircleFrame, PolygonFrame } from "@/model"
import { Fragment, useState } from "react"

interface Options {
    onChange: (frame: PolygonFrame | CircleFrame | undefined) => void
}

export default function ({ onChange }: Options) {
    const [canConfirm, setCanConfirm] = useState(false)
    const [state, setState] = useState<{
        step: number,
        shape?: string,
        settings?: string,
    }>({
        step: 0,
    })

    return (
        <Fragment>
            <Box>
                {state.step == 0 && <Fragment>
                    <ButtonGroup>
                        <Button onClick={() => {
                            setCanConfirm(true)
                            setState({
                                step: 1,
                                shape: 'polygon',
                                settings: '\{\n    "nailCount": 360,\n    "nailDiameter": 1.8,\n    "edgeCount": 6,\n    "excludeVertex": false,\n    "diameter": 600\n\}',
                            })
                        }}>
                            Polygon
                            <svg width="100" height="100" viewBox="0 0 258 265">
                                <polygon points="150,15 258,77 258,202 150,265 42,202 42,77" style={{
                                    fill: 'none',
                                    stroke: 'black',
                                    strokeWidth: '5',
                                }} />
                            </svg>
                        </Button>
                    </ButtonGroup>
                </Fragment>}

                {state.step == 1 && <Fragment>

                    <TextField
                        value={state.settings}
                        multiline
                        style={{width: '100%'}}
                        rows={10}
                        onChange={(e) => setState({
                            ...state,
                            settings: e.target.value
                        })} />

                    <ButtonGroup>
                    </ButtonGroup>
                </Fragment>}
            </Box>

            <ButtonGroup>
                {canConfirm && <Button color="success" onClick={() => onChange(JSON.parse(state.settings!))}>Confirm</Button>}
                <Button color="error" onClick={() => onChange(undefined)}>Cancel</Button>
            </ButtonGroup>
        </Fragment>
    )
}