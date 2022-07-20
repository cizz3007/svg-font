#!/usr/bin/env node
import yargs from "yargs";
import pipeline from "./dist/bundle.js";
import { hideBin } from "yargs/helpers";
const argv = yargs(hideBin(process.argv))
    .option("s", {
    alias: "selection",
    demand: true,
    describe: "selection 파일이 위치하는 경로",
})
    .option("i", {
    alias: "icons",
    describe: "불러와져야 하는 아이콘들입니다. 쉼표로 구분 나눠집니다.",
    default: "",
})
    .option("n", {
    alias: "names",
    describe: "아이콘 이름 바꾸기, 쉼표로 구분, 색인으로 일치\n",
    default: "",
})
    .option("o", {
    alias: "output",
    default: "./output",
    describe: "결과물이 위치할 파일 디렉토리",
})
    .option("f", {
    alias: "force",
    default: false,
    describe: "아이콘 이름이 중복되면 현재 아이콘을 덮어 씌웁니다.",
})
    .option("v", {
    alias: "visible",
    default: false,
    describe: "run a GU I chrome instead of headless mode",
})
    .option("t", {
    alias: "imageType",
    default: "svg",
    describe: "어떤 이미지 포맷을 변환할지 설정할 수 있습니다.",
}).argv;
pipeline({
    selectionPath: argv.s,
    icons: argv.i.split(","),
    names: argv.n.split(","),
    outputDir: argv.o,
    forceOverride: argv.f,
    visible: argv.v,
});
//# sourceMappingURL=test.js.map