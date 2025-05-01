import { z } from 'zod';

// Define the possible operations that can be performed according to RFC 6902
const JsonPatchOperationTypeSchema = z.enum(["add", "remove", "replace", "move", "copy", "test", "_get"]);

// Define the path to the target location using JSON Pointer (RFC 6901)
const JsonPointerSchema = z.string()
    // .regex(/^(\/[^/~]*(~[01][^/~]*)*)*$/)
    .describe("JSON Pointer syntax (RFC 6901)");

const JsonPatchOpBaseSchema = z.object({
    path: JsonPointerSchema,
});

const JsonPatchOpAddSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("add"),
    value: z.any(),
});

const JsonPatchOpRemoveSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("remove"),
});

const JsonPatchOpReplaceSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("replace"),
    value: z.any(),
});

const JsonPatchOpMoveSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("move"),
    from: JsonPointerSchema,
});

const JsonPatchOpCopySchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("copy"),
    from: JsonPointerSchema,
});

const JsonPatchOpTestSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("test"),
    value: z.any(),
});


const JsonPatchOpGetSchema = JsonPatchOpBaseSchema.extend({
    op: z.literal("_get"),
    value: z.any(),
});

// Define the JSON Patch Operation schema
const JsonPatchOperationSchema = z.union([
    JsonPatchOpAddSchema,
    JsonPatchOpRemoveSchema,
    JsonPatchOpReplaceSchema,
    JsonPatchOpMoveSchema,
    JsonPatchOpCopySchema,
    JsonPatchOpTestSchema,
    JsonPatchOpGetSchema,
])
.refine(
    (data) => {
        // Validate operation-specific requirements
        switch (data.op) {
            case "_get":
                return true;
            case "move":
            case "copy":
                return !!data.from;
            case "add":
            case "replace":
            case "test":
                return data.value !== undefined;
            case "remove":
                return true;
            default:
                return false;
        }
    },
    {
        message: "Invalid combination of operation and required fields",
    }
);

// Type for a JSON Patch document (array of operations)
const JsonPatchSchema = z.array(JsonPatchOperationSchema);

export {
  JsonPatchOperationSchema,
  JsonPatchOperationTypeSchema,
  JsonPatchSchema,
  JsonPointerSchema,
};