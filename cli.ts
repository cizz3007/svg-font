#!/usr/bin/env node
import yargs from 'yargs';
import pipeline from './index.js';
import { hideBin } from 'yargs/helpers';

//  --version --selection -s --icon -i 등등 받는 옵션을 설정할 수 있다.

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
    // @ts-ignore
    selectionPath: argv.s,
    // @ts-ignore
    icons: argv.i?.split(',') ?? [], // 넘어온 argument들을 split해서 넘김
    // @ts-ignore
    names: argv.n?.split(',') ?? [], // 넘어온 argument들을 split해서 넘김
    // @ts-ignore
    outputDir: argv.o,
    // @ts-ignore
    forceOverride: argv.f,
    // @ts-ignore
    visible: argv.v,
    // @ts-ignore
    directory: argv.d,
});