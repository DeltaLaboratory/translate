chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
    if (request.action === 'alter_image_url') {
        let found = false
        document.querySelectorAll('img').forEach((img) => {
            if (img.src === request.url) {
                found = true
                img.src = request.translated_url
            }
        })
        sendResponse(found)
        return true
    }
    if (request.action === 'load_image') {
        return false
    }
    if (request.action === 'error_alert') {
        alert(request.message)
        return true
    }
    return false
})