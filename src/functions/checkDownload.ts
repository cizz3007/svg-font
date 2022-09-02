import fs from "fs-extra";
import { DEFAULT_TIMEOUT } from "../const/index.js";

const checkDownload = (dest: any) =>
  new Promise<void>((resolve, reject) => {
    const interval = 1000;
    let downloadSize = 0;
    let timeCount = 0;
    const timer = setInterval(async () => {
      timeCount += interval;
      //Stability: 0 - Deprecated: Use fs.stat() or fs.access() instead.
      // access api 는 폴더가 존재하는지 확인.
      await fs.access(dest, (err: any) => {
        if (err) {
          return;
        } else {
          const stats = fs.statSync(dest);
          if (stats.size > 0 && stats.size === downloadSize) {
            clearInterval(timer);
            resolve();
          } else {
            downloadSize = stats.size;
          }
          if (timeCount > DEFAULT_TIMEOUT) {
            reject("Timeout when download file, please check your network.");
          }
        }
      });
    }, interval);
  });

export { checkDownload };