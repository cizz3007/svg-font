#!/usr/bin/env node
var _a, _b, _c, _d;
import yargs from 'yargs';
import pipeline from './index.js';
import { hideBin } from 'yargs/helpers';
const argv = yargs(hideBin(process.argv))
    .option('s', {
    alias: 'selection',
    demand: true,
    describe: 'selection.json 파일이 위치하는 경로',
})
    .option('d', {
    alias: 'directory',
    demand: false,
    describe: 'svg 파일들이 위치한 폴더를 입력해 주세요.',
})
    .option('i', {
    alias: 'icons',
    describe: '불러와져야 하는 아이콘들입니다. 쉼표로 구분 나눠집니다.',
    demand: false,
})
    .option('n', {
    alias: 'names',
    describe: '아이콘 이름 바꾸기, 쉼표로 구분, 색인으로 일치\n',
    demand: false,
})
    .option('o', {
    alias: 'output',
    default: './output',
    demand: false,
    describe: '결과물이 위치할 파일 디렉토리',
})
    .option('f', {
    alias: 'force',
    default: false,
    demand: false,
    describe: '아이콘 이름이 중복되면 현재 아이콘을 덮어 씌웁니다.',
})
    .option('v', {
    alias: 'visible',
    default: false,
    demand: false,
    describe: '크롬 브라우저를 띄울지 여부를 결정합니다.',
})
    .option('t', {
    alias: 'imageType',
    default: 'svg',
    demand: false,
    describe: '어떤 이미지 포맷을 변환할지 설정할 수 있습니다.',
}).argv;
pipeline({
    selectionPath: argv.s,
    icons: (_b = (_a = argv.i) === null || _a === void 0 ? void 0 : _a.split(',')) !== null && _b !== void 0 ? _b : [],
    names: (_d = (_c = argv.n) === null || _c === void 0 ? void 0 : _c.split(',')) !== null && _d !== void 0 ? _d : [],
    outputDir: argv.o,
    forceOverride: argv.f,
    visible: argv.v,
    directory: argv.d,
});
//# sourceMappingURL=cli.js.map