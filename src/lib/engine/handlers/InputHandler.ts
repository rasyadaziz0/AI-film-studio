import { BaseNodeHandler, ExecutionContext } from "./BaseNodeHandler";

export class InputHandler extends BaseNodeHandler {
  public async execute(context: ExecutionContext): Promise<string> {
    const { node, finalUserInput } = context;
    // For input/telegram_trigger, the output is simply the user input.
    return finalUserInput || node.user_input || "";
  }
}
