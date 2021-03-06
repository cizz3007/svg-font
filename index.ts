import type { Page } from "puppeteer";
import type { Pipeline } from "./src/type/pipeline.type";
import { wait } from "./src/utils/wait.js";
import { DEFAULT_OPTIONS, PAGE } from "./src/const/index.js";
import fs from "fs-extra";
import path from "path";
import extract from "extract-zip";
import puppeteer from "puppeteer";
import { logger } from "./src/utils/log.js";
import { getAbsolutePath } from "./src/functions/getAbsolutePath.js";
import { checkDuplicateName } from "./src/functions/checkDuplicatedName.js";
import { checkDownload } from "./src/functions/checkDownload.js";

async function pipeline(options: Pipeline) {
  try {
    const {
      icons,
      names = [],
      selectionPath,
      forceOverride = false,
      whenFinished,
      visible = false,
    } = options;

    const outputDir = options.outputDir
      ? getAbsolutePath(options.outputDir)
      : DEFAULT_OPTIONS.outputDir;
    // prepare stage
    logger("Preparing...");
    if (!icons || !icons.length) {
      if (whenFinished) {
        whenFinished({ outputDir });
      }
      return logger("No new icons found.");
    }
    if (!selectionPath) {
      throw new Error("Please config a valid selection file path.");
    }
    let absoluteSelectionPath = getAbsolutePath(selectionPath);
    checkDuplicateName(
      {
        selectionPath: absoluteSelectionPath,
        icons,
        names,
      },
      forceOverride
    );
    console.log("outputDir", outputDir);
    await fs.remove(outputDir);
    await fs.ensureDir(outputDir);

    const browser = await puppeteer.launch({ headless: !visible });
    logger("Started a new chrome instance, going to load icomoon.io.");
    const page: Page = await (await browser).newPage();
    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: outputDir,
    });
    // icomoon 사이트로
    await page.goto("https://icomoon.io/app/#/select");
    await page.waitForSelector(PAGE.IMPORT_CONFIG_BUTTON);
    logger("Dashboard is visible, going to upload config file");
    // remove init set
    await page.click(PAGE.MENU_BUTTON);
    await page.click(PAGE.REMOVE_SET_BUTTON);

    const importInput = await page.waitForSelector(PAGE.IMPORT_SELECTION_INPUT);
    // @ts-ignore
    await importInput.uploadFile(absoluteSelectionPath);
    await page.waitForSelector(PAGE.OVERLAY_CONFIRM, { visible: true });
    await page.click(PAGE.OVERLAY_CONFIRM);
    console.log("selectionPath", selectionPath);
    const selection = fs.readJSONSync(selectionPath);
    console.log("lets selection:", selection);
    if (selection.icons.length === 0) {
      logger("Selection icons is empty, going to create an empty set");
      await page.click(PAGE.MAIN_MENU_BUTTON);
      await page.waitForSelector(PAGE.NEW_SET_BUTTON, { visible: true });
      await page.click(PAGE.NEW_SET_BUTTON);
    }
    logger("Uploaded config, going to upload new icon files");
    await page.click(PAGE.MENU_BUTTON);
    const iconInput = await page.waitForSelector(PAGE.ICON_INPUT);
    const iconPaths = icons.map(getAbsolutePath);
    // @ts-ignore
    await iconInput.uploadFile(...iconPaths);
    await page.waitForSelector(PAGE.FIRST_ICON_BOX);
    await page.click(PAGE.SELECT_ALL_BUTTON);
    logger("Uploaded and selected all new icons");
    await page.click(PAGE.GENERATE_LINK);
    await page.waitForSelector(PAGE.GLYPH_SET);
    if (names.length) {
      logger("Changed names of icons");
      // sleep to ensure indexedDB is ready
      await wait(1000);
      await page.evaluate((names) => {
        const request = indexedDB.open("IDBWrapper-storage", 1);
        request.onsuccess = function () {
          const db = request.result;
          const tx = db.transaction("storage", "readwrite");
          const store = tx.objectStore("storage");
          const keys = store.getAllKeys();
          keys.onsuccess = function () {
            let timestamp;
            keys.result.forEach(function (key) {
              if (typeof key === "number") {
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
    logger(`Started to download ${zipName}`);
    const zipPath = path.join(outputDir, zipName);
    await checkDownload(zipPath);
    logger("Successfully downloaded, going to unzip it.");
    await page.close();
    // unzip stage
    const result = await extract(zipPath, { dir: outputDir }).catch(
      (err: any) => {
        console.log("zip file error ", err);
        return false;
      }
    );
    if (!result) {
      console.log("알집 해제 실패");
      return;
    }
    await fs.remove(zipPath);
    logger(`Finished. The output directory is ${outputDir}.`);
    if (whenFinished) {
      whenFinished({ outputDir });
    }
  } catch (error) {
    console.error(error);
  }
}

export default pipeline;