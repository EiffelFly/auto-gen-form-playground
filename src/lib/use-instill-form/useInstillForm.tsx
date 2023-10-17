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
import { GeneralRecord } from "@instill-ai/toolkit";

export function useInstillForm(
  schema: InstillJSONSchema | null,
  data?: GeneralRecord
) {
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

  const formTree = React.useMemo(() => {
    if (!schema) {
      return null;
    }

    return transformInstillJSONSchemaToFormTree({
      targetSchema: schema,
      parentSchema: schema,
    });
  }, [schema]);

  const form = useForm<z.infer<typeof ValidatorSchema>>({
    resolver: zodResolver(ValidatorSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: data,
  });

  const { fields } = React.useMemo(() => {
    if (!schema || !formTree) {
      return { fields: null, formTree: null };
    }

    return {
      fields: pickFieldComponentFromInstillFormTree({
        form,
        tree: formTree,
        selectedConditionMap,
        setSelectedConditionMap,
      }),
      formTree,
    };
  }, [schema, selectedConditionMap, formTree]);

  return {
    form,
    fields,
    ValidatorSchema,
    formTree,
  };
}
