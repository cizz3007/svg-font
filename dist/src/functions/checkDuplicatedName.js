import path from 'path';
import fs from 'fs-extra';
const checkDuplicateName = ({ selectionPath, icons, names }, forceOverride) => {
    const iconNames = icons.map((icon, index) => {
        if (names[index]) {
            return names[index];
        }
        return path.basename(icon).replace(path.extname(icon), '');
    });
    const duplicates = [];
    const selection = fs.readJSONSync(selectionPath);
    selection.icons.forEach(({ properties }, index) => {
        if (iconNames.includes(properties.name)) {
            duplicates.push({ name: properties.name, index });
        }
    });
    if (!duplicates.length) {
        return;
    }
    if (forceOverride) {
        selection.icons = selection.icons.filter((icon, index) => !duplicates.some((d) => d.index === index));
        fs.writeJSONSync(selectionPath, selection, { spaces: 2 });
    }
    else {
        throw new Error(`중복되는 이름을 찾았습니다 : ${duplicates.map((d) => d.name).join(',')}`);
    }
};
export { checkDuplicateName };
//# sourceMappingURL=checkDuplicatedName.js.map