'use client'

import { ReactNode, use } from "react"
import { IdParameters } from "@/app/parameters";
import { Box, Divider, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import ProjectVersionList from "@/components/projectVersionList";
import { useRouter } from "next/navigation";

export default function ({ children, params }: { children: ReactNode, params: Promise<IdParameters> }) {
    const { id: projectId} = use(params)
    const router = useRouter()

    return (
        <Box
            height='100%'
            display='flex'
            flexDirection='row'>
            <Box
                height='100%'
                display='flex'
                flexDirection='column'>
                <List>
                    <ListItem disablePadding>
                        <ListItemButton
                            onClick={() => router.push(`/project/${projectId}/raw`)}>
                            <ListItemText primary="project settings" />
                        </ListItemButton>
                    </ListItem>
                </List>
                <Divider/>
                <ProjectVersionList
                    projectId={projectId}
                >
                </ProjectVersionList>
            </Box >
            <Box
                height='100%'
                flexGrow={1}
                display='flex'
                flexDirection='column'>
                {children}
            </Box>
        </Box >
    )
}
