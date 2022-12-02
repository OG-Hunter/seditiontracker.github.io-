import { Command } from "commander";
import { info } from "./common/console";
import axios from "axios";
import { HTMLElement, parse } from "node-html-parser";
import { updateWanted, Wanted } from "./common/wanted";
import dotenv from "dotenv";

dotenv.config();

const cmd = new Command();
cmd.parse(process.argv);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36";

const scrapeFBI = async () => {
  info("Scraping FBI Website");

  for (let i = 0; i < 5; i++) {
    const html = await axios.get(
      `https://www.fbi.gov/wanted/capitol-violence/@@castle.cms.querylisting/6cadaf5c442c4711a515e20c9380d18f?page=${i}`,
      { headers: { "User-Agent": USER_AGENT } },
    );
    const root = parse(html.data);

    const items: HTMLElement[] = root.querySelectorAll("li");

    for (const item of items) {
      const image = item.querySelector("img");
      const { src, alt } = image.attributes;

      const id = alt.match(/Photographs? #(\d{1,})/)[1];
      // const variation = alt.match(/\b([A-Z]{1})\b/)?.[1] || alt.match(/\d{1,3}([A-Z])/)?.[1] || "";
      const arrested = /Arrested/.test(alt);
      const afo = /AFO/.test(alt);
      const aom = /AOM/.test(alt);

      const wanted: Wanted = {
        id: parseInt(id),
        aom,
        afo,
        arrested,
        identified: arrested ? true : false,
        label: alt,
        src,
        hashtag: null,
        fugitive: false,
        minor: false,
        deceased: false,
        duplicate: false,
      };

      updateWanted(wanted);
    }
  }
};

scrapeFBI();
