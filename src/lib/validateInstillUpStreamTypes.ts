import {
  Nullable,
  extractTemplateReferenceSetFromString,
} from "@instill-ai/toolkit";
import { JSONSchema7Type } from "json-schema";

export type ValidateIntillUpstreamTypes = {
  type: JSONSchema7Type;
  instullUpstreamTypes: string[];
  instillFormat: string;
  value: string;
};

export type validateIntillUpstreamTypesResult =
  | {
      isValid: true;
      value: any;
    }
  | {
      isValid: false;
      error: string;
    };

export type UpstreamTypeCombination =
  | "reference"
  | "reference_and_string"
  | "reference_and_number";

export function validateIntillUpstreamTypes(
  props: ValidateIntillUpstreamTypes
): validateIntillUpstreamTypesResult {
  const { type, value } = props;

  const templateReferenceSet = extractTemplateReferenceSetFromString(value);

  switch (type) {
    case "reference": {
      if (templateReferenceSet.doubleCurlyBrace.count > 0) {
        return {
          isValid: false,
          error: "This field only accepts single curly braces reference",
        };
      }

      if (
        templateReferenceSet.singleCurlyBrace.count === 0 &&
        templateReferenceSet.doubleCurlyBrace.count === 0
      ) {
        return {
          isValid: false,
          error: "This field only accepts reference",
        };
      }

      if (templateReferenceSet.singleCurlyBrace.count > 1) {
        return {
          isValid: false,
          error:
            "Each field can only accepts one single curly braces reference",
        };
      }

      return {
        isValid: true,
        value,
      };
    }

    case "reference_and_string": {
      if (
        templateReferenceSet.singleCurlyBrace.count === 1 &&
        templateReferenceSet.doubleCurlyBrace.count > 0
      ) {
        return {
          isValid: false,
          error:
            "Single curly braces reference can not be used with double curly braces reference",
        };
      }

      if (templateReferenceSet.singleCurlyBrace.count > 1) {
        return {
          isValid: false,
          error:
            "Each field can only accepts one single curly braces reference",
        };
      }

      return {
        isValid: true,
        value,
      };
    }

    case "reference_and_number": {
      if (
        templateReferenceSet.singleCurlyBrace.count === 1 &&
        templateReferenceSet.doubleCurlyBrace.count > 0
      ) {
        return {
          isValid: false,
          error:
            "Single curly braces reference can not be used with double curly braces reference",
        };
      }

      if (templateReferenceSet.singleCurlyBrace.count > 1) {
        return {
          isValid: false,
          error:
            "Each field can only accepts one single curly braces reference",
        };
      }

      if (
        templateReferenceSet.singleCurlyBrace.count === 0 &&
        templateReferenceSet.doubleCurlyBrace.count === 0
      ) {
        if (isNaN(Number(value))) {
          return {
            isValid: false,
            error: "This field only accepts number or reference",
          };
        } else {
          return {
            isValid: true,
            value: Number(value),
          };
        }
      }

      return {
        isValid: true,
        value,
      };
    }
  }

  return {
    isValid: false,
    error: "Invalid value",
  };
}

function determineUpUpstreamTypeCombination({
  type,
  instillFormat,
  instillUpstreamTypes,
}: {
  type: Nullable<string>;
  instillFormat: string;
  instillUpstreamTypes: string[];
}): Nullable<UpstreamTypeCombination> {
  if (instillFormat === "text") {
    if (
      instillUpstreamTypes.includes("value") &&
      instillUpstreamTypes.includes("reference")
    ) {
      return "reference_and_string";
    }

    if (
      instillUpstreamTypes.includes("reference") &&
      instillUpstreamTypes.length === 1
    ) {
      return "reference";
    }
  }

  if (instillFormat === "number" || instillFormat === "integer") {
    if (
      instillUpstreamTypes.includes("value") &&
      instillUpstreamTypes.includes("reference")
    ) {
      return "reference_and_number";
    }
  }

  return null;
}
