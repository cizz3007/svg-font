var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from "fs-extra";
import { DEFAULT_TIMEOUT } from "../const/index.js";
const checkDownload = (dest) => new Promise((resolve, reject) => {
    const interval = 1000;
    let downloadSize = 0;
    let timeCount = 0;
    const timer = setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        timeCount += interval;
        let exist = false;
        yield fs.exists(dest, (result) => (exist = result));
        if (!exist) {
            return;
        }
        const stats = fs.statSync(dest);
        if (stats.size > 0 && stats.size === downloadSize) {
            clearInterval(timer);
            resolve();
        }
        else {
            downloadSize = stats.size;
        }
        if (timeCount > DEFAULT_TIMEOUT) {
            reject("Timeout when download file, please check your network.");
        }
    }), interval);
});
export { checkDownload };
//# sourceMappingURL=checkDownload.js.map