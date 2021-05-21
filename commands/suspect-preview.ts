import { Command } from "commander";
import { info } from "./common/console";
import fs from "fs";
import { readFile } from "./common/file";

const { execSync } = require('child_process')

const preview = new Command()
  .option("-f, --file <file>", "cropped file to use for preview")
  .option("-s, --status <status>", "status of suspect", "CHARGED")
  .option("--delete", "delete existing preview file")

preview.parse(process.argv);

const generatePreview = (previewImage, status) => {
  const width = (function(status) {switch (status) {
    case "CONVICTED":
      return 223;
    case "CHARGED":
      return 185;
    case "INDICTED":
      return 205;
    default:
      return 200;
  }
  })(status)

  execSync(`convert docs/images/cropped/${previewImage} -strokewidth 3 -fill red -draw "rectangle 40,10 ${width},50" -fill white -strokewidth 3 -fill white -stroke black -strokewidth 10 -pointsize 32 -font Courier-Bold -draw "text 45,40 '${status}'" -stroke none -draw "text 45,40 '${status}'" docs/images/preview/${previewImage}`, {
    stdio: 'inherit'
  })
}

const doPreview = () => {
  if (preview.file) {
    if (preview.delete) {
      info("deleting preview image")
      console.log(`rm -rf ./docs/images/preview/${preview.file}`)
      execSync(`rm -rf ./docs/images/preview/${preview.file}`)
      execSync(`rm -rf ./docs/images/suspect/${preview.file}`)
      execSync(`rm -rf ./docs/images/cropped/${preview.file}`)
    } else {
      info("generating preview image")
      const status = preview.status.toUpperCase() || "CHARGED"
      generatePreview(preview.file, status);
    }
  } else {
    const suspects = fs.readdirSync('./docs/_suspects');
    info("creating preview images");

      for (const suspect of suspects) {
      console.log(suspect)
      const data = readFile(`./docs/_suspects/${suspect}`)
      const status = data.match(/.*status:(.*)\n/)[1].trim().toUpperCase();
      const preview = data.match(/.*image:.*\/preview\/(.*\.png|.*\.jpg|.*\.webp)\n/)[1].trim();
      generatePreview(preview,status)
    }
  }
}

doPreview();
