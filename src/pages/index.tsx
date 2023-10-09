import * as React from "react";
import { Form, Textarea } from "@instill-ai/design-system";
import { InstillJSONSchema, useInstillForm } from "@/lib/transformer";
import MonacoEditor from "@monaco-editor/react";

export default function Home() {
  const [code, setCode] = React.useState<string | null>(null);
  const [schema, setSchema] = React.useState<InstillJSONSchema | null>(null);
  const [isValid, setIsValid] = React.useState(false);

  const { form, fields, validatorSchema } = useInstillForm(schema);

  return (
    <div className="flex flex-1 min-h-screen min-w-[100vh] flex-col">
      <div className="flex m-auto flex-row gap-x-10 w-full max-w-[1200px]">
        <div className="flex flex-col h-full w-2/3">
          <MonacoEditor
            language="json"
            value={code ?? ""}
            theme="vs-light"
            onChange={(code) => {
              if (!code) return;
              setCode(code);

              try {
                const parsedCode = JSON.parse(code);
                setIsValid(true);
                setSchema(parsedCode);
              } catch (err) {
                setIsValid(false);
              }
            }}
            height={600}
            options={{
              minimap: {
                enabled: false,
              },
              automaticLayout: true,
            }}
            className="border border-black"
          />
        </div>
        <div className="flex flex-col h-full w-2/3">
          <Form.Root {...form}>
            <form className="w-full">
              <div className="flex flex-col gap-y-5">{fields}</div>
            </form>
          </Form.Root>
        </div>
      </div>
    </div>
  );
}
