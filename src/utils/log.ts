export const info = (caller: string, message: any) => {
    console.info(`%c[Translate-Extension]%c %c[Debug]%c %c${caller}%c:${message}`, 'color: #00a8ff', 'color: inherit', 'color: #00a8ff', 'color: inherit', 'color: lime', 'color: inherit')
}

export const debug = (caller: string, message: any) => {
    console.debug(`%c[Translate-Extension]%c %c[Debug]%c %c${caller}%c:${message}`, 'color: #00a8ff', 'color: inherit', 'color: yellow', 'color: inherit', 'color: lime', 'color: inherit')
}

export const warn = (caller: string, message: any) => {
    console.warn(`%c[Translate-Extension]%c %c[Debug]%c %c${caller}%c:${message}`, 'color: #00a8ff', 'color: inherit', 'color: red', 'color: inherit', 'color: lime', 'color: inherit')
}