import * as z from "zod";
import {
  InstillJSONSchema,
  SelectedConditionMap,
  instillZodSchema,
} from "../type";
import { retriveConstInfo } from "../retrieveConstInfo";

export function transformInstillJSONSchemaToZod({
  parentSchema,
  targetSchema,
  selectedConditionMap,
  propertyKey,
  propertyPath,
  forceOptional,
}: {
  parentSchema: InstillJSONSchema;
  targetSchema: InstillJSONSchema;
  selectedConditionMap: SelectedConditionMap | null;
  propertyKey?: string;
  propertyPath?: string;
  forceOptional?: boolean;
}): instillZodSchema {
  let instillZodSchema: z.ZodTypeAny = z.any();

  // const field will only be used in oneOf field conditions
  if (targetSchema.const) {
    instillZodSchema = z.literal(targetSchema.const as string);
    return instillZodSchema;
  }

  // Handle oneOf field
  if (targetSchema.oneOf) {
    const oneOfConditions = targetSchema.oneOf as InstillJSONSchema[];

    const selectedSchema = selectedConditionMap
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
            constKey &&
            constValue &&
            selectedConditionMap[accessPath] === constValue
          );
        })
      : oneOfConditions[0];

    if (selectedSchema) {
      instillZodSchema = transformInstillJSONSchemaToZod({
        parentSchema,
        targetSchema: { type: targetSchema.type, ...selectedSchema },
        selectedConditionMap,
        propertyKey,
        propertyPath,
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
          let anyOfSchema = z.object({});

          for (const [entryKey, entryJsonSchema] of Object.entries(
            condition.properties
          )) {
            if (typeof entryJsonSchema !== "boolean") {
              anyOfSchema = anyOfSchema.extend({
                [entryKey]: transformInstillJSONSchemaToZod({
                  parentSchema: condition,
                  targetSchema: entryJsonSchema,
                  propertyKey: entryKey,
                  propertyPath: propertyPath
                    ? `${propertyPath}.${entryKey}`
                    : entryKey,
                  selectedConditionMap,
                }),
              });
            }
          }
          anyOfSchemaArray.push(anyOfSchema);
        } else {
          const anyOfSchema = transformInstillJSONSchemaToZod({
            parentSchema,
            targetSchema: condition,
            selectedConditionMap,
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

    // console.log(propertyKey, parentSchema, isRequired);

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
            selectedConditionMap,
          })
        );

        instillZodSchema = arraySchema;
      }
      break;
    }
    case "object": {
      const objectProperties = targetSchema.properties ?? {};

      let objectSchema = z.object({});

      for (const [entryKey, entryJsonSchema] of Object.entries(
        objectProperties
      )) {
        if (typeof entryJsonSchema !== "boolean") {
          objectSchema = objectSchema.extend({
            [entryKey]: transformInstillJSONSchemaToZod({
              parentSchema: targetSchema,
              targetSchema: entryJsonSchema,
              propertyKey: entryKey,
              propertyPath: propertyPath
                ? `${propertyPath}.${entryKey}`
                : entryKey,
              selectedConditionMap,
            }),
          });
        }
      }

      instillZodSchema = objectSchema;

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
    case "integer":
    case "number": {
      // Because number field can also write string as reference. We need to
      // set the initial zod schema to string and then validate it with
      // superRefine.

      let integerSchema = z.string();

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
}