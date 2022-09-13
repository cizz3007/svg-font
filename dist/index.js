var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs-extra';
import path from 'path';
import extract from 'extract-zip';
import puppeteer from 'puppeteer';
import { wait } from './src/utils/wait.js';
import { DEFAULT_OPTIONS, PAGE } from './src/const/index.js';
import { logger } from './src/utils/log.js';
import { getAbsolutePath } from './src/functions/getAbsolutePath.js';
import { checkDuplicateName } from './src/functions/checkDuplicatedName.js';
import { checkDownload } from './src/functions/checkDownload.js';
import { getFileRecursively } from './src/functions/getFileRecursively.js';
function pipeline({ icons = [], names = [], selectionPath, forceOverride = false, visible = false, directory, outputDir: outputDirectory, }) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const outputDir = outputDirectory ? getAbsolutePath(outputDirectory) : DEFAULT_OPTIONS.outputDir;
            logger('폰트 생성을 시작합니다.');
            if (!selectionPath) {
                throw new Error('selection.json File의 경로를 정확히 입력해 주세요');
            }
            if (directory) {
                yield getFileRecursively(directory, (err, res) => __awaiter(this, void 0, void 0, function* () {
                    if (res.length) {
                        icons = res;
                    }
                }));
                yield wait(150);
            }
            if (!icons.length) {
                return logger('svg 파일을 매개변수로 넘겨주세요. -i "a.svg,b.svg,c.svg"');
            }
            let absoluteSelectionPath = getAbsolutePath(selectionPath);
            checkDuplicateName({
                selectionPath: absoluteSelectionPath,
                icons,
                names,
            }, forceOverride);
            yield fs.remove(outputDir);
            yield fs.ensureDir(outputDir);
            const browser = yield puppeteer.launch({ headless: !visible });
            logger('크롬 브라우저를 시작합니다.');
            const page = yield (yield browser).newPage();
            const client = yield page.target().createCDPSession();
            yield client.send('Page.setDownloadBehavior', {
                behavior: 'allow',
                downloadPath: outputDir,
            });
            yield page.goto('https://icomoon.io/app/#/select');
            yield page.waitForSelector(PAGE.IMPORT_CONFIG_BUTTON);
            logger('config file을 업로드합니다.');
            yield page.click(PAGE.MENU_BUTTON);
            yield page.click(PAGE.REMOVE_SET_BUTTON);
            const importInput = yield page.waitForSelector(PAGE.IMPORT_SELECTION_INPUT);
            yield importInput.uploadFile(absoluteSelectionPath);
            yield page.waitForSelector(PAGE.OVERLAY_CONFIRM, { visible: true });
            yield page.click(PAGE.OVERLAY_CONFIRM);
            const selection = fs.readJSONSync(selectionPath);
            if (selection.icons.length === 0) {
                logger('Selection icons is empty, going to create an empty set');
                yield page.click(PAGE.MAIN_MENU_BUTTON);
                yield page.waitForSelector(PAGE.NEW_SET_BUTTON, { visible: true });
                yield page.click(PAGE.NEW_SET_BUTTON);
            }
            logger('Uploaded config, going to upload new icon files');
            yield page.click(PAGE.MENU_BUTTON);
            const iconInput = yield page.waitForSelector(PAGE.ICON_INPUT);
            const iconPaths = icons.map(getAbsolutePath);
            yield iconInput.uploadFile(...iconPaths);
            yield page.waitForSelector(PAGE.FIRST_ICON_BOX);
            yield page.click(PAGE.SELECT_ALL_BUTTON);
            logger('Uploaded and selected all new icons');
            yield page.click(PAGE.GENERATE_LINK);
            yield page.waitForSelector(PAGE.GLYPH_SET);
            if (names.length) {
                logger('Changed names of icons');
                yield wait(1200);
                yield page.evaluate((names) => {
                    const request = indexedDB.open('IDBWrapper-storage', 1);
                    request.onsuccess = function () {
                        const db = request.result;
                        const tx = db.transaction('storage', 'readwrite');
                        const store = tx.objectStore('storage');
                        const keys = store.getAllKeys();
                        keys.onsuccess = function () {
                            let timestamp;
                            keys.result.forEach(function (key) {
                                if (typeof key === 'number') {
                                    timestamp = key;
                                }
                            });
                            const main = store.get(timestamp);
                            main.onsuccess = function () {
                                const data = main.result;
                                for (let i = 0; i < names.length; i++) {
                                    data.obj.iconSets[0].selection[i].name = names[i];
                                }
                                store.put(data);
                            };
                        };
                    };
                }, names);
            }
            yield wait(1200);
            yield page.reload();
            yield page.waitForSelector(PAGE.DOWNLOAD_BUTTON);
            yield page.click(PAGE.DOWNLOAD_BUTTON);
            const meta = selection.preferences.fontPref.metadata;
            const zipName = meta.majorVersion
                ? `${meta.fontFamily}-v${meta.majorVersion}.${meta.minorVersion || 0}.zip`
                : `${meta.fontFamily}.zip`;
            logger(`${zipName} 파일을 다운로드 합니다.`);
            const zipPath = path.join(outputDir, zipName);
            yield checkDownload(zipPath);
            logger('성공적으로 다운로드 했습니다. zip파일 압축을 해제합니다.');
            yield page.close();
            yield extract(zipPath, { dir: outputDir })
                .then(() => __awaiter(this, void 0, void 0, function* () {
                yield fs.remove(zipPath);
                return true;
            }))
                .then(() => {
                logger(`생성 완료, 생성 경로는 ${outputDir} 입니다.`);
                return;
            })
                .catch((err) => {
                console.log('zip file 에러 ', err);
                fs.remove(zipPath);
                return;
            });
        }
        catch (error) {
            console.error(error);
        }
    });
}
export default pipeline;
//# sourceMappingURL=index.js.map