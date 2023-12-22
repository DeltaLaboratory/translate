const honorificCheckbox = document.getElementById('honorific') as HTMLInputElement;
const imageSourceSelect = document.getElementById('image_source_lang') as HTMLSelectElement;


honorificCheckbox.addEventListener('change',  async () => {
    await chrome.storage.sync.set({honorific: honorificCheckbox.checked});
});

imageSourceSelect.addEventListener('change', async () => {
    await chrome.storage.sync.set({image_source_lang: imageSourceSelect.value});
})

// load honorific setting
chrome.storage.sync.get(['honorific', 'image_source_lang']).then((config) => {
    honorificCheckbox.checked = config.honorific;
    imageSourceSelect.value = config.image_source_lang;
});