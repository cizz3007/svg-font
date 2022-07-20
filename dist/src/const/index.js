import path from "path";
const DEFAULT_TIMEOUT = 60000;
const PAGE = {
    IMPORT_CONFIG_BUTTON: ".file.unit",
    IMPORT_SELECTION_INPUT: '.file.unit input[type="file"]',
    OVERLAY_CONFIRM: ".overlay button.mrl",
    NEW_SET_BUTTON: ".menuList1 button",
    MAIN_MENU_BUTTON: ".bar-top button .icon-menu",
    MENU_BUTTON: "h1 button .icon-menu",
    MENU: ".menuList2.menuList3",
    ICON_INPUT: '.menuList2.menuList3 .file input[type="file"]',
    FIRST_ICON_BOX: "#set0 .miBox:not(.mi-selected)",
    REMOVE_SET_BUTTON: ".menuList2.menuList3 li:last-child button",
    SELECT_ALL_BUTTON: 'button[ng-click="selectAllNone($index, true)"]',
    GENERATE_LINK: 'a[href="#/select/font"]',
    GLYPH_SET: "#glyphSet0",
    GLYPH_NAME: ".glyphName",
    DOWNLOAD_BUTTON: ".btn4",
};
const __dirname = path.resolve();
const DEFAULT_OPTIONS = {
    outputDir: path.join(__dirname, "output"),
};
export { DEFAULT_TIMEOUT, PAGE, DEFAULT_OPTIONS };
//# sourceMappingURL=index.js.map