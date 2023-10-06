import { test, expect } from "vitest";
import {
  InstillFormTree,
  InstillJSONSchema,
  transformInstillJSONSchemaToFormTree,
  transformInstillJSONSchemaToZod,
} from "./transformer";

test("should transform basic json schema to zod schema", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["host", "port", "user", "dbname"],
    properties: {
      host: { type: "string", description: "Hostname of the database." },
      port: {
        type: "integer",
        description: "Port of the database.",
      },
      user: {
        type: "string",
        description: "Username to use to access the database.",
      },
      dbname: { type: "string", description: "Name of the database." },
      password: {
        credential_field: true,
        type: "string",
        description: "Password associated with the username.",
      },
    },
  };

  const testedObj = {
    host: "localhost",
    port: 5432,
    user: "foo",
    dbname: "postgres-test",
    password: "bar",
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: null,
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: {
      host: "localhost",
      port: 5432,
      user: "foo",
      dbname: "postgres-test",
      password: "bar",
    },
  });
});

test("should transform optional field", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["host"],
    properties: {
      host: { type: "string", description: "Hostname of the database." },
      port: {
        type: "integer",
        description: "Port of the database.",
      },
    },
  };

  const testedObj = {
    host: "localhost",
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: null,
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: {
      host: "localhost",
    },
  });

  const wrongObj = {
    port: 4000,
  };

  const parsedWrongObj = zodSchema.safeParse(wrongObj);

  expect(parsedWrongObj.success).toBe(false);
});

test("should transform enum fields", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["host"],
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
    },
  };

  const testedObj = {
    task: "TASK_TEXT_GENERATION",
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: null,
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: {
      task: "TASK_TEXT_GENERATION",
    },
  });

  const wrongObj = {
    task: "TASK_UNSPECIFIED",
  };

  const parsedWrongObj = zodSchema.safeParse(wrongObj);

  expect(parsedWrongObj.success).toBe(false);
});

test("should transform anyOf fields", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["host"],
    properties: {
      model: {
        description:
          "ID of the model to use. Only `whisper-1` is currently available.\n",
        anyOf: [
          {
            type: "string",
          },
          {
            type: "string",
            enum: ["whisper-1"],
          },
        ],
        type: "string",
      },
    },
  };

  const testedObj = {
    model: "whisper-1",
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: null,
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: { model: "whisper-1" },
  });

  const wrongObj = {
    model: 123,
  };

  const parsedWrongObj = zodSchema.safeParse(wrongObj);

  expect(parsedWrongObj.success).toBe(false);
});

test("should transform oneOf fields", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["protocol"],
    oneOf: [
      {
        properties: {
          protocol: {
            const: "http",
            title: "Protocol",
          },
          host: {
            type: "string",
          },
          port: {
            type: "integer",
          },
          foo: {
            type: "string",
          },
        },
      },
      {
        properties: {
          protocol: {
            const: "https",
            title: "Protocol",
          },
          host: {
            type: "string",
          },
          port: {
            type: "integer",
          },
          bar: {
            type: "string",
          },
        },
      },
    ],
  };

  const testedObj = {
    host: "localhost",
    port: 8080,
    protocol: "http",
    foo: "yes",
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: {
      protocol: "http",
    },
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: {
      host: "localhost",
      port: 8080,
      protocol: "http",
      foo: "yes",
    },
  });

  const wrongObj = {
    host: "localhost",
    port: 8080,
    protocol: "https",
    foo: "yes",
  };

  const parsedWrongObj = zodSchema.safeParse(wrongObj);

  expect(parsedWrongObj.success).toBe(false);
});

