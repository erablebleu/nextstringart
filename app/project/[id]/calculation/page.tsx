'use server'

import { IdParameters } from "@/app/parameters"
import React from "react"
import CalculatorView from "@/components/calculatorView"

export default async function ({ params }: { params: Promise<IdParameters> }) {
    const id = (await params).id

    return (
        <CalculatorView
            projectId={id} >
        </CalculatorView>
    )
}