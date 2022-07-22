import { Pipeline } from "@/type/pipeline.type";
import path from "path";
import fs from "fs-extra";

const checkDuplicateName = (
  { selectionPath, icons, names }: Partial<Pipeline>,
  forceOverride: boolean
) => {
  const iconNames = icons.map((icon: any, index: string | number) => {
    if (names[index]) {
      return names[index];
    }
    return path.basename(icon).replace(path.extname(icon), "");
  });
  const duplicates: { name: any; index: any }[] = [];
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
    selection.icons = selection.icons.filter(
      (icon: any, index: any) => !duplicates.some((d) => d.index === index)
    );
    fs.writeJSONSync(selectionPath, selection, { spaces: 2 });
  } else {
    throw new Error(
      `Found duplicate icon names: ${duplicates.map((d) => d.name).join(",")}`
    );
  }
};

export { checkDuplicateName };