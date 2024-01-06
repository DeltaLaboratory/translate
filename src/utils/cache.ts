import {stripCommonDupe} from "./utils";

export const imageCache = {
    db: null as IDBDatabase | null,
    openWithPrune: async () => {
        if (imageCache.db === null) {
            console.debug('opening image cache')
            await imageCache.open()
            await imageCache.prune(false)
        }
    },
    size : async () => {
        return new Promise<number> ((resolve, reject) => {
            if (!imageCache.db) {
                reject('db not open')
            }
            let request = imageCache.db!.transaction('image').objectStore('image').openCursor(null, 'prev')
            request.onerror = (e) => {
                reject(e)
            }
            let size = 0
            request.onsuccess = () => {
                let cursor = request.result
                while (cursor) {
                    console.debug(cursor.value.data.size)
                    size += cursor.value.data.size
                    try {
                        cursor.continue()
                    } catch (e) {
                        break
                    }
                }
                resolve(size)
            }
        })
    },
    prune: async (all: boolean) => {
        return new Promise<void>((resolve, reject) => {
            if (!imageCache.db) {
                reject('db not open')
            }
            let request = imageCache.db!.transaction('image', 'readwrite').objectStore('image').openCursor(null, 'prev')
            request.onerror = (e) => {
                reject(e)
            }
            request.onsuccess = () => {
                let cursor = request.result
                if (cursor) {
                    if (all || cursor.value.created < new Date(new Date().getTime() - 86400000)) {
                        cursor.delete()
                        cursor.continue()
                    } else {
                        resolve()
                    }
                } else {
                    resolve()
                }
            }
        })
    },
    open: async () => {
        return new Promise<IDBDatabase>((resolve, reject) => {
            let request = indexedDB.open('translator-cache', 1)
            request.onerror = (e) => {
                reject(e)
            }
            request.onsuccess = () => {
                imageCache.db = request.result
                resolve(request.result)
            }
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains('image')) {
                    request.result.createObjectStore('image')
                    console.log('created image object store')
                }
            }
        })
    },
    get: async (url: string) => {
        return new Promise<Blob | null>((resolve, reject) => {
            if (!imageCache.db) {
                reject('db not open')
            }
            url = stripCommonDupe(url)
            let request = imageCache.db!.transaction('image').objectStore('image').get(url)
            request.onerror = (e) => {
                reject(e)
            }
            request.onsuccess = () => {
                resolve(request.result.data)
            }
        })
    },
    set: async (url: string, blob: Blob) => {
        return new Promise<void>((resolve, reject) => {
            if (!imageCache.db) {
                throw 'db not open'
            }
            url = stripCommonDupe(url)
            let request = imageCache.db!.transaction('image', 'readwrite').objectStore('image').put({data: blob, created: new Date()}, url)
            request.onerror = (e) => {
                reject(e)
            }
            request.onsuccess = () => {
                resolve()
            }
        })
    },
    has: async (url: string) => {
        return new Promise<boolean>((resolve, reject) => {
            if (!imageCache.db) {
                reject('db not open')
            }
            url = stripCommonDupe(url)
            let request = imageCache.db!.transaction('image').objectStore('image').count(url)
            request.onerror = (e) => {
                reject(e)
            }
            request.onsuccess = () => {
                resolve(request.result > 0)
            }
        })
    }
}