import {normalizeUrl} from "./utils/utils";

import './styles/overlay.css'
import {TextTranslateResult} from "./models/engine.ts";

let lastContextPosition: { x: number, y: number } = { x: 0, y: 0 }

document.addEventListener("contextmenu", function(event){
    let rect = (event.target as HTMLElement).getBoundingClientRect()
    lastContextPosition = { x: rect.left, y: rect.top }
}, true);

const createTranslatedOverlay = (translated: TextTranslateResult) => {
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

    const header = document.createElement('div')
    header.className = 'translate-overlay-header'

    const engineImage = document.createElement('img')
    engineImage.src = chrome.runtime.getURL(`/icon/${translated.engine}.ico`)
    engineImage.title = `Translated with ${translated.engine}`
    header.appendChild(engineImage)

    const headerText = document.createElement('span')
    headerText.style.fontWeight = 'bold'
    headerText.innerText = `${translated.source} -> ${translated.target}`
    header.appendChild(headerText)
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
        let imageElement: HTMLImageElement | HTMLPictureElement | null = null;
        let parentElement: HTMLImageElement | HTMLPictureElement;
        let controlElement: HTMLImageElement | HTMLSourceElement;
        // find img element OR picture element with an img element as child, check for source tag
        for (const img of document.querySelectorAll('img, picture')) {
            if (normalizeUrl(img.getAttribute('src')!) === request.url) {
                imageElement = img as HTMLImageElement
                parentElement = img as HTMLImageElement
                controlElement = img as HTMLImageElement
                if (img.getAttribute('src')) {
                    img.setAttribute('data-original-src', img.getAttribute('src')!)
                }
                if (img.getAttribute('srcset')) {
                    img.setAttribute('data-original-srcset', img.getAttribute('srcset')!)
                }

                img.setAttribute('src', request.translated_url)
                img.removeAttribute('srcset')
                found = true
            }
            if (img.querySelector('source')) {
                for (let source of img.querySelectorAll('source')) {
                    if (normalizeUrl(source.srcset) === request.url) {
                        controlElement = source as HTMLSourceElement
                        parentElement = img as HTMLPictureElement

                        for (let element of parentElement.children) {
                            if (element.tagName === 'IMG') {
                                imageElement = element as HTMLImageElement
                            }
                        }

                        if (source.src) {
                            source.setAttribute('data-original-src', source.src)
                            source.removeAttribute('src')
                        }

                        if (source.srcset) {
                            source.setAttribute('data-original-srcset', source.srcset)
                            source.removeAttribute('srcset')
                        }

                        source.srcset = request.translated_url
                        found = true
                    }
                }
            }
        }

        if (found) {
            let originalButton = document.createElement('button')
            originalButton.innerText = "Original"
            originalButton.title = "Show original image"
            originalButton.addEventListener('click', async () => {
                if (controlElement!.getAttribute('data-original-src')) {
                    controlElement!.setAttribute('src', controlElement!.getAttribute('data-original-src')!)
                }
                if (controlElement!.getAttribute('data-original-srcset')) {
                    controlElement!.setAttribute('srcset', controlElement!.getAttribute('data-original-srcset')!)
                }
                controlElement!.removeAttribute('data-original-src')
                controlElement!.removeAttribute('data-original-srcset')
                originalButton.remove()
            })
            let rect = imageElement ? imageElement.getBoundingClientRect() : parentElement!.getBoundingClientRect()
            originalButton.style.top = `${window.scrollY + rect.top + 10}px`
            originalButton.style.left = `${window.scrollX + rect.left + 10}px`
            originalButton.className = 'image-original-button'
            document.body.appendChild(originalButton)

            addEventListener('resize', () => {
                let rect = imageElement ? imageElement.getBoundingClientRect() : parentElement!.getBoundingClientRect()
                originalButton.style.top = `${window.scrollY + rect.top + 10}px`
                originalButton.style.left = `${window.scrollX + rect.left + 10}px`
            })

            parentElement!.addEventListener('DOMNodeRemoved', () => {
                originalButton.remove()
            })
        }
        sendResponse(found)
        return true
    }
    if (request.action === 'error_alert') {
        alert(request.message)
        return true
    }
    if (request.action === 'translated_overlay') {
        document.body.appendChild(createTranslatedOverlay(request.translated as TextTranslateResult))
        return true
    }
    return false
})
