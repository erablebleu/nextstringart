'use server'

import { IdParameters } from "@/app/parameters"
import CalculatorView from "@/components/calculatorView"

export type Parameters = IdParameters & {
    version: string
}

export default async function ({ params }: { params: Promise<Parameters> }) {
    const projectId = (await params).id
    const projectVersion = (await params).version

    return (
        <CalculatorView
            projectId={projectId}
            projectVersion={projectVersion} >
        </CalculatorView>
    )
}