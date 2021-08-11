import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const suspect = new Command()
  .command("import", "import video from ProPublica (download the HTML locally first)")

suspect.parse(process.argv);

const subCmd = head(suspect.args);
const cmds = map(suspect.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  suspect.help();
}
