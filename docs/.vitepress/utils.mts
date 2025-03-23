import { readdirSync } from "fs";
import { resolve } from "path";

export const scanDir = (pathName) => {
  const path = resolve(__dirname, `${pathName}`);
  return getMsg(path);
};

export const getMsg = (path) => {
  const dir = resolve(__dirname, "../");
  let res = readdirSync(path).filter((item) => !(String(item) === ".DS_Store"));

  if (res) {
    let arr = res.map((item) => {
      if (String(item).endsWith(".md")) {
        const link = resolve(path, item).replace(dir, "");
        return {
          text: item.split(".")[0],
          link,
        };
      } else {
        return {
          text: item.split(".")[0],
          items: getMsg(resolve(path, item)),
          collapsed: true,
        };
      }
    });

    arr = arr.map((item) => {
      if (item.link) {
        item.link = translateDir(item.link);
      }
      return item;
    });

    const readmeI = arr.findIndex((item) => item.text === "README");
    const readme = arr[readmeI];
    if (readmeI !== -1) {
      arr.splice(readmeI, 1);
      arr.unshift(readme);
    }

    return arr;
  } else {
    console.warn("warn: no files in this directory");
  }
};

/**
 *
 * @param {string} path
 * @returns
 */
function translateDir(path) {
  return path.replace(/\\/g, "/").split(".")[0];
}