test("should transform nested oneOf fields", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["protocol"],
    oneOf: [
      {
        properties: {
          protocol: {
            const: "http",
            title: "Protocol",
          },
          host: {
            type: "string",
          },
          port: {
            type: "integer",
          },
          foo: {
            type: "string",
          },
        },
      },
      {
        required: ["protocol", "tunnel_method"],
        properties: {
          protocol: {
            const: "https",
            title: "Protocol",
          },
          host: {
            type: "string",
          },
          port: {
            type: "integer",
          },
          bar: {
            type: "string",
          },
          tunnel_method: {
            description:
              "Whether to initiate an SSH tunnel before connecting to the database, and if so, which kind of authentication to use.",
            oneOf: [
              {
                properties: {
                  tunnel_method: {
                    const: "NO_TUNNEL",
                    description: "No ssh tunnel needed to connect to database",
                    type: "string",
                  },
                },
                required: ["tunnel_method"],
                title: "No Tunnel",
              },
              {
                properties: {
                  ssh_key: {
                    description:
                      "OS-level user account ssh key credentials in RSA PEM format ( created with ssh-keygen -t rsa -m PEM -f myuser_rsa )",
                    title: "SSH Private Key",
                    type: "string",
                  },
                  tunnel_host: {
                    description:
                      "Hostname of the jump server host that allows inbound ssh tunnel.",
                    title: "SSH Tunnel Jump Server Host",
                    type: "string",
                  },
                  tunnel_method: {
                    const: "SSH_KEY_AUTH",
                    description:
                      "Connect through a jump server tunnel host using username and ssh key",
                    type: "string",
                  },
                  tunnel_port: {
                    default: 22,
                    description:
                      "Port on the proxy/jump server that accepts inbound ssh connections.",
                    examples: ["22"],
                    maximum: 65536,
                    minimum: 0,
                    title: "SSH Connection Port",
                    type: "integer",
                  },
                  tunnel_user: {
                    description:
                      "OS-level username for logging into the jump server host.",
                    title: "SSH Login Username",
                    type: "string",
                  },
                },
                required: [
                  "tunnel_method",
                  "tunnel_host",
                  "tunnel_port",
                  "tunnel_user",
                  "ssh_key",
                ],
                title: "SSH Key Authentication",
              },
              {
                properties: {
                  tunnel_host: {
                    description:
                      "Hostname of the jump server host that allows inbound ssh tunnel.",
                    title: "SSH Tunnel Jump Server Host",
                    type: "string",
                  },
                  tunnel_method: {
                    const: "SSH_PASSWORD_AUTH",
                    description:
                      "Connect through a jump server tunnel host using username and password authentication",
                    type: "string",
                  },
                  tunnel_port: {
                    default: 22,
                    description:
                      "Port on the proxy/jump server that accepts inbound ssh connections.",
                    examples: ["22"],
                    maximum: 65536,
                    minimum: 0,
                    title: "SSH Connection Port",
                    type: "integer",
                  },
                  tunnel_user: {
                    description:
                      "OS-level username for logging into the jump server host",
                    title: "SSH Login Username",
                    type: "string",
                  },
                  tunnel_user_password: {
                    description:
                      "OS-level password for logging into the jump server host",
                    title: "Password",
                    type: "string",
                  },
                },
                required: [
                  "tunnel_method",
                  "tunnel_host",
                  "tunnel_port",
                  "tunnel_user",
                  "tunnel_user_password",
                ],
                title: "Password Authentication",
              },
            ],
            title: "SSH Tunnel Method",
            type: "object",
          },
        },
      },
    ],
  };

  const testedObj = {
    host: "localhost",
    port: 8080,
    protocol: "https",
    bar: "yes",
    tunnel_method: {
      tunnel_method: "NO_TUNNEL",
    },
  };

  const zodSchema = transformInstillJSONSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
    selectedItemMap: {
      protocol: "https",
      "tunnel_method.tunnel_method": "NO_TUNNEL",
    },
  });

  const parsedObj = zodSchema.safeParse(testedObj);

  expect(parsedObj).toStrictEqual({
    success: true,
    data: {
      host: "localhost",
      port: 8080,
      protocol: "https",
      bar: "yes",
      tunnel_method: {
        tunnel_method: "NO_TUNNEL",
      },
    },
  });
});

