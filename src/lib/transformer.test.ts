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

test("should recognize optional field", () => {
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

test("should recognize nested fields", () => {});
