import {formatByteLength} from "./utils.ts";
import {imageCache} from "./cache.ts";

const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
const imageSourceSelect = document.getElementById('image_source_lang') as HTMLSelectElement;
const targetLangSelect = document.getElementById('target_lang') as HTMLSelectElement;
const cachePruneButton = document.getElementById('cache_prune') as HTMLButtonElement;

const translatedStatus = document.getElementById('translated_status') as HTMLSpanElement;
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
    cacheStatus.innerText = `Cache Size: ${formatByteLength(size)}`;
})

chrome.storage.local.get(['honorific', 'image_source_lang', 'translated_text_count', 'target_lang', 'translated_image_count']).then((config) => {
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;
    targetLangSelect.value = config.target_lang;

    translatedStatus.innerText = `Translated ${config.translated_text_count} texts, ${config.translated_image_count} images`;
});

document.addEventListener('DOMContentLoaded', async () => {
    await imageCache.openWithPrune();
    let size = await imageCache.size()
    cacheStatus.innerText = `Cache Size: ${formatByteLength(size)}`;
})