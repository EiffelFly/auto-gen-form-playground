import { retriveConstInfo } from "../retrieveConstInfo";
import {
  InstillFormTree,
  InstillJSONSchema,
  InstillJSONSchemaDefinition,
} from "../type";

export function transformInstillJSONSchemaToFormTree({
  targetSchema,
  key,
  path,
  parentSchema,
}: {
  targetSchema: InstillJSONSchemaDefinition;
  key?: string;
  path?: string;
  parentSchema?: InstillJSONSchema;
}): InstillFormTree {
  let isRequired = false;

  if (
    key &&
    typeof parentSchema !== "boolean" &&
    Array.isArray(parentSchema?.required) &&
    parentSchema?.required.includes(key)
  ) {
    isRequired = true;
  }

  if (typeof targetSchema === "boolean") {
    return {
      _type: "formItem",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      isRequired: false,
      type: "null",
    };
  }

  if (targetSchema.oneOf && targetSchema.oneOf.length > 0) {
    const conditions = Object.fromEntries(
      targetSchema.oneOf.map((condition) => {
        if (typeof condition === "boolean") {
          return [];
        }

        const { constKey, constValue } = retriveConstInfo(
          condition.properties ?? {}
        );

        if (!constKey || !constValue) {
          return [];
        }

        return [
          constValue,
          transformInstillJSONSchemaToFormTree({
            targetSchema: { type: targetSchema.type, ...condition },
            parentSchema,
            key,
            path,
          }),
        ];
      })
    );

    return {
      ...pickBaseFields(targetSchema),
      _type: "formCondition",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      conditions,
      isRequired,
    };
  }

  if (
    targetSchema.type === "array" &&
    typeof targetSchema.items === "object" &&
    !Array.isArray(targetSchema.items) &&
    targetSchema.items.type === "object"
  ) {
    return {
      ...pickBaseFields(targetSchema),
      _type: "formArray",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      isRequired,
      properties: transformInstillJSONSchemaToFormTree({
        targetSchema: targetSchema.items,
        parentSchema: targetSchema,
        key,
        path,
      }),
    };
  }

  if (targetSchema.properties) {
    const properties = Object.entries(targetSchema.properties || []).map(
      ([key, schema]) =>
        transformInstillJSONSchemaToFormTree({
          targetSchema: schema,
          parentSchema: targetSchema,
          key,
          path: path ? `${path}.${key}` : key,
        })
    );

    return {
      ...pickBaseFields(targetSchema),
      _type: "formGroup",
      fieldKey: key ?? null,
      path: (path || key) ?? null,
      isRequired,
      jsonSchema: targetSchema,
      properties,
    };
  }

  return {
    ...pickBaseFields(targetSchema),
    _type: "formItem",
    fieldKey: key ?? null,
    path: (path || key) ?? null,
    isRequired,
    type:
      (Array.isArray(targetSchema.type)
        ? targetSchema.type[0]
        : targetSchema.type) ?? "null",
  };
}

const baseFields: Array<keyof InstillJSONSchema> = [
  "default",
  "examples",
  "description",
  "pattern",
  "const",
  "title",
];

function pickBaseFields(schema: InstillJSONSchema): Partial<InstillJSONSchema> {
  const partialSchema: Partial<InstillJSONSchema> = {
    ...Object.fromEntries(
      Object.entries(schema).filter(([k]) =>
        baseFields.includes(k as keyof InstillJSONSchema)
      )
    ),
  };

  if (
    typeof schema.items === "object" &&
    !Array.isArray(schema.items) &&
    schema.items.enum
  ) {
    partialSchema.enum = schema.items.enum;
  } else if (schema.enum) {
    if (schema.enum?.length === 1 && isDefined(schema.default)) {
      partialSchema.const = schema.default;
    } else {
      partialSchema.enum = schema.enum;
    }
  }

  return partialSchema;
}

function isDefined<T>(
  a: T | null | undefined
): a is Exclude<T, null | undefined> {
  return a !== undefined && a !== null;
}
