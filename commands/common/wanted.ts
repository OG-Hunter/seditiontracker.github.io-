import YAML from "yaml";
import { readFile, writeFile } from "./file";
import fs from "fs";

export interface Wanted {
  id: number;
  arrested: boolean;
  aom: boolean;
  afo: boolean;
  label: string;
  src: string;
  hashtag?: string;
  sedition_link?: string;
  charged?: string;
}

export const updateWanted = (wanted: Wanted) => {
  writeFile(`./data/wanted/${wanted.id}.yml`, YAML.stringify(wanted));
};

export const listWanted = (): Wanted[] => {
  const wanted = [];
  const suspectFiles = fs.readdirSync("./data/wanted");

  for (const file of suspectFiles) {
    wanted.push(YAML.parse(readFile(file)));
  }

  return wanted;
};
