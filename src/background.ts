import {detectLang, translate, translateImage} from './papago'

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'detect_lang') {
        detectLang(request.text).then(lang => {
            sendResponse(lang)
        })
        return true
    }
    if (request.action === 'translate') {
        translate(request.text, request.source, request.target).then(json => {
            sendResponse(json)
        })
        return true
    }
    return false
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'translate_image') {
        let config = await chrome.storage.sync.get(['image_source_lang'])
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
            let image = await translateImage(await (await fetch(imageURL.toString())).blob(), config.image_source_lang, 'ko')
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'alter_image_url',
                url: info.srcUrl,
                translated_url: image
            })
        } catch (e) {
            await chrome.tabs.sendMessage(tab!.id!, {
                action: 'error_alert',
                message: `Failed to translate image: ${e}`
            })
        }
    }
    if (info.menuItemId === 'translate') {
        try {
            let json = await translate(info.selectionText!, 'auto', 'ko')
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
        "target_lang": navigator.language,
        "image_source_lang": 'en',
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