const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
const imageSourceSelect = document.getElementById('image_source_lang') as HTMLSelectElement;
const targetLangSelect = document.getElementById('target_lang') as HTMLSelectElement;

const translatedStatus = document.getElementById('translated_status') as HTMLSpanElement;


honorificCheckbox.addEventListener('change',  async () => {
    await chrome.storage.local.set({honorific: honorificCheckbox.checked});
});

imageSourceSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({image_source_lang: imageSourceSelect.value});
})

targetLangSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({target_lang: targetLangSelect.value});
})

chrome.storage.local.get(['honorific', 'image_source_lang', 'translated_text_count', 'target_lang', 'translated_image_count']).then((config) => {
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;
    targetLangSelect.value = config.target_lang;

    translatedStatus.innerText = `Translated ${config.translated_text_count} texts, ${config.translated_image_count} images`;
});