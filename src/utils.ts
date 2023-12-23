export const retry = async <PT extends unknown[], T>(fn: (...arg: PT) => Promise<T>, maxRetries: number, argument: PT): Promise<T> => {
    let retries = 0
    while (true) {
        try {
            return await fn(...argument)
        } catch (e) {
            console.log(`retrying ${fn.name} with ${argument} due to ${e}`)
            if (retries >= maxRetries) {
                throw e
            }
            retries++
        }
    }
}