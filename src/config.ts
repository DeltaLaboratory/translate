const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
const imageSourceSelect = document.getElementById('image_source_lang') as HTMLSelectElement;

const translatedTexts = document.getElementById('translated_texts') as HTMLSpanElement;
const translatedImages = document.getElementById('translated_images') as HTMLSpanElement;


honorificCheckbox.addEventListener('change',  async () => {
    await chrome.storage.local.set({honorific: honorificCheckbox.checked});
});

imageSourceSelect.addEventListener('change', async () => {
    await chrome.storage.local.set({image_source_lang: imageSourceSelect.value});
})

chrome.storage.local.get(['honorific', 'image_source_lang', 'translated_text_count', 'translated_image_count']).then((config) => {
    console.log(config);
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;

    translatedTexts.innerText = `Translated ${config.translated_text_count} texts`;
    translatedImages.innerText = `Translated ${config.translated_image_count} images`;
});