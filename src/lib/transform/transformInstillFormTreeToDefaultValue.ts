import { GeneralRecord, Nullable } from "@instill-ai/toolkit";
import { InstillFormTree, SelectedConditionMap } from "../type";
import { retriveConstInfo } from "../retrieveConstInfo";

export function transformInstillFormTreeToDefaultValue({
  tree,
  selectedConditionMap,
}: {
  tree: InstillFormTree;
  selectedConditionMap: SelectedConditionMap;
}): Nullable<GeneralRecord> {
  if (tree._type === "formGroup") {
    let formGroupValue: Record<string, any> = {};

    for (const property of tree.properties) {
      formGroupValue = {
        ...formGroupValue,
        ...transformInstillFormTreeToDefaultValue({
          tree: property,
          selectedConditionMap,
        }),
      };
    }

    if (tree.fieldKey) {
      return {
        [tree.fieldKey]: formGroupValue,
      };
    } else {
      return formGroupValue;
    }
  }

  if (tree._type === "formCondition") {
    let formConditionValue: GeneralRecord = {};

    const constField = tree.conditions[
      Object.keys(tree.conditions)[0]
    ].properties.find((e) => "const" in e);

    if (!constField || !constField.path) {
      if (tree.fieldKey) {
        return {
          [tree.fieldKey]: formConditionValue,
        };
      } else {
        return formConditionValue;
      }
    }

    const selectedConditionKey = selectedConditionMap[constField.path];

    formConditionValue = {
      ...formConditionValue,
      ...transformInstillFormTreeToDefaultValue({
        tree: tree.conditions[selectedConditionKey],
        selectedConditionMap,
      }),
    };

    if (tree.fieldKey) {
      return {
        [tree.fieldKey]: formConditionValue,
      };
    } else {
      return formConditionValue;
    }
  }

  if (tree._type === "formArray") {
    let formArrayValue: Record<string, any> = {};

    for (const property of tree.properties) {
      formArrayValue = {
        ...formArrayValue,
        ...transformInstillFormTreeToDefaultValue({
          tree: property,
          selectedConditionMap,
        }),
      };
    }

    if (tree.fieldKey) {
      return {
        [tree.fieldKey]: [formArrayValue],
      };
    } else {
      return [formArrayValue];
    }
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
