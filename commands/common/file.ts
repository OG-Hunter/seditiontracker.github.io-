import fs from "fs";
import * as path from "path";

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
  const cleanLines = lines.map( (line) => {
    return line.replace(": undefined", ":")
  })

  writeFile(filename, cleanLines.join("\n") + "\n")
}

export const splitCSV = (line:string) => {
  var matches = line.match(/(\s*"[^"]+"\s*|\s*[^,]+|,)(?=,|$)/g);
  for (var n = 0; n < matches.length; ++n) {
      matches[n] = matches[n].trim();
      if (matches[n] == ',') matches[n] = '';
  }
  if (line[0] == ',') matches.unshift("");
  return matches;
}
