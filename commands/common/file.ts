import fs from "fs";
import * as path from "path";
import untildify from "untildify";

export const readFile = (filename: string) => {
  return fs.readFileSync(path.join(__dirname, `../../${filename}`), "utf8");
};

export const writeFile = (filename: string, data: string) => {
  return fs.writeFileSync(path.join(__dirname, `../../${filename}`), data);
};

export const readJson = (filename: string) => {
  return JSON.parse(readFile(filename));
};

export const writeLines = (filename: string, lines: string[]) => {
  const cleanLines = lines.map((line) => {
    line = line.replace(": undefined", ":");
    line = line.replace(": null", ":");
    return line;
  });
  writeFile(filename, cleanLines.join("\n") + "\n");
};

export const splitCSV = (line: string) => {
  const matches = line.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
  for (let n = 0; n < matches.length; ++n) {
    matches[n] = matches[n].trim();
    if (matches[n] == ",") matches[n] = "";
  }
  if (line[0] == ",") matches.unshift("");
  return matches;
};

export const readLines = (filename: string) => {
  const text = readFile(filename);
  return text.split("\n");
};

export const fileExists = (filename: string) => {
  return fs.existsSync(untildify(filename));
};

export const getFiles = (path: string) => {
  const files = fs.readdirSync(path);

  return files.filter((file) => {
    return file != ".DS_Store";
  });
};
