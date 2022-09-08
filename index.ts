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
    whenFinished,
    visible = false,
    directory,
    outputDir: outputDirectory,
}: Pipeline) {
    try {
        console.log('directory : ', directory);
        console.log('icons: ', icons);
        console.log('names: ', names);

        // direcotry가 있으면 재귀로 아래에 있는 모든 svg를 icons에 대입
        const outputDir = outputDirectory ? getAbsolutePath(outputDirectory) : DEFAULT_OPTIONS.outputDir;
        // prepare stage
        logger('폰트 생성을 시작합니다.');

        await getFileRecursively(directory, (err, res: string[]) => {
            if (res.length) {
                icons = res;
            }
        });

        if (!icons || !icons.length) {
            // 완료 되었다면
            if (whenFinished) {
                whenFinished({ outputDir });
            }
            return logger('No new icons found.');
        }
        if (!selectionPath) {
            throw new Error('selection.json File의 경로를 정확히 입력해 주세요');
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

        console.log('outputDir', outputDir);
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
            // sleep to ensure indexedDB is ready
            await wait(1200);
            await page.evaluate((names) => {
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

        // sleep to ensure the code was executed
        await wait(1000);
        // reload the page let icomoon read latest indexedDB data
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
        await extract(zipPath, { dir: outputDir }).catch((err: any) => {
            console.log('zip file 에러 ', err);
            return false;
        });
        await fs.remove(zipPath);
        logger(`생성 완료, 생성 경로는 ${outputDir} 입니다.`);
        if (whenFinished) {
            whenFinished({ outputDir });
        }
    } catch (error) {
        console.error(error);
    }
}

export default pipeline;