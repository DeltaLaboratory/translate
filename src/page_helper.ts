let lastContextPosition: { x: number, y: number } = { x: 0, y: 0 }

document.addEventListener("contextmenu", function(event){
    let rect = (event.target as HTMLElement).getBoundingClientRect()
    lastContextPosition = { x: rect.left, y: rect.top }
}, true);

const createTranslatedOverlay = (translated: any) => {
    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.top = `${window.scrollY + lastContextPosition.y}px`
    overlay.style.left = `${window.scrollX + lastContextPosition.x}px`
    overlay.style.zIndex = '9999'
    overlay.style.color = 'black'
    overlay.style.backgroundColor = 'white'
    overlay.style.border = '1px solid black'
    overlay.style.padding = '10px'
    overlay.style.borderRadius = '5px'
    overlay.style.maxWidth = '500px'
    overlay.style.maxHeight = '500px'
    overlay.style.overflow = 'auto'
    overlay.style.cursor = 'pointer'
    overlay.style.fontSize = '12px'
    overlay.style.fontFamily = `'Pretendard-Regular', 'Noto Sans KR', sans-serif`

    // drag
    let isDragging = false
    let lastX = 0
    let lastY = 0
    overlay.addEventListener('mousedown', (event) => {
        isDragging = true
        lastX = event.clientX
        lastY = event.clientY
    })
    overlay.addEventListener('mouseup', () => {
        isDragging = false
    })
    overlay.addEventListener('mousemove', (event) => {
        if (isDragging) {
            const deltaX = event.clientX - lastX
            const deltaY = event.clientY - lastY
            overlay.style.top = `${parseInt(overlay.style.top!) + deltaY}px`
            overlay.style.left = `${parseInt(overlay.style.left!) + deltaX}px`
            lastX = event.clientX
            lastY = event.clientY
        }
    })

    const header = document.createElement('span')
    header.style.fontWeight = 'bold'
    header.innerText = `Translated Text - ${translated.srcLangType} => ${translated.tarLangType}`
    overlay.appendChild(header)

    const text = document.createElement('p')
    text.innerText = translated.translatedText
    overlay.appendChild(text)

    const closeButton = document.createElement('button')
    closeButton.innerText = 'Close'
    closeButton.addEventListener('click', () => {
        overlay.remove()
    })
    overlay.appendChild(closeButton)

    return overlay
}

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
    if (request.action === 'error_alert') {
        alert(request.message)
        return true
    }
    if (request.action === 'translated_overlay') {
        document.body.appendChild(createTranslatedOverlay(request.translated))
        return true
    }
    return false
})