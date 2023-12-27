export const UnretryableError = class extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'UnretryableError'
    }
}

export const retry = async <PT extends unknown[], T>(fn: (...arg: PT) => Promise<T>, maxRetries: number, argument: PT): Promise<T> => {
    let retries = 0
    while (true) {
        try {
            return await fn(...argument)
        } catch (e) {
            if (e instanceof UnretryableError) {
                throw e
            }
            console.debug(`retrying ${fn.name} with ${argument} due to ${e}`)
            if (retries >= maxRetries) {
                throw e
            }
            retries++
        }
    }
}

export const resizeWithMaxSize = async (image: Blob, maxWidth: number, maxHeight: number) => {
    const img = await createImageBitmap(image)
    const width = img.width
    const height = img.height
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    if (width > height) {
        // log if image size exceeds max size
        if (width > maxWidth) {
            console.debug(`image width ${width} exceeds max width ${maxWidth}`)
        }
        canvas.width = maxWidth
        canvas.height = height * (maxWidth / width)
    } else {
        // log if image size exceeds max size
        if (height > maxHeight) {
            console.debug(`image height ${height} exceeds max height ${maxHeight}`)
        }
        canvas.height = maxHeight
        canvas.width = width * (maxHeight / height)
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await canvas.convertToBlob()
}

export const stripCommonDupe = (url: string) => {
    // check if url ends with an extension, if so, remove key and expires from query string
    const urlObj = new URL(url)
    const ext = urlObj.pathname.split('.').pop()
    if (ext) {
        urlObj.searchParams.delete('key')
        urlObj.searchParams.delete('expires')
        return urlObj.toString()
    }

    return urlObj.toString()
}

export const formatByteLength = (bytes: number) => {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    let unit = 0
    while (bytes > 1024) {
        bytes /= 1024
        unit++
    }
    return `${bytes.toFixed(2)} ${units[unit]}`
}

export const normalizeUrl = (url: string) => {
    if (!url) {
        return ""
    }
    // for //example.com like urls, add https: to the beginning
    if (url.startsWith('//')) {
        url = 'https:' + url
    }
    try {
        const urlObj = new URL(url)
        urlObj.hash = ''
        return urlObj.toString()
    } catch (e) {
        return url
    }
}