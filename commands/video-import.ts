import { Command } from "commander";
import { info, warning } from "./common/console";
import { readFile} from "./common/file"
import { parse } from 'node-html-parser';
import { getSuspectsByCase, getVideoUrls, updateSuspect, Video } from "./common/suspect";

const cmd = new Command();
cmd.parse(process.argv);

const runImport = async() => {
  await importPropublica();
}

const importPropublica = async () => {
  info("Importing video links from Propublica site");

  const html = readFile('./video.html');
  const root = parse(html);

  const cases = root.querySelectorAll("div.j6-case");

  /**
   * Note that a single case number can apply to multiple defendants
   * but the videos usually only pertain to a single individual
   */
  const urls = getVideoUrls()

  for (const caze of cases) {
    // parse the case number
    const h3 = caze.querySelector("h3").innerText.trim();
    if (/Case number: 21-(\D{2}-\d{1,3})/.test(h3)) {
      let caseNumber = `1:21-${RegExp.$1}`

      // HACK to fix ProPublica typo
      if (caseNumber == "1:21-mj-469") {
        caseNumber = "1:21-cr-447"
      }

      const videoDivs = caze.querySelectorAll("div.j6video")

      for (const videoDiv of videoDivs) {
        const p = videoDiv.querySelector("p")
        const title = p.innerText.trim()

        const a = videoDiv.querySelector("a")
        const url = a.getAttribute("href")

        if (urls.has(url)) {
          continue
        }

        info(title)
        console.log(url)

        const suspects = getSuspectsByCase(caseNumber)
        if (suspects.length == 0) {
          warning(`unable to find suspect: ${caseNumber}`)
          continue
        }

        for (const suspect of suspects) {
          console.log("- " + suspect.name)
          suspect.videos.push({title, url})
          updateSuspect(suspect)
        }
      }
    } else {
      warning(`Could not parse: ${h3}`)
    }
  }

}

runImport();
