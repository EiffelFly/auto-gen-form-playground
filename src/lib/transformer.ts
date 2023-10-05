import * as z from "zod";
import { JSONSchema7 } from "json-schema";

type InstillJsonSchemaProps = {
  credential_field?: boolean;
  example?: string | number;
  "x-oaiTypeLabel"?: string;
  nullable?: boolean;
};

// This type is especially for jsonSchema OneOf properties
// {"key.subkey.credential": "oauth" }
export type SelectedItemMap = Record<string, string>;

export type InstillJSONSchema = {
  [Property in keyof JSONSchema7]+?: JSONSchema7[Property] extends boolean
    ? boolean
    : Property extends "enum"
    ? string[]
    : Property extends "if" | "then"
    ? InstillJSONSchema
    : Property extends "allOf"
    ? InstillJSONSchema[] | undefined
    : Property extends "properties" | "patternProperties" | "definitions"
    ? Record<string, InstillJSONSchema>
    : JSONSchema7[Property] extends InstillJSONSchema
    ? InstillJSONSchema
    : JSONSchema7[Property] extends InstillJSONSchema[]
    ? InstillJSONSchema[]
    : JSONSchema7[Property] extends InstillJSONSchema | InstillJSONSchema[]
    ? InstillJSONSchema | InstillJSONSchema[]
    : JSONSchema7[Property];
} & InstillJsonSchemaProps;

type instillZodSchema = z.ZodTypeAny;

