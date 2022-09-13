import fs from 'fs-extra';
import path from 'path';
import extract from 'extract-zip';
import puppeteer from 'puppeteer';
import type { Page } from 'puppeteer';
import type { Pipeline } from './src/type/pipeline.type';
import { wait } from './src/utils/wait.js';
import { DEFAULT_OPTIONS, PAGE } from './src/const/index.js';
import { logger } from './src/utils/log.js';
import { getAbsolutePath } from './src/functions/getAbsolutePath.js';
import { checkDuplicateName } from './src/functions/checkDuplicatedName.js';
import { checkDownload } from './src/functions/checkDownload.js';
import { getFileRecursively } from './src/functions/getFileRecursively.js';

async function pipeline({
    icons = [],
    names = [],
    selectionPath,
    forceOverride = false,
    visible = false,
    directory,
    outputDir: outputDirectory,
}: Pipeline) {
    try {
        const outputDir = outputDirectory ? getAbsolutePath(outputDirectory) : DEFAULT_OPTIONS.outputDir;
        logger('폰트 생성을 시작합니다.');
        // directory 매개변수가 있으면 해당 폴더 안에 있는 모든 svg를 재귀로 찾아가며icons에 대입
        if (!selectionPath) {
            throw new Error('selection.json File의 경로를 정확히 입력해 주세요');
        }
        if (directory) {
            await getFileRecursively(directory, async (err, res: string[]) => {
                if (res.length) {
                    icons = res;
                }
            });
            await wait(150);
        }

        if (!icons.length) {
            return logger('svg 파일을 매개변수로 넘겨주세요. -i "a.svg,b.svg,c.svg"');
        }

        let absoluteSelectionPath = getAbsolutePath(selectionPath);

        checkDuplicateName(
            {
                selectionPath: absoluteSelectionPath,
                icons,
                names,
            },
            forceOverride,
        );

        await fs.remove(outputDir);
        await fs.ensureDir(outputDir);

        const browser = await puppeteer.launch({ headless: !visible });
        logger('크롬 브라우저를 시작합니다.');
        const page: Page = await (await browser).newPage();
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: outputDir,
        });
        // icomoon 사이트로
        await page.goto('https://icomoon.io/app/#/select');
        await page.waitForSelector(PAGE.IMPORT_CONFIG_BUTTON);
        logger('config file을 업로드합니다.');
        // remove init set
        await page.click(PAGE.MENU_BUTTON);
        await page.click(PAGE.REMOVE_SET_BUTTON);

        const importInput = await page.waitForSelector(PAGE.IMPORT_SELECTION_INPUT);
        // @ts-ignore
        await importInput.uploadFile(absoluteSelectionPath);
        await page.waitForSelector(PAGE.OVERLAY_CONFIRM, { visible: true });
        await page.click(PAGE.OVERLAY_CONFIRM);
        const selection = fs.readJSONSync(selectionPath);

        if (selection.icons.length === 0) {
            logger('Selection icons is empty, going to create an empty set');
            await page.click(PAGE.MAIN_MENU_BUTTON);
            await page.waitForSelector(PAGE.NEW_SET_BUTTON, { visible: true });
            await page.click(PAGE.NEW_SET_BUTTON);
        }

        logger('Uploaded config, going to upload new icon files');
        await page.click(PAGE.MENU_BUTTON);
        const iconInput = await page.waitForSelector(PAGE.ICON_INPUT);
        const iconPaths = icons.map(getAbsolutePath);
        // @ts-ignore
        await iconInput.uploadFile(...iconPaths);
        await page.waitForSelector(PAGE.FIRST_ICON_BOX);
        await page.click(PAGE.SELECT_ALL_BUTTON);
        logger('Uploaded and selected all new icons');
        await page.click(PAGE.GENERATE_LINK);
        await page.waitForSelector(PAGE.GLYPH_SET);
        if (names.length) {
            logger('Changed names of icons');
            // indexedDB가 확실히 준비될 때까지 기다림
            await wait(1200);
            await page.evaluate((names: string[]) => {
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

        // 코드가 확실하게 실행되었을 시간까지 기다림
        await wait(1200);
        // icomoon이 최신 indexedDB를 읽을 수 있게 리로드함.
        await page.reload();

        await page.waitForSelector(PAGE.DOWNLOAD_BUTTON);
        await page.click(PAGE.DOWNLOAD_BUTTON);
        const meta = selection.preferences.fontPref.metadata;
        const zipName = meta.majorVersion
            ? `${meta.fontFamily}-v${meta.majorVersion}.${meta.minorVersion || 0}.zip`
            : `${meta.fontFamily}.zip`;
        logger(`${zipName} 파일을 다운로드 합니다.`);
        const zipPath = path.join(outputDir, zipName);
        await checkDownload(zipPath);
        logger('성공적으로 다운로드 했습니다. zip파일 압축을 해제합니다.');
        await page.close();
        // 알집 해체
        await extract(zipPath, { dir: outputDir })
            .then(async () => {
                await fs.remove(zipPath);
                return true;
            })
            .then(() => {
                logger(`생성 완료, 생성 경로는 ${outputDir} 입니다.`);
                return;
            })
            .catch((err: any) => {
                console.log('zip file 에러 ', err);
                fs.remove(zipPath);
                return;
            });
    } catch (error) {
        console.error(error);
    }
}

export default pipeline;