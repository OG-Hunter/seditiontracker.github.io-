import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const command = new Command().command("image", "fixes image size by converting to jpg");

command.parse(process.argv);

const subCmd = head(command.args);
const cmds = map(command.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  command.help();
}
