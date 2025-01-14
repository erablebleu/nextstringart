'use client'

import { IdParameters } from "@/app/parameters"
import Stepper from "@/components/stepper"
import React from "react"

export default function ({ params }: { params: IdParameters }) {
    const id = params.id

    return (<React.Fragment>
        <Stepper projectId={id} />        
    </React.Fragment>)
}