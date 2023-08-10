import * as z from "zod";
import { JSONSchema7, JSONSchema7Definition } from "json-schema";

type InstillJsonSchemaProps = {
  credential_field?: boolean;
  example?: string | number;
  "x-oaiTypeLabel"?: string;
  nullable?: boolean;
};

export type InstillJsonSchema = {
  [Property in keyof JSONSchema7]+?: JSONSchema7[Property] extends boolean
    ? boolean
    : Property extends "enum"
    ? string[]
    : Property extends "if" | "then"
    ? InstillJsonSchema
    : Property extends "allOf"
    ? InstillJsonSchema[] | undefined
    : Property extends "properties" | "patternProperties" | "definitions"
    ? Record<string, InstillJsonSchema>
    : JSONSchema7[Property] extends InstillJsonSchema
    ? InstillJsonSchema
    : JSONSchema7[Property] extends InstillJsonSchema[]
    ? InstillJsonSchema[]
    : JSONSchema7[Property] extends InstillJsonSchema | InstillJsonSchema[]
    ? InstillJsonSchema | InstillJsonSchema[]
    : JSONSchema7[Property];
} & InstillJsonSchemaProps;

export const mockSchema: InstillJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "OpenAI Connector Component Spec",
  type: "object",
  required: ["task"],
  properties: {
    task: {
      title: "Task",
      enum: [
        "TASK_TEXT_GENERATION",
        "TASK_TEXT_EMBEDDINGS",
        "TASK_SPEECH_RECOGNITION",
      ],
      default: "TASK_TEXT_GENERATION",
    },
    api_key: {
      title: "API key",
      credential_field: true,
    },
  },
  allOf: [
    {
      if: {
        properties: {
          task: {
            const: "TASK_TEXT_GENERATION",
          },
        },
      },
      then: {
        type: "object",
        required: ["prompt", "model"],
        properties: {
          prompt: {
            type: "string",
            format: "instill-template-text",
          },
          model: {
            description:
              "ID of the model to use. See the [model endpoint compatibility](/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
            example: "gpt-3.5-turbo",
            anyOf: [
              {
                type: "string",
              },
              {
                type: "string",
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
              },
            ],
            "x-oaiTypeLabel": "string",
            type: "string",
            format: "instill-template-text",
          },
          system_message: {
            title: "System message",
            description:
              'The system message helps set the behavior of the assistant. For example, you can modify the personality of the assistant or provide specific instructions about how it should behave throughout the conversation. By default, the model\u2019s behavior is using a generic message as "You are a helpful assistant."',
            type: "string",
            default: "You are a helpful assistant.",
            maxLength: 2048,
            format: "instill-template-text",
          },
          temperature: {
            type: "string",
            minimum: 0,
            maximum: 2,
            default: 1,
            example: 1,
            nullable: true,
            description:
              "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n\nWe generally recommend altering this or `top_p` but not both.\n",
            format: "instill-template-number",
          },
          n: {
            type: "string",
            minimum: 1,
            maximum: 128,
            default: 1,
            example: 1,
            nullable: true,
            description:
              "How many chat completion choices to generate for each input message.",
            format: "instill-template-integer",
          },
          max_tokens: {
            description:
              "The maximum number of [tokens](/tokenizer) to generate in the chat completion.\n\nThe total length of input tokens and generated tokens is limited by the model's context length. [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) for counting tokens.\n",
            default: "inf",
            type: "string",
            format: "instill-template-integer",
          },
        },
      },
    },
    {
      if: {
        properties: {
          task: {
            const: "TASK_TEXT_EMBEDDINGS",
          },
        },
      },
      then: {
        type: "object",
        required: ["text", "model"],
        properties: {
          text: {
            type: "string",
            format: "instill-template-text",
          },
          model: {
            description:
              "ID of the model to use. You can use the [List models](/docs/api-reference/models/list) API to see all of your available models, or see our [Model overview](/docs/models/overview) for descriptions of them.\n",
            example: "text-embedding-ada-002",
            anyOf: [
              {
                type: "string",
              },
              {
                type: "string",
                enum: ["text-embedding-ada-002"],
              },
            ],
            "x-oaiTypeLabel": "string",
            type: "string",
            format: "instill-template-text",
          },
        },
      },
    },
    {
      if: {
        properties: {
          task: {
            const: "TASK_SPEECH_RECOGNITION",
          },
        },
      },
      then: {
        type: "object",
        required: ["audio", "model"],
        properties: {
          audio: {
            description:
              "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
            type: "string",
            "x-oaiTypeLabel": "file",
            format: "instill-template-audio",
          },
          model: {
            description:
              "ID of the model to use. Only `whisper-1` is currently available.\n",
            example: "whisper-1",
            anyOf: [
              {
                type: "string",
              },
              {
                type: "string",
                enum: ["whisper-1"],
              },
            ],
            "x-oaiTypeLabel": "string",
            type: "string",
            format: "instill-template-string",
          },
          temperature: {
            description:
              "The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. If set to 0, the model will use [log probability](https://en.wikipedia.org/wiki/Log_probability) to automatically increase the temperature until certain thresholds are hit.\n",
            type: "string",
            default: 0,
            format: "instill-template-number",
          },
          language: {
            description:
              "The language of the input audio. Supplying the input language in [ISO-639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format will improve accuracy and latency.\n",
            type: "string",
            format: "instill-template-text",
          },
          prompt: {
            description:
              "An optional text to guide the model's style or continue a previous audio segment. The [prompt](/docs/guides/speech-to-text/prompting) should match the audio language.\n",
            type: "string",
            format: "instill-template-text",
          },
        },
      },
    },
  ],
};

