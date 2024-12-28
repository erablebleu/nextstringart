export class ActivablePromise<T> {
    private _promise: Promise<T>
    private _resolve?: (value: T | PromiseLike<T>) => void
    private _reject?: (reason?: any) => void

    constructor() {
        this._promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })
    }

    public getPromise(): Promise<T> {
        return this._promise
    }

    public resolve(value: T | PromiseLike<T>) {
        this._resolve?.(value)
    }

    public reject(reason?: any) {
        this._reject?.(reason)
    }
}