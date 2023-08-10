import { test, expect } from "vitest";
import { InstillJsonSchema, transformInstillSchemaToZod } from "./transformer";

test("should transform basic json schema to zod schema", () => {
  const schema: InstillJsonSchema = {
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

  const zodSchema = transformInstillSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
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
  const schema: InstillJsonSchema = {
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

  const zodSchema = transformInstillSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
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
  const schema: InstillJsonSchema = {
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

  const zodSchema = transformInstillSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
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
  const schema: InstillJsonSchema = {
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

  const zodSchema = transformInstillSchemaToZod({
    parentSchema: schema,
    targetSchema: schema,
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
