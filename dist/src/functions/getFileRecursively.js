var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import path from 'path';
const getFileRecursively = function (dir, done) {
    return __awaiter(this, void 0, void 0, function* () {
        let results = [];
        fs.readdir(dir, function (err, list) {
            if (err)
                return done(err);
            let pending = list.length;
            if (!pending)
                return done(null, results);
            list.forEach(function (file) {
                file = path.resolve(dir, file);
                fs.stat(file, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        getFileRecursively(file, function (err, res) {
                            results = results.concat(res);
                            if (!--pending)
                                done(null, results);
                        });
                    }
                    else {
                        if (file.endsWith('svg')) {
                            results.push(file);
                        }
                        console.log('results:', results);
                        if (!--pending)
                            done(null, results);
                    }
                });
            });
        });
        return results;
    });
};
export { getFileRecursively };
//# sourceMappingURL=getFileRecursively.js.map