import {Translated} from "./models/papago";
import {normalizeUrl} from "./utils/utils";

import './styles/overlay.css'

let lastContextPosition: { x: number, y: number } = { x: 0, y: 0 }

document.addEventListener("contextmenu", function(event){
    let rect = (event.target as HTMLElement).getBoundingClientRect()
    lastContextPosition = { x: rect.left, y: rect.top }
}, true);

const createTranslatedOverlay = (translated: Translated) => {
    const overlay = document.createElement('div')
    overlay.style.top = `${window.scrollY + lastContextPosition.y}px`
    overlay.style.left = `${window.scrollX + lastContextPosition.x}px`

    overlay.className = 'translate-overlay'

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
    header.innerText = `Translated Text - ${translated.srcLangType} -> ${translated.tarLangType}`
    overlay.appendChild(header)

    overlay.appendChild(document.createElement('hr'))

    const text = document.createElement('p')
    text.style.marginBottom = '5px'
    text.innerText = translated.translatedText
    overlay.appendChild(text)

    const closeButton = document.createElement('button')
    closeButton.innerText = 'Close'
    closeButton.addEventListener('click', () => {
        overlay.remove()
    })
    overlay.appendChild(closeButton)

    const copyButton = document.createElement('button')
    copyButton.style.marginLeft = '5px'
    copyButton.innerText = 'Copy'
    copyButton.addEventListener('click', async () => {
        await navigator.clipboard.writeText(translated.translatedText)
        copyButton.innerText = 'Copied!'
        setTimeout(() => {
            copyButton.innerText = 'Copy'
        }, 1000)
    })
    overlay.appendChild(copyButton)

    return overlay
}

chrome.runtime.onMessage.addListener(async (request, _sender, sendResponse) => {
    if (request.action === 'alter_image_url') {
        let found = false
        let parentElement: HTMLImageElement | HTMLPictureElement;
        let controlElement: HTMLImageElement | HTMLSourceElement;
        // find img element OR picture element with an img element as child, check for source tag
        for (const img of document.querySelectorAll('img, picture')) {
            if (normalizeUrl(img.getAttribute('src')!) === request.url) {
                parentElement = img as HTMLImageElement
                controlElement = img as HTMLImageElement
                img.setAttribute('data-original-src', img.getAttribute('src')!)
                if (img.getAttribute('srcset')) {
                    img.setAttribute('data-original-srcset', img.getAttribute('srcset')!)
                }

                img.setAttribute('src', request.translated_url)
                if (img.getAttribute('srcset')) {
                    img.setAttribute('srcset', request.translated_url)
                }
                found = true
            }
            if (img.querySelector('source')) {
                for (let source of img.querySelectorAll('source')) {
                    if (normalizeUrl(source.srcset) === request.url) {
                        controlElement = source as HTMLSourceElement
                        parentElement = img as HTMLPictureElement
                        source.srcset = request.translated_url
                        found = true
                    }
                }
            }
        }

        if (found) {
            let originalButton = document.createElement('button')
            originalButton.innerText = "U"
            originalButton.title = "Show original image"
            originalButton.addEventListener('click', async () => {
                controlElement!.setAttribute('src', parentElement!.getAttribute('data-original-src')!)
                if (controlElement!.getAttribute('data-original-srcset')) {
                    controlElement!.setAttribute('srcset', parentElement!.getAttribute('data-original-srcset')!)
                }
                controlElement!.removeAttribute('data-original-src')
                controlElement!.removeAttribute('data-original-srcset')
                originalButton.remove()
            })
            addEventListener('resize', () => {
                let rect = parentElement!.getBoundingClientRect()
                originalButton.style.top = `${window.scrollY + rect.top + 10}px`
                originalButton.style.left = `${window.scrollX + rect.left + 10}px`
            })
            let rect = parentElement!.getBoundingClientRect()
            originalButton.style.top = `${window.scrollY + rect.top + 10}px`
            originalButton.style.left = `${window.scrollX + rect.left + 10}px`
            originalButton.className = 'image-original-button'
            document.body.appendChild(originalButton)
        }
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