import { InstillFormTree } from "../type";
import { test, expect } from "vitest";
import { transformInstillFormTreeToDefaultValue } from "./transformInstillFormTreeToDefaultValue";

test("should transform formItem with example", () => {
  const tree: InstillFormTree = {
    description:
      "ID of the model to use. See the [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
    example: "gpt-3.5-turbo",
    title: "Model",
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
    _type: "formItem",
    fieldKey: "model",
    path: "input.model",
    isRequired: true,
    type: "string",
  };

  const defaultValue = transformInstillFormTreeToDefaultValue({
    tree,
    selectedConditionMap: {},
  });

  expect(defaultValue).toStrictEqual({
    model: "gpt-3.5-turbo",
  });
});

test("should transform formItem with examples", () => {
  const tree: InstillFormTree = {
    description:
      "ID of the model to use. See the [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
    examples: ["gpt-3.5-turbo"],
    title: "Model",
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
    _type: "formItem",
    fieldKey: "model",
    path: "input.model",
    isRequired: true,
    type: "string",
  };

  const defaultValue = transformInstillFormTreeToDefaultValue({
    tree,
    selectedConditionMap: {},
  });

  expect(defaultValue).toStrictEqual({
    model: "gpt-3.5-turbo",
  });
});

test("should transform formGroup", () => {
  const tree: InstillFormTree = {
    _type: "formGroup",
    fieldKey: "input",
    path: "input",
    isRequired: true,
    jsonSchema: {
      properties: {
        max_tokens: {
          type: "integer",
          description:
            "The maximum number of [tokens](/tokenizer) to generate in the chat completion.\n\nThe total length of input tokens and generated tokens is limited by the model's context length. [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) for counting tokens.\n",
          instillFormat: "integer",
          instillUpstreamTypes: ["value", "reference"],
          title: "Max Tokens",
        },
        model: {
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
          description:
            "ID of the model to use. See the [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
          example: "gpt-3.5-turbo",
          instillFormat: "text",
          instillUpstreamTypes: ["value", "reference"],
          title: "Model",
          "x-oaiTypeLabel": "string",
        },
        n: {
          default: 1,
          example: 1,
          instillUpstreamType: "value",
          maximum: 128,
          minimum: 1,
          nullable: true,
          type: "integer",
          description:
            "How many chat completion choices to generate for each input message.",
          instillFormat: "integer",
          instillUpstreamTypes: ["value", "reference"],
          title: "N",
        },
        prompt: {
          type: "string",
          description: "",
          instillFormat: "text",
          instillUpstreamTypes: ["value", "reference"],
          title: "Prompt",
        },
        system_message: {
          maxLength: 2048,
          type: "string",
          default: "You are a helpful assistant.",
          description:
            'The system message helps set the behavior of the assistant. For example, you can modify the personality of the assistant or provide specific instructions about how it should behave throughout the conversation. By default, the model’s behavior is using a generic message as "You are a helpful assistant."',
          instillFormat: "text",
          instillUpstreamTypes: ["value", "reference"],
          title: "System message",
        },
        temperature: {
          default: 1,
          example: 1,
          instillUpstreamType: "value",
          maximum: 2,
          minimum: 0,
          nullable: true,
          type: "number",
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
    properties: [
      {
        description:
          "The maximum number of [tokens](/tokenizer) to generate in the chat completion.\n\nThe total length of input tokens and generated tokens is limited by the model's context length. [Example Python code](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb) for counting tokens.\n",
        title: "Max Tokens",
        _type: "formItem",
        fieldKey: "max_tokens",
        path: "input.max_tokens",
        isRequired: false,
        type: "integer",
      },
      {
        description:
          "ID of the model to use. See the [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility) table for details on which models work with the Chat API.",
        example: "gpt-3.5-turbo",
        title: "Model",
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
        _type: "formItem",
        fieldKey: "model",
        path: "input.model",
        isRequired: true,
        type: "string",
      },
      {
        default: 1,
        example: 1,
        description:
          "How many chat completion choices to generate for each input message.",
        title: "N",
        _type: "formItem",
        fieldKey: "n",
        path: "input.n",
        isRequired: false,
        type: "integer",
      },
      {
        description: "",
        title: "Prompt",
        _type: "formItem",
        fieldKey: "prompt",
        path: "input.prompt",
        isRequired: true,
        type: "string",
      },
      {
        default: "You are a helpful assistant.",
        description:
          'The system message helps set the behavior of the assistant. For example, you can modify the personality of the assistant or provide specific instructions about how it should behave throughout the conversation. By default, the model’s behavior is using a generic message as "You are a helpful assistant."',
        title: "System message",
        _type: "formItem",
        fieldKey: "system_message",
        path: "input.system_message",
        isRequired: false,
        type: "string",
      },
      {
        default: 1,
        example: 1,
        description:
          "What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.\n\nWe generally recommend altering this or `top_p` but not both.\n",
        title: "Temperature",
        _type: "formItem",
        fieldKey: "temperature",
        path: "input.temperature",
        isRequired: false,
        type: "number",
      },
    ],
  };

  const defaultValue = transformInstillFormTreeToDefaultValue({
    tree,
    selectedConditionMap: {},
  });

  expect(defaultValue).toStrictEqual({
    input: {
      max_tokens: null,
      model: "gpt-3.5-turbo",
      n: "1",
      prompt: null,
      system_message: null,
      temperature: "1",
    },
  });
});

test("should transform formCondition", () => {
  const tree: InstillFormTree = {
    title: "OpenAI Component",
    _type: "formCondition",
    fieldKey: null,
    path: null,
    conditions: {
      TASK_TEXT_GENERATION: {
        _type: "formGroup",
        fieldKey: null,
        path: null,
        isRequired: false,
        jsonSchema: {
          type: "object",
          properties: {
            input: {
              properties: {
                model: {
                  type: "string",
                },
              },
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
          required: ["input"],
        },
        properties: [
          {
            _type: "formGroup",
            fieldKey: "input",
            path: "input",
            isRequired: true,
            jsonSchema: {
              properties: {
                model: {
                  type: "string",
                },
              },
              type: "object",
            },
            properties: [
              {
                _type: "formItem",
                fieldKey: "model",
                path: "input.model",
                isRequired: false,
                type: "string",
              },
            ],
          },
          {
            title: "Metadata",
            _type: "formItem",
            fieldKey: "metadata",
            path: "metadata",
            isRequired: false,
            type: "object",
          },
          {
            const: "TASK_TEXT_GENERATION",
            _type: "formItem",
            fieldKey: "task",
            path: "task",
            isRequired: false,
            type: "null",
          },
        ],
      },
      TASK_TEXT_EMBEDDINGS: {
        _type: "formGroup",
        fieldKey: null,
        path: null,
        isRequired: false,
        jsonSchema: {
          type: "object",
          properties: {
            input: {
              properties: {
                text: {
                  type: "string",
                  description: "",
                  instillFormat: "text",
                  instillUpstreamTypes: ["value", "reference"],
                  title: "Text",
                },
              },
              required: ["text"],
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
          required: ["input"],
        },
        properties: [
          {
            _type: "formGroup",
            fieldKey: "input",
            path: "input",
            isRequired: true,
            jsonSchema: {
              properties: {
                text: {
                  type: "string",
                  description: "",
                  instillFormat: "text",
                  instillUpstreamTypes: ["value", "reference"],
                  title: "Text",
                },
              },
              required: ["text"],
              type: "object",
            },
            properties: [
              {
                description: "",
                title: "Text",
                _type: "formItem",
                fieldKey: "text",
                path: "input.text",
                isRequired: true,
                type: "string",
              },
            ],
          },
          {
            title: "Metadata",
            _type: "formItem",
            fieldKey: "metadata",
            path: "metadata",
            isRequired: false,
            type: "object",
          },
          {
            const: "TASK_TEXT_EMBEDDINGS",
            _type: "formItem",
            fieldKey: "task",
            path: "task",
            isRequired: false,
            type: "null",
          },
        ],
      },
      TASK_SPEECH_RECOGNITION: {
        _type: "formGroup",
        fieldKey: null,
        path: null,
        isRequired: false,
        jsonSchema: {
          type: "object",
          properties: {
            input: {
              properties: {
                audio: {
                  type: "string",
                  description:
                    "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
                  instillFormat: "audio",
                  instillUpstreamTypes: ["reference"],
                  title: "Audio",
                },
              },
              required: ["audio"],
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
          required: ["input"],
        },
        properties: [
          {
            _type: "formGroup",
            fieldKey: "input",
            path: "input",
            isRequired: true,
            jsonSchema: {
              properties: {
                audio: {
                  type: "string",
                  description:
                    "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
                  instillFormat: "audio",
                  instillUpstreamTypes: ["reference"],
                  title: "Audio",
                },
              },
              required: ["audio"],
              type: "object",
            },
            properties: [
              {
                description:
                  "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
                title: "Audio",
                _type: "formItem",
                fieldKey: "audio",
                path: "input.audio",
                isRequired: true,
                type: "string",
              },
            ],
          },
          {
            title: "Metadata",
            _type: "formItem",
            fieldKey: "metadata",
            path: "metadata",
            isRequired: false,
            type: "object",
          },
          {
            const: "TASK_SPEECH_RECOGNITION",
            _type: "formItem",
            fieldKey: "task",
            path: "task",
            isRequired: false,
            type: "null",
          },
        ],
      },
    },
    isRequired: false,
    jsonSchema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      oneOf: [
        {
          properties: {
            input: {
              properties: {
                model: {
                  type: "string",
                },
              },
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
          required: ["input"],
        },
        {
          properties: {
            input: {
              properties: {
                text: {
                  type: "string",
                  description: "",
                  instillFormat: "text",
                  instillUpstreamTypes: ["value", "reference"],
                  title: "Text",
                },
              },
              required: ["text"],
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
          required: ["input"],
        },
        {
          properties: {
            input: {
              properties: {
                audio: {
                  type: "string",
                  description:
                    "The audio file object (not file name) to transcribe, in one of these formats: mp3, mp4, mpeg, mpga, m4a, wav, or webm.\n",
                  instillFormat: "audio",
                  instillUpstreamTypes: ["reference"],
                  title: "Audio",
                },
              },
              required: ["audio"],
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
          required: ["input"],
        },
      ],
      title: "OpenAI Component",
      type: "object",
    },
  };

  const defaultValue = transformInstillFormTreeToDefaultValue({
    tree,
    selectedConditionMap: {
      task: "TASK_TEXT_EMBEDDINGS",
    },
  });

  expect(defaultValue).toStrictEqual({
    input: { text: null },
    metadata: null,
    task: null,
  });
});

test("should transform formArray", () => {
  const tree: InstillFormTree = {
    _type: "formGroup",
    fieldKey: null,
    path: null,
    isRequired: false,
    jsonSchema: {
      type: "object",
      required: ["host", "ports"],
      properties: {
        host: {
          type: "string",
          description: "Hostname of the database.",
          example: "hello-world",
        },
        ports: {
          type: "array",
          items: {
            properties: {
              port: {
                type: "integer",
                description: "Port of the database.",
                examples: [5432],
              },
            },
            type: "object",
          },
        },
      },
    },
    properties: [
      {
        description: "Hostname of the database.",
        example: "hello-world",
        _type: "formItem",
        fieldKey: "host",
        path: "host",
        isRequired: true,
        type: "string",
      },
      {
        _type: "formArray",
        fieldKey: "ports",
        path: "ports",
        isRequired: true,
        jsonSchema: {
          properties: {
            port: {
              description: "Port of the database.",
              examples: [5432],
              type: "integer",
            },
          },
          type: "object",
        },
        properties: [
          {
            description: "Port of the database.",
            examples: [5432],
            _type: "formItem",
            fieldKey: "port",
            path: "ports.port",
            isRequired: false,
            type: "integer",
          },
        ],
      },
    ],
  };

  const defaultValue = transformInstillFormTreeToDefaultValue({
    tree,
    selectedConditionMap: {},
  });

  console.log(defaultValue);

  expect(defaultValue).toStrictEqual({
    host: "hello-world",
    ports: [{ port: "5432" }],
  });
});
