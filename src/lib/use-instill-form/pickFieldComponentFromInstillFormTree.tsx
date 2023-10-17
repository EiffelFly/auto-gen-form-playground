import * as React from "react";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";
import { InstillFormTree, SelectedConditionMap } from "../type";
import { OneOfConditionField } from "./OneOfConditionField";
import { BooleanField } from "./BooleanField";
import { SingleSelectField } from "./SingleSelectField";
import { TextAreaField } from "./TextAreaField";
import { TextField } from "./TextField";

export function pickFieldComponentFromInstillFormTree({
  form,
  tree,
  selectedConditionMap,
  setSelectedConditionMap,
  disabledAll,
}: {
  form: GeneralUseFormReturn;
  tree: InstillFormTree;
  selectedConditionMap: SelectedConditionMap | null;
  setSelectedConditionMap: React.Dispatch<
    React.SetStateAction<SelectedConditionMap | null>
  >;
  disabledAll?: boolean;
}): React.ReactNode {
  if (tree._type === "formGroup") {
    return (
      <React.Fragment key={tree.path || tree.fieldKey}>
        {tree.properties.map((property) => {
          return pickFieldComponentFromInstillFormTree({
            form,
            tree: property,
            selectedConditionMap,
            setSelectedConditionMap,
            disabledAll,
          });
        })}
      </React.Fragment>
    );
  }

  if (tree._type === "formCondition") {
    const conditionComponents = Object.fromEntries(
      Object.entries(tree.conditions).map(([k, v]) => {
        return [
          k,
          pickFieldComponentFromInstillFormTree({
            tree: v,
            form,
            selectedConditionMap,
            setSelectedConditionMap,
            disabledAll,
          }),
        ];
      })
    );

    // We will use the const path as the OneOfConditionField's path

    const constPath = tree.conditions[
      Object.keys(tree.conditions)[0]
    ].properties.find((e) => "const" in e)?.path;

    if (!constPath) {
      return null;
    }

    return (
      <OneOfConditionField
        form={form}
        path={constPath}
        setSelectedConditionMap={setSelectedConditionMap}
        key={constPath}
        conditionComponents={conditionComponents}
        title={tree.title}
      />
    );
  }

  if (tree._type === "formArray") {
    return pickFieldComponentFromInstillFormTree({
      tree: tree.properties,
      form,
      selectedConditionMap,
      setSelectedConditionMap,
      disabledAll,
    });
  }

  if (tree.const || !tree.path) {
    return null;
  }

  if (tree.type === "boolean") {
    return (
      <BooleanField
        key={tree.path}
        path={tree.path}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
        form={form}
      />
    );
  }

  if (tree.type === "string" && tree.enum && tree.enum.length > 0) {
    return (
      <SingleSelectField
        key={tree.path}
        path={tree.path}
        form={form}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
        options={tree.enum}
      />
    );
  }

  if (tree.type === "string" && tree.isMultiline) {
    return (
      <TextAreaField
        key={tree.path}
        path={tree.path}
        form={form}
        title={tree.title ?? tree.fieldKey ?? null}
        description={tree.description}
      />
    );
  }

  return (
    <TextField
      key={tree.path}
      path={tree.path}
      form={form}
      title={tree.title ?? tree.fieldKey ?? null}
      description={tree.description}
    />
  );
}
