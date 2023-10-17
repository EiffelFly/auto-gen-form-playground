import * as React from "react";
import * as z from "zod";
import { InstillJSONSchema, SelectedConditionMap } from "../type";
import {
  transformInstillJSONSchemaToFormTree,
  transformInstillJSONSchemaToZod,
} from "../transform";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pickFieldComponentFromInstillFormTree } from "./pickFieldComponentFromInstillFormTree";

export function useInstillForm(schema: InstillJSONSchema | null) {
  const [selectedConditionMap, setSelectedConditionMap] =
    React.useState<SelectedConditionMap | null>(null);

  const ValidatorSchema = React.useMemo(() => {
    if (!schema) {
      return z.any();
    }

    return transformInstillJSONSchemaToZod({
      parentSchema: schema,
      targetSchema: schema,
      selectedConditionMap,
    });
  }, [schema, selectedConditionMap]);

  const form = useForm<z.infer<typeof ValidatorSchema>>({
    resolver: zodResolver(ValidatorSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const { fields, formTree } = React.useMemo(() => {
    if (!schema) {
      return { fields: null, formTree: null };
    }
    const formTree = transformInstillJSONSchemaToFormTree({
      targetSchema: schema,
      parentSchema: schema,
    });

    return {
      fields: pickFieldComponentFromInstillFormTree({
        form,
        tree: formTree,
        selectedConditionMap,
        setSelectedConditionMap,
      }),
      formTree,
    };
  }, [schema, selectedConditionMap]);

  return {
    form,
    fields,
    ValidatorSchema,
    formTree,
  };
}