export const transformInstillJSONSchemaToZod = ({
  parentSchema,
  targetSchema,
  selectedItemMap,
  propertyKey,
  propertyPath,
  forceOptional,
}: {
  parentSchema: InstillJSONSchema;
  targetSchema: InstillJSONSchema;
  selectedItemMap: SelectedItemMap | null;
  propertyKey?: string;
  propertyPath?: string;
  forceOptional?: boolean;
}): instillZodSchema => {
  // const field will be ignored

  let instillZodSchema: z.ZodTypeAny = z.any();

  if (targetSchema.const) {
    instillZodSchema = z.literal(targetSchema.const as string);
    return instillZodSchema;
  }

  // Handle oneOf field
  if (targetSchema.oneOf) {
    const oneOfConditions = targetSchema.oneOf as InstillJSONSchema[];

    const selectedSchema = selectedItemMap
      ? oneOfConditions.find((condition) => {
          const { constKey, constValue } = retriveConstInfo(
            condition.properties ?? {}
          );

          const accessPath = propertyPath
            ? `${propertyPath}.${constKey}`
            : constKey;

          if (!accessPath) {
            return false;
          }

          return (
            constKey && constValue && selectedItemMap[accessPath] === constValue
          );
        })
      : oneOfConditions[0];

    if (selectedSchema) {
      instillZodSchema = transformInstillJSONSchemaToZod({
        parentSchema,
        targetSchema: { type: targetSchema.type, ...selectedSchema },
        selectedItemMap,
      });
    }

    return instillZodSchema;
  }

  // Handle the anyOf fields
  if (targetSchema.anyOf && targetSchema.anyOf.length > 0) {
    const anyOfConditions = targetSchema.anyOf as InstillJSONSchema[];
    const anyOfSchemaArray: z.ZodTypeAny[] = [];

    const isRequired = propertyKey
      ? Array.isArray(parentSchema.required) &&
        parentSchema.required.includes(propertyKey)
      : false;

    for (const condition of anyOfConditions) {
      if (typeof condition !== "boolean") {
        if (condition.properties) {
          const anyOfSchema = parseProperties({
            properties: condition.properties,
            parentSchema: condition,
            selectedItemMap,
            propertyPath,
          });
          anyOfSchemaArray.push(anyOfSchema);
        } else {
          const anyOfSchema = transformInstillJSONSchemaToZod({
            parentSchema,
            targetSchema: condition,
            selectedItemMap,
          });

          anyOfSchemaArray.push(anyOfSchema);
        }
      }
    }

    // Just like what we did for the enum, we also need to do the casting here
    instillZodSchema = z.union(
      anyOfSchemaArray as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
    );

    if (!isRequired || forceOptional) {
      instillZodSchema = instillZodSchema.optional();
    }

    return instillZodSchema;
  }

  // Handle the enum fields
  if (targetSchema.enum) {
    // We need to do the castring here to make typescript happy.
    // The reason is typescript need to know the amount of the element
    // in the enum, but the enum is dynamic right here, so the ts will
    // complaint about it.
    // ref: https://github.com/colinhacks/zod/issues/2376

    const enumValues = targetSchema.enum as [string, ...string[]];
    instillZodSchema = z.enum(enumValues);

    const isRequired = propertyKey
      ? Array.isArray(parentSchema.required) &&
        parentSchema.required.includes(propertyKey)
      : false;

    if (!isRequired) {
      instillZodSchema = instillZodSchema.optional();
    }

    return instillZodSchema;
  }

  // Handle the normal type of the json schema
  switch (targetSchema.type) {
    case "array": {
      if (
        typeof targetSchema.items === "object" &&
        !Array.isArray(targetSchema.items)
      ) {
        let arraySchema = z.array(
          transformInstillJSONSchemaToZod({
            parentSchema,
            targetSchema: targetSchema.items as InstillJSONSchema,
            selectedItemMap,
          })
        );

        if (propertyKey) {
          instillZodSchema = z.object({
            propertyKey: arraySchema,
          });
        } else {
          instillZodSchema = arraySchema;
        }
      }
      break;
    }
    case "object": {
      const objectProperties = targetSchema.properties ?? {};

      const objectSchema = parseProperties({
        properties: objectProperties as Record<string, InstillJSONSchema>,
        parentSchema: targetSchema,
        selectedItemMap,
        propertyPath,
      });

      if (propertyKey) {
        instillZodSchema = z.object({
          propertyKey: objectSchema,
        });
      } else {
        instillZodSchema = objectSchema;
      }

      break;
    }
    case "string": {
      instillZodSchema = z.string();
      break;
    }
    case "boolean": {
      instillZodSchema = z.boolean();
      break;
    }
    case "integer": {
      let integerSchema = z.number();

      if (targetSchema.minimum !== undefined) {
        integerSchema.min(targetSchema.minimum);
      }

      if (targetSchema.maximum !== undefined) {
        integerSchema.max(targetSchema.maximum);
      }

      instillZodSchema = integerSchema;
      break;
    }
  }

  const isRequired = propertyKey
    ? Array.isArray(parentSchema.required) &&
      parentSchema.required.includes(propertyKey)
    : false;

  if (!isRequired || forceOptional) {
    instillZodSchema = instillZodSchema.optional();
  }

  return instillZodSchema;
};

function parseProperties({
  properties,
  parentSchema,
  selectedItemMap,
  propertyPath,
}: {
  properties: Record<string, InstillJSONSchema>;
  parentSchema: InstillJSONSchema;
  selectedItemMap: SelectedItemMap | null;
  propertyPath?: string;
}) {
  let objectSchema = z.object({});

  for (const [entryKey, entryJsonSchema] of Object.entries(properties)) {
    if (typeof entryJsonSchema !== "boolean") {
      objectSchema = objectSchema.extend({
        [entryKey]: transformInstillJSONSchemaToZod({
          parentSchema,
          targetSchema: entryJsonSchema,
          propertyKey: entryKey,
          propertyPath: propertyPath ? `${propertyPath}.${entryKey}` : entryKey,
          selectedItemMap,
        }),
      });
    }
  }

  return objectSchema;
}

function retriveConstInfo(properties: Record<string, InstillJSONSchema>) {
  let constKey: null | string = null;
  let constValue: null | string = null;

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "object" && value.const) {
      constKey = key;
      constValue = value.const as string;
      break;
    }
  }

  return {
    constKey,
    constValue,
  };
}

export const transformInstillSchemaToFormTree = () => {};
