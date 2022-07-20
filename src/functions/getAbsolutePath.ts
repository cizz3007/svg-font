import path from "path";

const getAbsolutePath = (inputPath: string) => {
  let absoluteSelectionPath = inputPath;
  if (!path.isAbsolute(inputPath)) {
    if (!process.env.PWD) {
      process.env.PWD = process.cwd();
    }
    absoluteSelectionPath = path.resolve(process.env.PWD, inputPath);
  }
  return absoluteSelectionPath;
};

export { getAbsolutePath };