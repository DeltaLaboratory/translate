import {formatByteLength} from "./utils/utils";
import {imageCache} from "./utils/cache";
import {i18n, translatePage} from "./i18n/i18n.ts";

const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
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

cachePruneButton.addEventListener('click', async () => {
    await imageCache.openWithPrune()
    await imageCache.prune(true)
    let size = await imageCache.size()
    cacheStatus.innerText = await i18n('@page/cache-size', formatByteLength(size));
})

chrome.storage.local.get(['honorific', 'image_source_lang', 'target_lang']).then((config) => {
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;
    targetLangSelect.value = config.target_lang;
});

document.addEventListener('DOMContentLoaded', async () => {
    translatePage();
    await imageCache.openWithPrune();
    let size = await imageCache.size()
    cacheStatus.innerText = await i18n('@page/cache-size', formatByteLength(size));
})