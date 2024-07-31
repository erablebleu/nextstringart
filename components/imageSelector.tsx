import React from "react";
import ImagePreview from "./imagePreview";
import { IImageInfo } from "@/model/project";

interface IOptions {
    imageData?: string
    onChange?: (v: IImageInfo) => void
}

export default function ({ imageData, onChange }: IOptions) {

    const readFile = async (e: any) => {
        console.log("read file")
        e.preventDefault()
        const reader = new FileReader()
        reader.onload = async (e) => {
            const data = e.target?.result as string            
            const image = new Image()
            image.src = data
            await image.decode()
            onChange?.({
                imageData: data,
                width: image.width,
                height: image.height,
            })
        }
        reader.readAsDataURL(e.target.files[0])
    }

    return (
        <React.Fragment>
            {imageData && <ImagePreview imageData={imageData} />}
            <input type="file" accept=".png,.bmp,.jpg,.jpeg" onChange={(e) => readFile(e)} />
        </React.Fragment>
    )
}