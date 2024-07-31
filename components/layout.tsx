import { Box, Stack } from '@mui/material'
import ProjectSelector from './projectSelector'


export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Stack direction={'row'} spacing={1} margin={1} sx={{height: '100vh'}}>
            <ProjectSelector/>            
            {children}
        </Stack>
    )
}
