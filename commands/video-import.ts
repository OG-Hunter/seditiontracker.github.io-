import { Command } from "commander";
import { info, warning } from "./common/console";
import { readFile} from "./common/file"
import { parse } from 'node-html-parser';
import { getSuspects, getVideoUrls, updateSuspect, Video } from "./common/suspect";
import { match } from "assert";

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
    let multiMatch = false

    // parse the case number
    const h3 = caze.querySelector("h3").innerText.trim();

    const h2 = caze.querySelector("h2").innerText.trim();
    let lastName

    if (/USA v\. (.*)/.test(h2)) {
      lastName = RegExp.$1
    } else {
      warning(`Could not parse last name: ${h2}`)
    }

    const suspects = getSuspects()
    let kount = 0

    let matchedSuspect

    for (const suspect of suspects) {
      if (suspect.name.includes(lastName)) {
        matchedSuspect = suspect
        kount++
      }

      if (kount > 1) {
        multiMatch = true
        break
      }
    }

    if (!matchedSuspect) {
      warning(`unable to find suspect with last name: ${lastName}`)
    }


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

        let duplicate = false
        matchedSuspect.videos.forEach(video => {
          if ((video.url) == url) {
            duplicate = true
          }
        });

        if (duplicate) {
          continue
        }

        if (multiMatch) {
          warning(`multiple matches for ${lastName} - ${h3}`)
          console.log(`url: ${url}`)
          console.log(`title: ${title}`)
          continue
        }

        info(title)
        console.log(url)

        matchedSuspect.videos.push({title, url})
        updateSuspect(matchedSuspect)
      }
    } else {
      warning(`Could not parse: ${h3}`)
    }
  }

}

runImport();
