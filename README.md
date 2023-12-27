<p align="center"><img src="public/icon.png" width="128" height="128"></p>
<h1 align="center">Translate</h1>
<p align="center">
  <a href="https://chromewebstore.google.com/detail/translator/cdeikfpejpfongpmmngmiecgmlojfplo">
  <img src="https://img.shields.io/chrome-web-store/v/cdeikfpejpfongpmmngmiecgmlojfplo?label=Chrome%20Extension&style=for-the-badge&logo=google-chrome&logoColor=white&color=4285F4">
  </a>
</p>

## Usage
Install the extension from the [Chrome Web Store](https://chrome.google.com/webstore/detail/translator/cdeikfpejpfongpmmngmiecgmlojfplo) or [Build from source](#build-from-source).

Select the text you want to translate and right-click to open the context menu, then click the `Translate` menu. For image translation, right-click on the image and click the `Translate Image` menu.

## Supported Engine
|                             Engine                              | Text Translation | Image Translation |
|:---------------------------------------------------------------:|:----------------:|:-----------------:|
| [![Papago](./public/icon/papago.ico)](https://papago.naver.com) |        ✔️        |        ✔️         |

## UI Supported Sites
- [YouTube](https://www.youtube.com) - Comment Translation

## Build from source
1. Clone the repository
    ```bash
    git clone https://github.com/DeltaLaboratory/translate
    ```
2. Install dependencies (requires [Node.js](https://nodejs.org/en/), [pnpm](https://pnpm.js.org/))
    ```bash
    pnpm install
    ```
3. Build the extension
    ```bash
    pnpm run build
    ```
then load the extension from `dist` folder.
