import YAML from "yaml";
import { readFile, writeFile } from "./file";
import fs from "fs";

export interface Wanted {
  id: number;
  arrested: boolean;
  identified: boolean;
  aom: boolean;
  afo: boolean;
  label: string;
  src: string;
  mugshot?: string;
  hashtag?: string;
  sedition_link?: string;
  charged?: string;
  name?: string;
  duplicate: boolean;
}

export const updateWanted = (wanted: Wanted) => {
  const filename = `./data/wanted/${wanted.id}.yml`;
  const data = readFile(filename);

  if (wanted.charged) {
    wanted.arrested = true;
  }

  if (wanted.arrested) {
    wanted.identified = true;
  }

  // preserve old values unless overwritten with another non null value
  if (data) {
    const oldWanted = <Wanted>YAML.parse(data);
    wanted.charged ||= oldWanted.charged;
    wanted.mugshot ||= oldWanted.mugshot;
    wanted.hashtag ||= oldWanted.hashtag;
    wanted.sedition_link ||= oldWanted.sedition_link;
    wanted.name ||= oldWanted.name;

    if (oldWanted.identified) {
      wanted.identified = true;
    }

    if (oldWanted.duplicate) {
      wanted.duplicate = true;
    }
  }

  writeFile(filename, YAML.stringify(wanted));
};

export const listWanted = (): Wanted[] => {
  const wanted = [];
  const suspectFiles = fs.readdirSync("./data/wanted");

  for (const file of suspectFiles) {
    wanted.push(YAML.parse(readFile(`./data/wanted/${file}`)));
  }

  return wanted;
};
