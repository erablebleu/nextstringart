'use client'

import { Fragment } from "react"
import ImagePreview from "./imagePreview"

interface IOptions {
    imageData?: string
    onChange?: (v: string) => void
}

export default function ({ imageData, onChange }: IOptions) {

    const readFile = async (e: any) => {
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e) => {
            const data = e.target?.result as string            
            const image = new Image()
            image.src = data
            await image.decode()
            onChange?.(data)
        }
        reader.readAsDataURL(e.target.files[0])
    }

    return (
        <Fragment>
            <ImagePreview imageData={imageData} />
            <input type="file" accept=".png,.bmp,.jpg,.jpeg" onChange={(e) => readFile(e)} />
        </Fragment>
    )
}