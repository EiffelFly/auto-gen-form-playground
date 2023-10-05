import { test, expect } from "vitest";
import {
  InstillJSONSchema,
  transformInstillJSONSchemaToZod,
} from "./transformer";

test.skip("should transform basic json schema to zod schema", () => {
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

test.skip("should transform optional field", () => {
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

test.skip("should transform enum fields", () => {
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

test.skip("should transform anyOf fields", () => {
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

test.skip("should transform oneOf fields", () => {
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
