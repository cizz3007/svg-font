import fs from 'fs';
import path from 'path';

const getFileRecursively = async function (dir, done) {
    let results = [];
    fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        // 데이터가 있는지 확인
        let pending = list.length;
        // 데이터가 없으면 결과 반환
        if (!pending) return done(null, results);
        // 데이터가 있으니 병렬로 진행
        list.forEach(function (file) {
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    //재귀
                    getFileRecursively(file, function (err, res) {
                        results = results.concat(res);
                        if (!--pending) done(null, results);
                    });
                } else {
                    if (file.endsWith('svg')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
    return results;
};

export { getFileRecursively };