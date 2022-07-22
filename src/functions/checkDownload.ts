import fs from "fs-extra";
import { DEFAULT_TIMEOUT } from "@/const";

const checkDownload = (dest: any) =>
  new Promise<void>((resolve, reject) => {
    const interval = 1000;
    let downloadSize = 0;
    let timeCount = 0;
    const timer = setInterval(async () => {
      timeCount += interval;
      let exist = false;
      await fs.exists(dest, (result: boolean) => (exist = result));
      if (!exist) {
        return;
      }
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
    }, interval);
  });

export { checkDownload };