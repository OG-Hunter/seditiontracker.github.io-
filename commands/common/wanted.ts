import YAML from "yaml";
import { writeFile } from "./file";

export interface Wanted {
  id: number;
  variation?: string;
  arrested: boolean;
  label: string;
  src: string;
}

export const updateWanted = (wanted: Wanted) => {
  writeFile(`./data/wanted/${wanted.id}.yml`, YAML.stringify(wanted));
};
