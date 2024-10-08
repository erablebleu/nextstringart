import { IInstructions, INail, IStep } from "@/model/instructions";
import { Box, Button, FormControl, IconButton, Stack, TextField } from "@mui/material";
import { ChevronLeft, ChevronRight, FirstPage, LastPage, OpenInBrowser, Upload } from "@mui/icons-material";
import React from "react";
import { RotationDirection } from "@/enums/rotationDirection";
import { IVector2D, Vector2D } from "@/tools/geometry/Vector2D";
import { IPoint2D, Point2D } from "@/tools/geometry/Point2D";
import useLocalStorage from "@/hooks/useLocalStorage";
import { ILine2D, Line2D } from "@/tools/geometry/Line2D";
import { NumericFormat, NumericFormatProps } from "react-number-format";
import { Files } from "@/tools/files";
import { Speech } from "@/tools/speech";

interface CustomProps {
    onChange: (event: { target: { name: string; value: string } }) => void;
    name: string;
}

const NumericFormatCustom = React.forwardRef<NumericFormatProps, CustomProps>(
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

interface IOptions {
    uuid: string
    nails: INail[]
    steps: IStep[]
}

export default function ({ uuid, nails, steps }: IOptions) {
    const [settings, setSettings] = useLocalStorage(`stepper_settings_${uuid}`, {
        step: 0,
        offset: 0,
        thickness: 0.20
    })
    const m = 60
    const minX = Math.min(0, ...nails.map(n => n.position.x - n.diameter / 2)) - m
    const maxX = Math.max(0, ...nails.map(n => n.position.x + n.diameter / 2)) + m
    const minY = Math.min(0, ...nails.map(n => n.position.y - n.diameter / 2)) - m
    const maxY = Math.max(0, ...nails.map(n => n.position.y + n.diameter / 2)) + m

    if (settings.step >= steps.length - 1) {
        settings.step = 0
    }

    const goToStep = async (number: number) => {
        setSettings({
            ...settings,
            step: number
        })
        const instruction: IStep = steps[number + 1]
        Speech.say(`${(settings.offset + instruction.nailIndex) % nails.length}. ${RotationDirection[instruction.direction]}`)
    }
    const first = async () => {
        goToStep(0)
    }
    const prev = async () => {
        goToStep(settings.step - 1)
    }
    const next = async () => {
        goToStep(settings.step + 1)
    }
    const last = async () => {
        goToStep(steps.length - 2)
    }

    const nailIdx: number = steps.length > 1
        ? steps[settings.step + 1].nailIndex
        : 0

    const nail: INail = steps.length > 1
        ? nails[steps[settings.step + 1].nailIndex]
        : {
            diameter: 1.8,
            position: { x: 0, y: 0 }
        }

    if (steps.length > 1) {
        steps[0].direction = RotationDirection.AntiClockWise
    }

    const getPosition = (s: number) => {
        const s1: IStep = steps[s]
        const s2: IStep = steps[s + 1]
        const n1: INail = nails[s1.nailIndex]
        const n2: INail = nails[s2.nailIndex]
        const l: ILine2D = Line2D.getTangeant(n1.position, n1.diameter, s1.direction, n2.position, n2.diameter, s2.direction)
        return {
            x1: l.p0.x,
            y1: l.p0.y,
            x2: l.p1.x,
            y2: l.p1.y,
        }
    }

    const getArrowAngle = (s: number) => {
        const p = getPosition(s)
        return 90 + 180 / Math.PI * Math.atan2(p.y2 - p.y1, p.x2 - p.x1)
    }

    const getTextPosition = () => {
        if (steps.length > 1) {
            return Point2D.add(nail.position, Vector2D.scale(Vector2D.normalize(Point2D.substract(nail.position, { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },)), 20))
        }
        else return {
            x: 100,
            y: 100,
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({
            ...settings,
            [event.target.name]: event.target.value,
        });
    };

    return (
        <React.Fragment>
                <Stack direction='row' spacing={4}>
                    <Stack direction='row'>
                        <IconButton disabled={settings.step == 0} onClick={first}>
                            <FirstPage />
                        </IconButton>
                        <IconButton disabled={settings.step == 0} onClick={prev}>
                            <ChevronLeft />
                        </IconButton>
                        <span>
                            <TextField
                                value={settings.step + 1}
                                onChange={(e) => goToStep(Number.parseInt(e.target.value) - 1)}
                                name="step"
                                id="formatted-numberformat-step"
                                InputProps={{ inputComponent: NumericFormatCustom as any }}
                                variant="standard" />
                            / {steps.length - 1}
                        </span>
                        <IconButton disabled={settings.step == steps.length - 2} onClick={next}>
                            <ChevronRight />
                        </IconButton>
                        <IconButton disabled={settings.step == steps.length - 2} onClick={last}>
                            <LastPage />
                        </IconButton>

                    </Stack>
                    <Stack direction='row' spacing={1}>
                        <TextField
                            value={settings.offset}
                            onChange={handleChange}
                            label="offset"
                            name="offset"
                            id="formatted-numberformat-offset"
                            InputProps={{ inputComponent: NumericFormatCustom as any }}
                            variant="standard" />
                        <TextField
                            value={settings.thickness}
                            onChange={handleChange}
                            label="thickness"
                            name="thickness"
                            id="formatted-numberformat-thickness"
                            InputProps={{ inputComponent: NumericFormatCustom as any }}
                            variant="standard"
                        />
                    </Stack>
                </Stack>

                <Box>
                    {settings.step} {JSON.stringify(nail)}
                </Box>

                <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
                    preserveAspectRatio="xMidYMid meet"
                    width="100%"
                    height='calc(100% - 100px)' >
                    <linearGradient
                        id="gradient_0000" >
                        <stop offset="0" stopColor="#000000" />
                        <stop offset="1" stopColor="#ff0000" />
                    </linearGradient>
                    {
                        Array.from(Array(settings.step).keys()).map((i: number) => (
                            <line
                                key={`line_${i}`}
                                {...getPosition(i)}
                                stroke="black" strokeWidth={settings.thickness} />
                        ))
                    }
                    {
                        steps.length > 0
                        && <g>
                            <text {...getTextPosition()} >{(settings.offset + nailIdx) % nails.length}</text>
                            <linearGradient
                                id="currentLineGradient"
                                xlinkHref="#gradient_0000"
                                gradientUnits="userSpaceOnUse"
                                {...getPosition(settings.step)} />
                            <path
                                fill="red"
                                transform={`translate(${nail.position.x}, ${nail.position.y}) rotate(${getArrowAngle(settings.step)})`}
                                d={
                                    steps[settings.step + 1].direction == RotationDirection.ClockWise
                                        ? "M 0 -16.697266 C -9.203444 -16.697266 -16.697266 -9.203444 -16.697266 0 A 1.7007855 1.7007855 0 0 0 -15 1.6972656 A 1.7007855 1.7007855 0 0 0 -13.302734 0 C -13.302734 -7.3650985 -7.3650985 -13.302734 0 -13.302734 C 5.0059037 -13.302734 9.3464603 -10.555968 11.617188 -6.4863281 C 11.444061 -6.5903516 11.266602 -6.6851953 11.101562 -6.8066406 C 11.051801 -6.842206 10.992725 -6.8622365 10.931641 -6.8652344 C 10.702673 -6.8781604 10.536333 -6.6528318 10.615234 -6.4375 L 14.71875 4.7089844 C 14.821712 4.9861409 15.215399 4.9861409 15.318359 4.7089844 L 19.414062 -6.4375 C 19.5252 -6.7342496 19.183315 -6.9939635 18.927734 -6.8066406 C 17.954342 -6.1080174 16.842903 -5.7144588 15.712891 -5.5917969 C 13.404801 -12.051512 7.2403535 -16.697266 0 -16.697266 z"
                                        : "m 0,-16.697266 c -7.2412369,0 -13.407417,4.646475 -15.714844,11.1074222 -1.128002,-0.1209083 -2.229501,-0.5147211 -3.183594,-1.2167968 -0.04976,-0.035565 -0.108832,-0.055596 -0.169921,-0.058594 -0.228968,-0.012926 -0.395308,0.2124026 -0.316407,0.4277344 l 4.103516,11.1464844 c 0.102962,0.2771565 0.496649,0.2771565 0.599609,0 L -10.585938,-6.4375 c 0.111138,-0.2967496 -0.230747,-0.5564635 -0.486328,-0.3691406 -0.17778,0.1275963 -0.368518,0.2275186 -0.554687,0.3359375 C -9.3587198,-10.549229 -5.0125174,-13.302734 0,-13.302734 7.3650977,-13.302734 13.302734,-7.3650977 13.302734,0 13.30436,0.9370142 14.062986,1.6956404 15,1.6972656 15.937014,1.6956404 16.69564,0.9370142 16.697266,0 16.697266,-9.2034448 9.2034448,-16.697266 0,-16.697266 Z"
                                }
                            />
                            <line
                                {...getPosition(settings.step)}
                                style={{
                                    stroke: "url(#currentLineGradient)",
                                    strokeWidth: 1,
                                }} />
                        </g>
                    }
                    {
                        nails.map((n: INail) => (
                            <ellipse key={`nail_${nails.indexOf(n)}`} cx={n.position.x} cy={n.position.y} rx={n.diameter / 2} ry={n.diameter / 2} fill="#ff0000" />
                        ))
                    }
                </svg>
        </React.Fragment>
    )
}