type instillZodSchema = z.ZodTypeAny;

export const transformInstillSchemaToZod = ({
  parentSchema,
  targetSchema,
  propertyKey,
}: {
  parentSchema: InstillJsonSchema | JSONSchema7;
  targetSchema: InstillJsonSchema | JSONSchema7;
  propertyKey?: string;
}): instillZodSchema => {
  // we don't have oneOf field right now

  let instillZodSchema: instillZodSchema = z.any();

  // Handle the anyOf fields

  if (targetSchema.anyOf && targetSchema.anyOf.length > 0) {
    const anyOfConditions = targetSchema.anyOf;
    const anyOfSchemaArray: z.ZodTypeAny[] = [];

    for (const condition of anyOfConditions) {
      if (typeof condition !== "boolean") {
        const anyOfSchema = transformInstillSchemaToZod({
          parentSchema,
          targetSchema: condition,
        });
        anyOfSchemaArray.push(anyOfSchema);
      }
    }

    // Just like what we did for the enum, we also need to do the casting here
    instillZodSchema = z.union(
      anyOfSchemaArray as [z.ZodTypeAny, z.ZodTypeAny, ...z.ZodTypeAny[]]
    );

    const isRequired =
      propertyKey &&
      Array.isArray(parentSchema.required) &&
      parentSchema.required.includes(propertyKey);

    if (!isRequired) {
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

    const isRequired =
      propertyKey &&
      Array.isArray(parentSchema.required) &&
      parentSchema.required.includes(propertyKey);

    if (!isRequired) {
      instillZodSchema = instillZodSchema.optional();
    }

    return instillZodSchema;
  }

  // We will use discriminatedUnion to handle allOf
  // ref: https://github.com/colinhacks/zod/discussions/2099

  // if (targetSchema.allOf && targetSchema.allOf.length > 0) {
  //   const allConditions = targetSchema.allOf as InstillJsonSchema[];

  //   const conditionFields = allConditions.map((condition) => {
  //     const ifProperties = Object.entries(condition.if?.properties || {});
  //     return ifProperties[0][0];
  //   });
  // }

  // Handle the normal type of the json schema

  switch (targetSchema.type) {
    case "array": {
      if (
        typeof targetSchema.items === "object" &&
        !Array.isArray(targetSchema.items)
      ) {
        let arraySchema = z.array(
          transformInstillSchemaToZod({
            parentSchema,
            targetSchema: targetSchema.items,
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
      const instillSchemaPropertyEntries = Object.entries(
        targetSchema.properties || {}
      );

      let objectSchema = z.object({});

      for (const [entryKey, entryJsonSchema] of instillSchemaPropertyEntries) {
        if (typeof entryJsonSchema !== "boolean") {
          objectSchema = objectSchema.extend({
            [entryKey]: transformInstillSchemaToZod({
              parentSchema: targetSchema,
              targetSchema: entryJsonSchema,
              propertyKey: entryKey,
            }),
          });
        }
      }

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

  const isRequired =
    propertyKey &&
    Array.isArray(parentSchema.required) &&
    parentSchema.required.includes(propertyKey);

  if (!isRequired) {
    instillZodSchema = instillZodSchema.optional();
  }

  return instillZodSchema;
};
