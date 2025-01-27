'use client'

import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import dynamic from 'next/dynamic';
import { Architecture, Article, Home, PrecisionManufacturing } from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { AppContext } from '@/contexts/appContext';
import { useContext, useState } from 'react';
import Link from 'next/link';

const drawerWidth = 240

const Menu = [
    { title: 'home', icon: <Home />, href: '/' },
    { title: 'frames', icon: <Article />, href: '/frame' },
    { title: 'projects', icon: <Architecture />, href: '/project' },
    { title: 'machine', icon: <PrecisionManufacturing />, href: '/machine/control' },
]


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{ open?: boolean }>(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(1),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    }),
    display: 'flex',
    flexDirection: 'column',
}))

interface AppBarProps extends MuiAppBarProps {
    open?: boolean
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}))

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}))

function MainLayout({ children }) {
    const theme = useTheme()
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const appContext = useContext(AppContext)

    function handleDrawerOpen() {
        setOpen(true)
    }

    function handleDrawerClose() {
        setOpen(false)
    }

    function isSelected(item: { href: string }): boolean {
        return item.href == '/' ? item.href == pathname : pathname.startsWith(item.href)
    }

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        onClick={handleDrawerOpen}
                        edge="start"
                        sx={{ mr: 2, ...(open && { display: 'none' }) }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <IconButton
                        LinkComponent={Link}
                        href='/'>
                        <Home />
                    </IconButton>
                    <Box
                        display='flex'
                        flexDirection='row'
                        flexGrow={1}
                        alignItems='center'>
                        {appContext?.appBar}
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                    },
                }}
                variant="persistent"
                anchor="left"
                open={open}
            >
                <DrawerHeader>
                    <IconButton onClick={handleDrawerClose}>
                        {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                    </IconButton>
                </DrawerHeader>
                <Divider />
                <List>
                    {Menu.map(item => (
                        <ListItem
                            key={item.href}
                            disablePadding>
                            <ListItemButton
                                LinkComponent={Link}
                                href={item.href}
                                selected={isSelected(item)}>
                                <ListItemIcon>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText primary={item.title} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>
            <Main open={open}>
                <DrawerHeader />
                <Box
                    display='flex'
                    flexDirection='column'
                    flexGrow={1}
                    sx={{ overflowY: 'hidden' }}>
                    {children}
                </Box>
            </Main>
        </Box>
    )
}

// export default Layout
export default dynamic(() => Promise.resolve(MainLayout), { ssr: false })