import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const suspect = new Command()
  .command("import", "import charges from CSV")
  .command("missing", "list suspects that are missing charges")
suspect.parse(process.argv);

const subCmd = head(suspect.args);
const cmds = map(suspect.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  suspect.help();
}
