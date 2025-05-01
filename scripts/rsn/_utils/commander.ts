import { Command } from '@commander-js/extra-typings';

export type CommandAction<TCommand extends Command> = (
    opts: Parameters<Parameters<TCommand['action']>[0]>[0]
) => any;

export function commandAction<TCommand extends Command>(cmd: TCommand, action: CommandAction<TCommand>) {
    cmd.action(action);
    return cmd;
}