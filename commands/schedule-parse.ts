import { Command } from "commander";
import fs from "fs";
import { load } from "cheerio";
import { getSuspectByFile, Suspect, updateSuspect } from "./common/suspect";
import { readFile } from "./common/file";

const cmd = new Command();
cmd.parse(process.argv);

type CaseMap = {
  [caseNumber: string]: Suspect;
};

const getCaseMap = (): CaseMap => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  console.log(`${suspectFiles.length} suspect files`);
  const caseMap: CaseMap = {};

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);
    const { caseNumber } = suspect;
    if (caseNumber) {
      caseMap[caseNumber] = suspect;
    }
  }
  // const keys = Object.keys(caseMap);
  // console.log(`${keys.length} case numbers found`);
  return caseMap;
};

const parseSchedule = async () => {
  const caseMap = getCaseMap();

  const html = readFile("schedule.html");
  const $ = load(html);

  $("body > table#ts > tbody > tr").each((index, element) => {
    // let caseText: string;
    let judgeText: string;
    let dateText: string;
    let typeText: string;
    let caseText: string;

    $("td", element).each((index, element) => {
      switch (index) {
        case 0:
          caseText = $(element).text();
          break;
        case 1:
          judgeText = $(element).text();
          break;
        case 2:
          dateText = $(element).text();
          break;
        case 4:
          typeText = $(element).text();
          break;
      }
    });

    /(.*):(.*)/.test(caseText);
    const caseNumber = RegExp.$1;
    const caseName = RegExp.$2.trim();

    /Judge (.*)/.test(judgeText);
    const judge = RegExp.$1;

    const suspect = caseMap[caseNumber];

    if (suspect) {
      suspect.caseName = caseName;
      suspect.judge = judge;
      console.log({ dateText });
      console.log({ typeText });

      updateSuspect(suspect);
    }
  });
};

parseSchedule();
