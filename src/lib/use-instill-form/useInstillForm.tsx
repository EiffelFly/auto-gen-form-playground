import * as React from "react";
import * as z from "zod";
import {
  InstillFormTree,
  InstillJSONSchema,
  SelectedConditionMap,
} from "../type";
import {
  transformInstillJSONSchemaToFormTree,
  transformInstillJSONSchemaToZod,
} from "../transform";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pickFieldComponentFromInstillFormTree } from "./pickFieldComponentFromInstillFormTree";
import { GeneralRecord } from "@instill-ai/toolkit";
import { transformInstillFormTreeToInitialSelectedCondition } from "../transform/transformInstillFormTreeToInitialSelectedCondition";
import { transformInstillFormTreeToDefaultValue } from "../transform/transformInstillFormTreeToDefaultValue";

export function useInstillForm(
  schema: InstillJSONSchema | null,
  data?: GeneralRecord
) {
  const [selectedConditionMap, setSelectedConditionMap] =
    React.useState<SelectedConditionMap | null>(null);

  const [formTree, setFormTree] = React.useState<InstillFormTree | null>(null);

  const [ValidatorSchema, setValidatorSchema] = React.useState<z.ZodTypeAny>(
    z.any()
  );

  const form = useForm<z.infer<typeof ValidatorSchema>>({
    resolver: zodResolver(ValidatorSchema),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: data,
  });

  React.useEffect(() => {
    if (!schema) return;

    const _formTree = transformInstillJSONSchemaToFormTree({
      parentSchema: schema,
      targetSchema: schema,
    });

    setFormTree(_formTree);

    const _selectedConditionMap =
      transformInstillFormTreeToInitialSelectedCondition({
        tree: _formTree,
      });

    setSelectedConditionMap(_selectedConditionMap);

    const _ValidatorSchema = transformInstillJSONSchemaToZod({
      parentSchema: schema,
      targetSchema: schema,
      selectedConditionMap,
    });

    setValidatorSchema(_ValidatorSchema);

    const _defaultValues = data
      ? data
      : transformInstillFormTreeToDefaultValue({
          tree: _formTree,
        });

    form.reset(_defaultValues);
  }, [schema]);

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
