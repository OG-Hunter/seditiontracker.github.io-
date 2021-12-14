import { Command } from "commander";
import { head, includes, map } from "lodash";
import { error } from "./common/console";

const suspect = new Command()
  .command("preview", "creates a preview image for the suspect")
  .command("new", "adds a template for a new suspect")
  .command("import", "import suspects from an external source")
  .command("unpublished", "list unpublished suspects")
  .command("verify", "verify all required elements present before publishing")
  .command("convict", "mark a new suspect as convicted")
  .command("sentence", "mark a new suspect as sentenced")
  .command("migrate", "migrate suspects to latest data model")
  .command("indict", "mark a suspect as indicted")
  .command("missing", "list suspects with missing info");

suspect.parse(process.argv);

const subCmd = head(suspect.args);
const cmds = map(suspect.commands, "_name");

if (!includes(cmds, subCmd)) {
  error("unknown command");
  suspect.help();
}
