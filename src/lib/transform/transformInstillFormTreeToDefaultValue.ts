import { GeneralRecord, Nullable, dot } from "@instill-ai/toolkit";
import { InstillFormTree } from "../type";

export function transformInstillFormTreeToDefaultValue({
  tree,
}: {
  tree: InstillFormTree;
}): Nullable<GeneralRecord> {
  // We don't need to set the field key for formCondition because in the
  // conditions are formGroup, we will set the fieldKey there

  if (tree._type === "formCondition") {
    let formConditionValue: GeneralRecord = {};

    const constField = tree.conditions[
      Object.keys(tree.conditions)[0]
    ].properties.find((e) => "const" in e);

    if (constField && constField.path && "const" in constField) {
      formConditionValue = {
        ...transformInstillFormTreeToDefaultValue({
          tree: tree.conditions[Object.keys(tree.conditions)[0]],
        }),
      };

      dot.setter(
        formConditionValue,
        constField.path,
        constField.const as string
      );
      return formConditionValue;
    }

    return formConditionValue;
  }

  if (tree._type === "formGroup") {
    let formGroupValue: Record<string, any> = {};

    for (const property of tree.properties) {
      formGroupValue = {
        ...formGroupValue,
        ...transformInstillFormTreeToDefaultValue({
          tree: property,
        }),
      };
    }

    if (tree.fieldKey) {
      return {
        [tree.fieldKey]: formGroupValue,
      };
    }

    return formGroupValue;
  }

  if (tree._type === "formArray") {
    let formArrayValue: Record<string, any> = {};

    for (const property of tree.properties) {
      formArrayValue = {
        ...formArrayValue,
        ...transformInstillFormTreeToDefaultValue({
          tree: property,
        }),
      };
    }

    if (tree.fieldKey) {
      return {
        [tree.fieldKey]: [formArrayValue],
      };
    }

    return [formArrayValue];
  }

  let defaultValue: Nullable<string> = null;

  if (!tree.fieldKey) {
    return null;
  }

  if ("examples" in tree) {
    switch (typeof tree.examples) {
      case "object":
        if (Array.isArray(tree.examples)) {
          defaultValue = `${tree.examples[0]}`;
        }
        break;
      case "number":
        defaultValue = `${tree.examples}`;
        break;
      case "string":
        defaultValue = tree.examples;
        break;
      default:
        defaultValue = null;
    }

    return {
      [tree.fieldKey]: defaultValue,
    };
  }

  if ("example" in tree) {
    switch (typeof tree.example) {
      case "number":
        defaultValue = `${tree.example}`;
        break;
      case "string":
        defaultValue = `${tree.example}`;
        break;
      default:
        defaultValue = null;
    }

    return {
      [tree.fieldKey]: defaultValue,
    };
  }

  return {
    [tree.fieldKey]: defaultValue,
  };
}
