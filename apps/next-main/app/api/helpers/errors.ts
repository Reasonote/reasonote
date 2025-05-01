import { ZodError } from "zod";

import { ApiRoute } from "@reasonote/lib-api-sdk";

export class BasicApiError extends Error {
  constructor(
    public readonly message: string,
    public readonly httpStatusCode: number,
    public readonly data?: any
  ) {
    super(message);
  }
}

export class ApiRouteRequestZodParseError extends Error {
  constructor(
    public readonly apiRoute: ApiRoute<any, any>,
    public readonly zodError: ZodError
  ) {
    super(
      `[ZOD]: Failed to parse request body for route ${apiRoute.path}: ${
        zodError.message
      }. ${JSON.stringify(zodError.format())}`
    );
  }
}