test("should transform basic JSON schema to formTree", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    required: ["host", "port", "user", "dbname"],
    properties: {
      host: { type: "string", description: "Hostname of the database." },
      port: {
        type: "integer",
        description: "Port of the database.",
      },
      user: {
        type: "string",
        description: "Username to use to access the database.",
      },
      dbname: { type: "string", description: "Name of the database." },
      password: {
        credential_field: true,
        type: "string",
        description: "Password associated with the username.",
      },
    },
  };

  const formTree = transformInstillJSONSchemaToFormTree({
    targetSchema: schema,
    key: "key",
  });

  const expectedFormTree: InstillFormTree = {
    _type: "formGroup",
    path: "key",
    fieldKey: "key",
    isRequired: false,
    jsonSchema: {
      properties: {
        dbname: {
          description: "Name of the database.",
          type: "string",
        },
        host: {
          description: "Hostname of the database.",
          type: "string",
        },
        password: {
          credential_field: true,
          description: "Password associated with the username.",
          type: "string",
        },
        port: {
          description: "Port of the database.",
          type: "integer",
        },
        user: {
          description: "Username to use to access the database.",
          type: "string",
        },
      },
      required: ["host", "port", "user", "dbname"],
      type: "object",
    },
    properties: [
      {
        _type: "formItem",
        description: "Hostname of the database.",
        path: "key.host",
        fieldKey: "host",
        isRequired: true,
        type: "string",
      },
      {
        _type: "formItem",
        description: "Port of the database.",
        path: "key.port",
        fieldKey: "port",
        isRequired: true,
        type: "integer",
      },
      {
        _type: "formItem",
        description: "Username to use to access the database.",
        path: "key.user",
        fieldKey: "user",
        isRequired: true,
        type: "string",
      },
      {
        _type: "formItem",
        description: "Name of the database.",
        path: "key.dbname",
        fieldKey: "dbname",
        isRequired: true,
        type: "string",
      },
      {
        _type: "formItem",
        description: "Password associated with the username.",
        path: "key.password",
        fieldKey: "password",
        isRequired: false,
        type: "string",
      },
    ],
  };

  expect(formTree).toStrictEqual(expectedFormTree);
});

test("should transform top-level oneOf JSON schema to formTree", () => {
  const schema: InstillJSONSchema = {
    type: "object",
    title: "Credential Component",
    oneOf: [
      {
        title: "API key",
        required: ["api_key"],
        properties: {
          api_key: {
            type: "string",
          },
          type: {
            const: "api",
          },
        },
      },
      {
        title: "OAuth",
        required: ["redirect_uri"],
        properties: {
          redirect_uri: {
            type: "string",
            examples: ["https://api.hubspot.com/"],
          },
          type: {
            const: "oauth",
          },
        },
      },
    ],
  };

  const formTree = transformInstillJSONSchemaToFormTree({
    targetSchema: schema,
    key: "root",
  });

  const expectedFormTree: InstillFormTree = {
    title: "Credential Component",
    _type: "formCondition",
    fieldKey: "root",
    path: "root",
    conditions: {
      api: {
        title: "API key",
        _type: "formGroup",
        fieldKey: "root",
        path: "root",
        properties: [
          {
            _type: "formItem",
            path: "root.api_key",
            type: "string",
            fieldKey: "api_key",
            isRequired: true,
          },
          {
            _type: "formItem",
            const: "api",
            fieldKey: "type",
            isRequired: false,
            path: "root.type",
            type: "null",
          },
        ],
        jsonSchema: {
          title: "API key",
          required: ["api_key"],
          properties: {
            api_key: {
              type: "string",
            },
            type: {
              const: "api",
            },
          },
          type: "object",
        },
        isRequired: false,
      },
      oauth: {
        title: "OAuth",
        _type: "formGroup",
        fieldKey: "root",
        path: "root",
        properties: [
          {
            _type: "formItem",
            path: "root.redirect_uri",
            type: "string",
            fieldKey: "redirect_uri",
            isRequired: true,
            examples: ["https://api.hubspot.com/"],
          },
          {
            _type: "formItem",
            const: "oauth",
            fieldKey: "type",
            isRequired: false,
            path: "root.type",
            type: "null",
          },
        ],
        jsonSchema: {
          title: "OAuth",
          required: ["redirect_uri"],
          properties: {
            redirect_uri: {
              type: "string",
              examples: ["https://api.hubspot.com/"],
            },
            type: {
              const: "oauth",
            },
          },
          type: "object",
        },
        isRequired: false,
      },
    },
    isRequired: false,
  };

  expect(formTree).toStrictEqual(expectedFormTree);

  console.log(formTree);
});

test.skip("should transform real InstillJSONSchema to formTree", () => {
  const schema: InstillJSONSchema = {
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

  const formTree = transformInstillJSONSchemaToFormTree({
    targetSchema: schema,
    key: "root",
  });

  console.log(formTree);
});
