'use client'

import FrameList from "@/components/frameList"
import ProjectList from "@/components/projectList"
import { Frame, FrameHelper, Project } from "@/model"
import { fetchAndThrow } from "@/tools/fetch"
import { InsertDriveFile } from "@mui/icons-material"
import { Box, Button, ButtonGroup } from "@mui/material"
import { useRouter } from "next/navigation"

export default function () {
    const router = useRouter()

    async function handleCreateFrame() {
        try {
            const item: Frame = FrameHelper.getDefault()

            const response = await fetchAndThrow(`/api/frame`, {
                method: 'POST',
                body: JSON.stringify(item)
            })
            const id = await response.json()

            router.push(`/frame/${id}`)
        }
        catch (e) {
        }
    }

    async function handleCreateProject() {
        try {
            const item: Project = {
                name: 'new project',
            }

            const response = await fetchAndThrow(`/api/project`, {
                method: 'POST',
                body: JSON.stringify(item)
            })
            const id = await response.json()

            router.push(`/project/${id}`)
        }
        catch (e) {
        }
    }

    return (
        <Box
            height='100%'
            display='flex'
            flexDirection='row'>
            <Box
                flexGrow={1}
                display='flex'
                flexDirection='column'>
                <ButtonGroup sx={{ marginBottom: 1 }}>
                    <Button
                        onClick={handleCreateFrame}
                        endIcon={<InsertDriveFile />}>
                        New Frame
                    </Button>
                </ButtonGroup>
                <FrameList />
            </Box>
            <Box
                flexGrow={1}
                display='flex'
                flexDirection='column'>
                <ButtonGroup sx={{ marginBottom: 1 }}>
                    <Button
                        onClick={handleCreateProject}
                        endIcon={<InsertDriveFile />}>
                        New Project
                    </Button>
                </ButtonGroup>
                <ProjectList />
            </Box>
        </Box>
    )
}