import { Command } from "commander";
import { fileExists, getFiles, readFile, writeFile } from "./common/file";
import { execSync } from "child_process";
import { replace } from "lodash";

const migrate = new Command();
migrate.parse(process.argv);

const doImage = () => {
  const fileList = readFile("./image-list.txt");
  const files = fileList.split("\n");

  for (const file of files) {
    const newFile = file.replace(".png", ".jpg");
    const oldImageName = file.replace(/\.\/docs\/images\/.*\//g, "");
    const newImageName = oldImageName.replace(".png", ".jpg");

    console.log(file);
    execSync(`convert ${file} ${newFile}`, {
      stdio: "inherit",
    });

    const oldBookingImage = `./docs/images/booking/${oldImageName}`;
    if (fileExists(oldBookingImage)) {
      execSync(`convert ${oldBookingImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldCroppedImage = `./docs/images/cropped/${oldImageName}`;
    if (fileExists(oldCroppedImage)) {
      execSync(`convert ${oldCroppedImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldCourtroomImage = `./docs/images/courtroom/${oldImageName}`;
    if (fileExists(oldCourtroomImage)) {
      execSync(`convert ${oldCourtroomImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldCourtHouseImage = `./docs/images/courthouse/${oldImageName}`;
    if (fileExists(oldCourtHouseImage)) {
      execSync(`convert ${oldCourtHouseImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldPerpwalkImage = `./docs/images/perpwalk/${oldImageName}`;
    if (fileExists(oldPerpwalkImage)) {
      execSync(`convert ${oldPerpwalkImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldRaidImage = `./docs/images/raid/${oldImageName}`;
    if (fileExists(oldRaidImage)) {
      execSync(`convert ${oldRaidImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldSuspectImage = `./docs/images/suspect/${oldImageName}`;
    if (fileExists(oldSuspectImage)) {
      execSync(`convert ${oldSuspectImage} ./docs/images/suspect/${newImageName}`, {
        stdio: "inherit",
      });
    }

    const oldPreviewImage = `./docs/images/preview/${oldImageName}`;
    if (fileExists(oldPreviewImage)) {
      execSync(`convert ${oldPreviewImage} ./docs/images/preview/${newImageName}`, {
        stdio: "inherit",
      });
    }

    execSync(`rm -rf ${file}`);

    const suspectFiles = getFiles("./docs/_suspects");
    for (const file of suspectFiles) {
      const markdownFile = `./docs/_suspects/${file}`;
      const originalText = readFile(markdownFile);
      let newText = originalText;
      for (let i = 0; i < 10; i++) {
        newText = replace(newText, oldImageName, newImageName);
      }
      writeFile(markdownFile, newText);
    }
  }
};

doImage();
