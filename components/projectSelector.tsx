import useProject from "@/hooks/useProject";
import { DefaultFrame } from "@/model/frame";
import { NailMap } from "@/model/nailMap";
import { IProject, Thread } from "@/model/project";
import { Files } from "@/tools/files";
import { Delete, Download, FolderOpen, NoteAdd } from "@mui/icons-material";
import { Box, Button, ButtonGroup, Stack } from "@mui/material";
import { useRouter } from "next/router";
import React from "react";

interface IProjectThumbnail {
    key: string
    uuid: string
}

export default function () {
    const router = useRouter()
    const route = router.route
    const uuid: string = router.query.uuid as string
    const [project, setProject] = useProject(uuid)

    const [state, setState] = React.useState<Array<IProjectThumbnail>>([])

    React.useEffect(() => {
        if (window?.localStorage) {
            setState(Object
                .keys(window.localStorage)
                .filter((key: string) => key?.startsWith('project_'))
                .map((key: string) => ({
                    key,
                    uuid: key.slice(8)
                }))
            )
        }
    }, [])

    const add = async (project: IProject) => {
        const key: string = `project_${project.uuid}`
        window.localStorage.setItem(key, JSON.stringify(project))
        setState(state.concat([{
            key,
            uuid: project.uuid
        }]))
    }

    const create = async () => {
        const project: IProject = {
            threads: [new Thread],
            frame: DefaultFrame(),
            nailMap: NailMap.fromPolygon(DefaultFrame()),
            steps: [],
            uuid: crypto.randomUUID()
        }
        add(project)
        goto(project.uuid)
    }

    const open = async () => {
        const project: IProject = JSON.parse(await Files.open({ accept: '.json' })) as IProject
        project.uuid = crypto.randomUUID()
        add(project)
        goto(project.uuid)
    }

    const goto = (uuid: string) => {
        router.push({ pathname: `/project`, query: { uuid: uuid } }, undefined, { shallow: false })
    }

    return (
        <Stack margin={1} spacing={1}>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                <ButtonGroup>
                    <Button onClick={open}>
                        <FolderOpen />
                    </Button>
                    <Button onClick={create}>
                        <NoteAdd />
                    </Button>
                </ButtonGroup>
                <Box sx={{ flexGrow: 1 }} />

                {
                    uuid != undefined &&
                    <ButtonGroup>
                        <Button onClick={() => Files.save(new Blob([JSON.stringify(project)]), 'stringart.json')}>
                            <Download />
                        </Button>
                        <Button onClick={() => {
                            window.localStorage.removeItem(`project_${uuid}`)
                            router.push('/')
                        }}>
                            <Delete />
                        </Button>
                    </ButtonGroup>
                }

            </Box>

            <ButtonGroup orientation='vertical'>
                {state.map((tn: IProjectThumbnail) => (
                    <Button
                        sx={{ width: '150 px' }}
                        key={`thumbnail_${tn.uuid}`}
                        onClick={() => goto(tn.uuid)} variant={tn.uuid == uuid ? 'contained' : 'outlined'}>
                        {tn.uuid.substring(0, 30)}...
                    </Button>
                ))}
            </ButtonGroup>

        </Stack>
    )
}