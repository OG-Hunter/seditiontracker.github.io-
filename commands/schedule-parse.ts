import { Command } from "commander";
import fs from "fs";
import { load } from "cheerio";
import { pad } from "lodash";
import { getSuspectByFile } from "./common/suspect";
import { readFile } from "./common/file";

const cmd = new Command();
cmd.parse(process.argv);

type CaseMap = {
  [caseNumber: string]: string;
};

const getCaseMap = (): CaseMap => {
  const suspectFiles = fs.readdirSync("./docs/_suspects");
  // console.log(`${suspectFiles.length} suspect files`);
  const caseMap: CaseMap = {};

  for (const suspectFile of suspectFiles) {
    const suspect = getSuspectByFile(suspectFile);

    if (/1:(21|22|23)-cr-(.*)/.test(suspect?.caseNumber)) {
      const year = pad(RegExp.$1);
      const number = pad(RegExp.$2, 4, "0");
      const caseNumber = `1:${year}-${number}`;
      caseMap[caseNumber] = suspectFile;
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
  const tbody = $("tbody");
  const rows = tbody.children("tr");

  for (const row of rows) {
    let caseText: string;
    let judgeText: string;
    let dateText: string;
    let typeText: string;

    $("td", row).each((index, element) => {
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

    // $("td nowrap", row).each((index, element) => {
    //   console.log($(element).text());
    //   //   break;
    //   // switch (index) {
    //   //   case 0:
    //   //     caseText = $(element).text();
    //   //     break;
    //   //   case 1:
    //   //     judgeText = $(element).text();
    //   //     break;
    //   //   case 2:
    //   //     console.log($(element).children.length);
    //   //     // console.log($(element).text());
    //   //     break;
    //   //   case 4:
    //   //     typeText = $(element).text();
    //   //     break;
    //   // }
    // });

    // const caseText = $("td:nth-child(1)", row);
    // const judgeText = $("td:nth-child(1)", row);

    // const caseText = $("td", row).text();
    // const judgeText = $("td", row).text();

    console.log({ caseText });
    console.log({ judgeText });
    console.log({ dateText });
    console.log({ typeText });
    // const cells = $("td", row).children("td");
    // const caseText = cells[0];
    // console.log({ caseText });
    // for (const cel)
    // const faceLink = $("td.column-1 a", row)?.attr("href");
    // const altLink = $("td.column-2 a", row)?.attr("href");
    // const status = $("td.column-3", row).text();
    // const hashtag = $("td.column-4", row).text().replace("#", "");
    // const info = $("td.column-5", row).text();

    // chuds.push({
    //   face: faceLink,
    //   altPhoto: altLink || "",
    //   status,
    //   hashtag: hashtag || "",
    //   info: info || "",
    // });
  }
  // console.log(JSON.stringify(caseMap, null, 2));
};

parseSchedule();
