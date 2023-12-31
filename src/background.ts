import {detectLang} from './engine/papago'
import {normalizeLanguageCode, resizeWithMaxSize, retry} from './utils/utils'
import {imageCache} from "./utils/cache";
import {getEngine} from "./engine/engine";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    const listener: Record<string, (request: any, sender: chrome.runtime.MessageSender, sendResponse: (any)) => Promise<any>> = {
        "image_cache_size": async (_request, _sender, _sendResponse) => {
            await imageCache.openWithPrune()
            return await imageCache.size()
        },
        "image_cache_prune": async (_request, _sender, _sendResponse) => {
            await imageCache.openWithPrune()
            await imageCache.prune(true)
            return
        },
        "translate": async (_request, _sender, _sendResponse) => {
            return await (await getEngine()).translateText(request.text, request.source, request.target)
        },
        "detect_lang": async (_request, _sender, _sendResponse) => {
            return await detectLang(request.text)
        }
    }
    if (listener[request.action as string]) {
        listener[request.action as string](request, _sender, sendResponse).then((response) => {
            sendResponse(response)
        })
        return true
    }
    return false
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let config = await chrome.storage.local.get(['image_source_lang', 'target_lang'])

    if (info.menuItemId === 'translate_image') {
        await imageCache.openWithPrune()
        if (await imageCache.has(info.srcUrl!)) {
            let blob = await imageCache.get(info.srcUrl!)
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'alter_image_url',
                url: info.srcUrl,
                translated_url: await new Response(blob!).text()
            })
            return
        }
        try {
            let imageURL = new URL(info.srcUrl!)
            let url = new URL(tab!.url!)
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [3],
                addRules: [{
                    id: 3,
                    action: {
                        type: 'modifyHeaders',
                        requestHeaders: [{
                            header: 'Origin',
                            operation: 'set',
                            value: url.origin,
                        }, {
                            header: 'Referer',
                            operation: 'set',
                            value: url.toString(),
                        }],
                    },
                    condition: {
                        domains: [chrome.runtime.id],
                        urlFilter: imageURL.origin + '/*',
                    },
                }] as chrome.declarativeNetRequest.Rule[],
            });
            let sourceImage = await (await fetch(imageURL.toString())).blob()
            let image = await retry((await getEngine()).translateImage, 5, [await resizeWithMaxSize(sourceImage, 1960, 1960), config.image_source_lang, config.target_lang])
            await imageCache.set(info.srcUrl!, new Blob([image.translatedImage]))
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'alter_image_url',
                url: info.srcUrl,
                translated_url: image.translatedImage
            })
        } catch (e) {
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'error_alert',
                message: `Failed to translate image: ${e}`
            })
        }
    }
    if (info.menuItemId === 'translate') {
        let translateText: string

        // we are using this because info.selectionText removes newlines.
        // see https://bugs.chromium.org/p/chromium/issues/detail?id=116429
        let selectedText = await chrome.scripting.executeScript({
            target: {tabId: tab!.id!},
            func: () => {
                return window.getSelection()!.toString()
            }
        })
        if (selectedText[0].result) {
            translateText = selectedText[0].result
        } else {
            translateText = info.selectionText!
        }
        try {
            let json = await (await getEngine()).translateText(translateText, 'auto', config.target_lang)
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'translated_overlay',
                translated: json
            })
        } catch (e) {
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'error_alert',
                message: `Failed to translate: ${e}`
            })
        }
    }
})

chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({
        "honorific": false,
        "target_lang": normalizeLanguageCode(navigator.language),
        "image_source_lang": 'en_US',
        "dont_display_same_lang": false,
    })

    const rules = [{
        id: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [{
                header: 'Referer',
                operation: 'set',
                value: 'https://papago.naver.com',
            }, {
                header: 'Origin',
                operation: 'set',
                value: 'https://papago.naver.com/',
            }],
        },
        condition: {
            domains: [chrome.runtime.id],
            urlFilter: '*://papago.naver.com/apis/*',
            resourceTypes: ['xmlhttprequest'],
        },
    }, {
        id: 2,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [{
                header: 'Access-Control-Allow-Origin',
                operation: 'set',
                value: '*',
            }],
        },
        condition: {
            domains: [chrome.runtime.id],
            urlFilter: '|https*',
            resourceTypes: ['xmlhttprequest'],
        },
    }];
    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id),
        addRules: rules as chrome.declarativeNetRequest.Rule[],
    });

    // install context menu
    chrome.contextMenus.create({
        id: 'translate',
        title: 'Translate',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'translate_image',
        title: 'Translate Image',
        contexts: ['image']
    });
});