export class Files {

    public static async open({
        accept
    }: {
        accept?: string
    } = {}): Promise<string> {
        const input = document.createElement('input')
        input.type = 'file'
        if (accept) {
            input.accept = accept
        }

        const result: Promise<string> = new Promise<string>((resolve, reject) => {
            input.addEventListener('change', (e: any) => {
                const reader = new FileReader()
                reader.onload = async (e) => {
                    if (typeof e.target?.result === 'string' || e.target?.result instanceof String) {
                        resolve(e.target?.result as string)
                    }
                }
                reader.readAsText(e.target!.files[0])
            })
        })

        input.click()

        return result
    }

    public static async save(blob: Blob, filename: string) {
        const a = document.createElement('a')
        a.download = filename
        a.href = URL.createObjectURL(blob)
        a.addEventListener('click', (e) => {
            setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000)
        })
        a.click()
    }
}