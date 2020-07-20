import { LoggerFunc } from ".";

export interface ClientFactoryOptions {
  logger: LoggerFunc;
  protocol: "http" | "https";
  host: string;
  port: number;
}

export interface RunOptions<TCurrent, TAcc> {
  callback?: (accumlator: TAcc, current: TCurrent) => TAcc;
  initialValue?: TAcc;
}

export interface Client {
  run: <TCurrent extends {}, TAcc extends {}>(
    obj: string,
    op: string,
    body: any,
    opts: RunOptions<TCurrent, TAcc>
  ) => Promise<any>;
}

export const buildClient = async (
  adzerkApiKey: string,
  opts: ClientFactoryOptions
): Promise<Client> => {
  return {
    async run(obj, op, body, opts) {},
  };
};
