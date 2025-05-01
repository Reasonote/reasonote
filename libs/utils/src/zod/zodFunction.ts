import {
    OuterTypeOfFunction,
    z,
    ZodTuple,
    ZodUnknown,
} from "zod";

type ImplementedFunctionWithSchema<TArgs extends ZodTuple<any, any>, TReturns extends z.ZodTypeAny> = { schema: { args: TArgs; returns: TReturns } } & ((...args: z.infer<TArgs>) => z.infer<TReturns>);

class ZodFunctionBuilder<TArgs extends ZodTuple<any, any>, TReturns extends z.ZodTypeAny> {
  private argsSchema?: TArgs;
  private returnsSchema?: TReturns;

  args<Items extends Parameters<(typeof ZodTuple)["create"]>[0]>(...schemas: Items): ZodFunctionBuilder<ZodTuple<Items, ZodUnknown>, TReturns> {
    return new ZodFunctionBuilder<ZodTuple<Items, ZodUnknown>, TReturns>(
      ZodTuple.create(schemas).rest(ZodUnknown.create()) as any,
      this.returnsSchema
    );
  }

  returns<TNewReturns extends z.ZodTypeAny>(newReturnSchema: TNewReturns): ZodFunctionBuilder<TArgs, TNewReturns> {
    return new ZodFunctionBuilder<TArgs, TNewReturns>(this.argsSchema, newReturnSchema);
  }

  implement(func: OuterTypeOfFunction<TArgs, TReturns>): ImplementedFunctionWithSchema<TArgs, TReturns> {
    if (!this.argsSchema || !this.returnsSchema) {
      throw new Error("Both args and returns must be defined before implementing");
    }

    const schema = z.function(this.argsSchema, this.returnsSchema);
    const validatedFunc = schema.implement(func);

    return Object.assign(validatedFunc, {
      schema: { args: this.argsSchema, returns: this.returnsSchema },
    });
  }

  constructor(argsSchema?: TArgs, returnsSchema?: TReturns) {
    this.argsSchema = argsSchema;
    this.returnsSchema = returnsSchema;
  }
}

/**
 * Create a new ZodFunctionBuilder
 * @returns A new ZodFunctionBuilder
 * 
 * @example
 * const addTrimmedLengths = zodFunc()
 *   .args(z.string(), z.string())
 *   .returns(z.number())
 *   .implement((x, y) => x.trim().length + y.trim().length);
 * 
 * addTrimmedLengths("  hello  ", "  world  "); // 11
 * addTrimmedLengths("hello", "world"); // 7
 * 
 * // This will now cause both a TypeScript and a runtime error
 * addTrimmedLengths("hello");
 */
export function zodFunc() {
  return new ZodFunctionBuilder();
}
