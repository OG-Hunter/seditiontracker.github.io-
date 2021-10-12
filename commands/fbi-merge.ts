import { Command } from "commander";
import fs from "fs";
import { getSuspectByFile, updateSuspect } from "./common/suspect";
const { execSync } = require("child_process");
import { readLines } from "./common/file";
import { info } from "./common/console";
import { listWanted, updateWanted } from "./common/wanted";

const cmd = new Command();
cmd.parse(process.argv);

const doMerge = () => {
  info("Merging FBI data");
  console.log("hashtags");
  const lines = readLines("./data/hashtags.csv");
  const tagMap = {};

  for (const line of lines) {
    const matches = line.match(/#(\w*),(\d{1,3})/);
    if (matches) {
      const hashtag = matches[1];
      const id = matches[2];

      tagMap[id] = hashtag;
    }
  }

  for (const wanted of listWanted()) {
    wanted.hashtag ||= tagMap[wanted.id] || "";
    updateWanted(wanted);
  }

  // const suspects = fs.readdirSync("./docs/_suspects");
  // for (const filename of suspects) {
  //   const suspect = getSuspectByFile(filename);
  //   // const newLinks = {};
  //   // for (const [type, url] of Object.entries(suspect?.links)) {
  //   //   let newType: string;
  //   //   if (type == "Complaint") {
  //   //     if (suspect?.links["Statement of Facts"]) {
  //   //       continue; // duplicate - ignore
  //   //     } else {
  //   //       newType = "Statement of Facts";
  //   //     }
  //   //   }
  //   //   newType ||= type;
  //   //   newLinks[newType] = url;
  //   // }
  //   // suspect.links = newLinks;
  //   if (suspect.hashtag) {
  //     continue;
  //   }
  //   suspect.hashtag = suspect.name.replace(" ", "").replace("-", "");
  //   updateSuspect(suspect);
  // }
};

doMerge();
