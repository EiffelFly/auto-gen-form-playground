import * as z from "zod";
import {
  JSONSchema7,
  JSONSchema7Definition,
  JSONSchema7TypeName,
} from "json-schema";
import * as React from "react";
import { OneOfConditionField } from "@/components/OneOfConditionField";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";
import { BooleanField } from "@/components/BooleanField";
import { SingleSelectField } from "@/components/SingleSelectField";
import { TextAreaField } from "@/components/TextAreaField";
import { TextField } from "@/components/TextField";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

type InstillJsonSchemaProps = {
  credential_field?: boolean;
  example?: string | number;
  "x-oaiTypeLabel"?: string;
  nullable?: boolean;
  instillUpstreamType?: string;
  instillUpstreamTypes?: string[];
  instillFormat?: string;
};

// This type is especially for jsonSchema OneOf properties
// {"key.subkey.credential": "oauth" }
export type SelectedConditionMap = Record<string, string>;

type InstillJSONSchemaDefinition = InstillJSONSchema | boolean;

export type InstillJSONSchema = {
  [Property in keyof JSONSchema7]+?: JSONSchema7[Property] extends boolean
    ? boolean
    : Property extends "enum"
    ? string[]
    : Property extends "if" | "then"
    ? InstillJSONSchema
    : Property extends "allOf"
    ? InstillJSONSchema[] | undefined
    : Property extends "oneOf"
    ? InstillJSONSchema[] | undefined
    : Property extends "anyOf"
    ? InstillJSONSchema[] | undefined
    : Property extends "properties" | "patternProperties" | "definitions"
    ? Record<string, InstillJSONSchema>
    : Property extends "items"
    ? InstillJSONSchema
    : JSONSchema7[Property] extends
        | JSONSchema7Definition
        | JSONSchema7Definition[]
    ? InstillJSONSchemaDefinition | InstillJSONSchemaDefinition[]
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
            selectedConditionMap,
            propertyPath,
          });
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
        selectedConditionMap,
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
  selectedConditionMap,
  propertyPath,
}: {
  properties: Record<string, InstillJSONSchema>;
  parentSchema: InstillJSONSchema;
  selectedConditionMap: SelectedConditionMap | null;
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
          selectedConditionMap,
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

type InstillFormBaseFields = {
  fieldKey: string;
  path: string;
  isRequired: boolean;
  title?: string;
  description?: string;
  isMultiline?: boolean;
};

export type InstillFormItem = {
  _type: "formItem";
  type: JSONSchema7TypeName;
} & InstillFormBaseFields &
  InstillJSONSchema;

export type InstillFormGroupItem = {
  _type: "formGroup";
  jsonSchema: InstillJSONSchema;
  properties: InstillFormTree[];
} & InstillFormBaseFields;

export type InstillFormConditionItem = {
  _type: "formCondition";
  conditions: Record<string, InstillFormGroupItem>;
} & InstillFormBaseFields;

export type InstillArrayItem = {
  _type: "formArray";
  properties: InstillFormTree;
} & InstillFormBaseFields;

export type InstillFormTree =
  | InstillFormItem
  | InstillFormGroupItem
  | InstillFormConditionItem
  | InstillArrayItem;

export function transformInstillJSONSchemaToFormTree({
  targetSchema,
  key = "",
  path = key,
  parentSchema,
}: {
  targetSchema: InstillJSONSchemaDefinition;
  key?: string;
  path?: string;
  parentSchema?: InstillJSONSchema;
}): InstillFormTree {
  let isRequired = false;

  if (
    typeof parentSchema !== "boolean" &&
    Array.isArray(parentSchema?.required) &&
    parentSchema?.required.includes(key)
  ) {
    isRequired = true;
  }

  if (typeof targetSchema === "boolean") {
    return {
      _type: "formItem",
      fieldKey: key,
      path,
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
      fieldKey: key,
      path: path || key,
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
      fieldKey: key,
      path: path || key,
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
      fieldKey: key,
      path: path || key,
      isRequired,
      jsonSchema: targetSchema,
      properties,
    };
  }

  return {
    ...pickBaseFields(targetSchema),
    _type: "formItem",
    fieldKey: key,
    path: path || key,
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

const pickBaseFields = (
  schema: InstillJSONSchema
): Partial<InstillJSONSchema> => {
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
};

function isDefined<T>(
  a: T | null | undefined
): a is Exclude<T, null | undefined> {
  return a !== undefined && a !== null;
}

const mockData = {
  $schema: "http://json-schema.org/draft-07/schema#",
  oneOf: [
    {
      properties: {
        input: {
          properties: {
            max_tokens: {
              anyOf: [
                {
                  default: "inf",
                  instillUpstreamType: "value",
                  type: "integer",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "The maximum number of [tokens](/tokenizer) to generate in the chat completion.\n\nThe total length of input tokens and generated tokens is limited by the model's context length. [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) for counting tokens.\n",
              instillFormat: "integer",
              instillUpstreamTypes: ["value", "reference"],
              title: "Max Tokens",
            },
            model: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  enum: [
                    "gpt-4",
                    "gpt-4-0314",
                    "gpt-4-0613",
                    "gpt-4-32k",
                    "gpt-4-32k-0314",
                    "gpt-4-32k-0613",
                    "gpt-3.5-turbo",
                    "gpt-3.5-turbo-16k",
                    "gpt-3.5-turbo-0301",
                    "gpt-3.5-turbo-0613",
                    "gpt-3.5-turbo-16k-0613",
                  ],
                  type: "string",
                },
              ],
              description:
                "ID of the model to use. See the [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
              example: "gpt-3.5-turbo",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Model",
              "x-oaiTypeLabel": "string",
            },
            n: {
              anyOf: [
                {
                  default: 1,
                  example: 1,
                  instillUpstreamType: "value",
                  maximum: 128,
                  minimum: 1,
                  nullable: true,
                  type: "integer",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "How many chat completion choices to generate for each input message.",
              instillFormat: "integer",
              instillUpstreamTypes: ["value", "reference"],
              title: "N",
            },
            prompt: {
              anyOf: [
                {
                  instillUpstreamType: "value",
                  type: "string",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description: "",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Prompt",
            },
            system_message: {
              anyOf: [
                {
                  default: "You are a helpful assistant.",
                  instillUpstreamType: "value",
                  maxLength: 2048,
                  type: "string",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                'The system message helps set the behavior of the assistant. For example, you can modify the personality of the assistant or provide specific instructions about how it should behave throughout the conversation. By default, the model’s behavior is using a generic message as "You are a helpful assistant."',
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "System message",
            },
            temperature: {
              anyOf: [
                {
                  default: 1,
                  example: 1,
                  instillUpstreamType: "value",
                  maximum: 2,
                  minimum: 0,
                  nullable: true,
                  type: "number",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n\nWe generally recommend altering this or `top_p` but not both.\n",
              instillFormat: "number",
              instillUpstreamTypes: ["value", "reference"],
              title: "Temperature",
            },
          },
          required: ["model", "prompt"],
          type: "object",
        },
        metadata: {
          title: "Metadata",
          type: "object",
        },
        task: {
          const: "TASK_TEXT_GENERATION",
        },
      },
      type: "object",
    },
    {
      properties: {
        input: {
          properties: {
            model: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  enum: ["text-embedding-ada-002"],
                  type: "string",
                },
              ],
              description:
                "ID of the model to use. You can use the [List models](https://platform.openai.com/docs/api-reference/models/list) API to see all of your available models, or see our [Model overview](https://platform.openai.com/docs/models/overview) for descriptions of them.\n",
              example: "text-embedding-ada-002",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Model",
              "x-oaiTypeLabel": "string",
            },
            text: {
              anyOf: [
                {
                  instillUpstreamType: "value",
                  type: "string",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description: "",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Text",
            },
          },
          required: ["text", "model"],
          type: "object",
        },
        metadata: {
          title: "Metadata",
          type: "object",
        },
        task: {
          const: "TASK_TEXT_EMBEDDINGS",
        },
      },
      type: "object",
    },
    {
      properties: {
        input: {
          properties: {
            audio: {
              anyOf: [
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
              instillFormat: "audio",
              instillUpstreamTypes: ["reference"],
              title: "Audio",
            },
            language: {
              anyOf: [
                {
                  instillUpstreamType: "value",
                  type: "string",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.\n",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Language",
            },
            model: {
              anyOf: [
                {
                  type: "string",
                },
                {
                  enum: ["whisper-1"],
                  type: "string",
                },
              ],
              description:
                "ID of the model to use. Only `whisper-1` is currently available.\n",
              example: "whisper-1",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Model",
              "x-oaiTypeLabel": "string",
            },
            prompt: {
              anyOf: [
                {
                  instillUpstreamType: "value",
                  type: "string",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "An optional text to guide the model's style or continue a previous audio segment. The [prompt](https://platform.openai.com/docs/guides/speech-to-text/prompting) should match the audio language.\n",
              instillFormat: "text",
              instillUpstreamTypes: ["value", "reference"],
              title: "Prompt",
            },
            temperature: {
              anyOf: [
                {
                  default: 0,
                  instillUpstreamType: "value",
                  type: "number",
                },
                {
                  instillUpstreamType: "reference",
                  pattern: "^\\{.*\\}$",
                  type: "string",
                },
              ],
              description:
                "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.\n",
              instillFormat: "number",
              instillUpstreamTypes: ["value", "reference"],
              title: "Temperature",
            },
          },
          required: ["audio", "model"],
          type: "object",
        },
        metadata: {
          title: "Metadata",
          type: "object",
        },
        task: {
          const: "TASK_SPEECH_RECOGNITION",
        },
      },
      type: "object",
    },
  ],
  title: "OpenAI Component",
  type: "object",
};

export function pickFieldComponentFromInstillFormTree({
  form,
  tree,
  selectedConditionMap,
  setSelectedConditionMap,
  disabledAll,
}: {
  form: GeneralUseFormReturn;
  tree: InstillFormTree;
  selectedConditionMap: SelectedConditionMap | null;
  setSelectedConditionMap: React.Dispatch<
    React.SetStateAction<SelectedConditionMap | null>
  >;
  disabledAll?: boolean;
}): React.ReactNode {
  if (tree._type === "formGroup") {
    return (
      <React.Fragment key={tree.path || tree.fieldKey}>
        {tree.properties.map((property) => {
          return pickFieldComponentFromInstillFormTree({
            form,
            tree: property,
            selectedConditionMap,
            setSelectedConditionMap,
            disabledAll,
          });
        })}
      </React.Fragment>
    );
  }

  if (tree._type === "formCondition") {
    const conditionComponents = Object.fromEntries(
      Object.entries(tree.conditions).map(([k, v]) => {
        return [
          k,
          pickFieldComponentFromInstillFormTree({
            tree: v,
            form,
            selectedConditionMap,
            setSelectedConditionMap,
            disabledAll,
          }),
        ];
      })
    );

    return (
      <OneOfConditionField
        form={form}
        fieldKey={tree.fieldKey}
        setSelectedConditionMap={setSelectedConditionMap}
        key={tree.path}
        conditionComponents={conditionComponents}
        title={tree.title}
      />
    );
  }

  if (tree._type === "formArray") {
    return pickFieldComponentFromInstillFormTree({
      tree: tree.properties,
      form,
      selectedConditionMap,
      setSelectedConditionMap,
      disabledAll,
    });
  }

  if (tree.const) {
    return null;
  }

  if (tree.type === "boolean") {
    return (
      <BooleanField
        key={tree.path}
        fieldKey={tree.fieldKey}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
        form={form}
      />
    );
  }

  if (tree.type === "string" && tree.enum && tree.enum.length > 0) {
    return (
      <SingleSelectField
        key={tree.path}
        fieldKey={tree.fieldKey}
        form={form}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
        options={tree.enum}
      />
    );
  }

  if (tree.type === "string" && tree.isMultiline) {
    return (
      <TextAreaField
        key={tree.path}
        fieldKey={tree.fieldKey}
        form={form}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
      />
    );
  }

  return (
    <TextField
      key={tree.path}
      fieldKey={tree.fieldKey}
      form={form}
      title={tree.title ?? tree.fieldKey ?? null}
      description={tree.description}
    />
  );
}

export function useInstillForm(schema: InstillJSONSchema | null) {
  const [selectedConditionMap, setSelectedConditionMap] =
    React.useState<SelectedConditionMap | null>(null);

  const validatorSchema = React.useMemo(() => {
    if (!schema) {
      return z.any();
    }

    return transformInstillJSONSchemaToZod({
      parentSchema: schema,
      targetSchema: schema,
      selectedConditionMap,
    });
  }, [schema, selectedConditionMap]);

  const form = useForm<z.infer<typeof validatorSchema>>({
    resolver: zodResolver(validatorSchema),
  });

  const fields = React.useMemo(() => {
    if (!schema) {
      return;
    }
    const formTree = transformInstillJSONSchemaToFormTree({
      targetSchema: schema,
      parentSchema: schema,
      key: "root",
    });

    return pickFieldComponentFromInstillFormTree({
      form,
      tree: formTree,
      selectedConditionMap,
      setSelectedConditionMap,
    });
  }, [schema, selectedConditionMap]);

  return {
    form,
    fields,
    validatorSchema,
  };
}
