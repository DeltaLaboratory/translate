import {imageCache} from "./utils/cache";

import {formatByteLength} from "./utils/utils";

const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
const dontTranslateCheckbox = document.getElementById('dont_display_same_lang') as HTMLInputElement;
const imageSourceSelect = document.getElementById('image_source_lang') as HTMLSelectElement;
const targetLangSelect = document.getElementById('target_lang') as HTMLSelectElement;
const cachePruneButton = document.getElementById('cache_prune') as HTMLButtonElement;

const cacheStatus = document.getElementById('cache_status') as HTMLSpanElement;


honorificCheckbox.addEventListener('change',  async () => {
    await chrome.storage.local.set({honorific: honorificCheckbox.checked});
});

imageSourceSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({image_source_lang: imageSourceSelect.value});
})

targetLangSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({target_lang: targetLangSelect.value});
})

dontTranslateCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({dont_display_same_lang: dontTranslateCheckbox.checked});
})

cachePruneButton.addEventListener('click', async () => {
    await imageCache.openWithPrune()
    await imageCache.prune(true)
    let size = await imageCache.size()
    cacheStatus.innerText = chrome.i18n.getMessage(`page@cache_size`, formatByteLength(size));
})

chrome.storage.local.get(['honorific', 'image_source_lang', 'target_lang', 'dont_display_same_lang']).then((config) => {
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;
    targetLangSelect.value = config.target_lang;
    dontTranslateCheckbox.checked = config.dont_display_same_lang;
});

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('[data-translate]').forEach((element) => {
        console.log(element.getAttribute('data-translate'))
        element.innerHTML = chrome.i18n.getMessage(`page@${element.getAttribute('data-translate')}`);
    })
    await imageCache.openWithPrune();
    let size = await imageCache.size()
    cacheStatus.innerText = chrome.i18n.getMessage(`page@cache_size`, formatByteLength(size));
})