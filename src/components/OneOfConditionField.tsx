import { SelectedConditionMap } from "@/lib/transformer";
import { Form, Select } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";
import * as React from "react";

export const OneOfConditionField = ({
  form,
  fieldKey,
  title,
  description,
  conditionComponents,
  setSelectedConditionMap,
}: {
  form: GeneralUseFormReturn;
  fieldKey: string;
  setSelectedConditionMap: React.Dispatch<
    React.SetStateAction<SelectedConditionMap | null>
  >;
  conditionComponents: Record<string, React.ReactNode>;
  description?: string;
  title?: string;
}) => {
  const conditionOptions = React.useMemo(() => {
    return Object.entries(conditionComponents).map(([k, v]) => k);
  }, [conditionComponents]);

  return (
    <div className="flex flex-col">
      <Form.Field
        control={form.control}
        name={fieldKey}
        render={({ field }) => {
          return (
            <Form.Item>
              <Form.Label>{title}</Form.Label>
              <Select.Root
                onValueChange={(event) => {
                  field.onChange(event);
                  setSelectedConditionMap((prev) => {
                    return {
                      ...prev,
                      [fieldKey]: event,
                    };
                  });
                }}
                value={field.value ?? undefined}
              >
                <Form.Control>
                  <Select.Trigger className="w-full">
                    <Select.Value />
                  </Select.Trigger>
                </Form.Control>
                <Select.Content>
                  {conditionOptions.map((option) => {
                    return (
                      <Select.Item
                        key={option}
                        value={option}
                        className="my-auto text-semantic-fg-primary product-body-text-2-regular group-hover:text-semantic-bg-primary data-[highlighted]:text-semantic-bg-primary"
                      >
                        <p className="my-auto">{option}</p>
                      </Select.Item>
                    );
                  })}
                </Select.Content>
              </Select.Root>
              <Form.Description>{description}</Form.Description>
              <Form.Message />
            </Form.Item>
          );
        }}
      />
      {conditionComponents[form.watch(fieldKey)] ? (
        <div className="flex flex-col gap-y-5">
          {conditionComponents[form.watch(fieldKey)]}
        </div>
      ) : null}
    </div>
  );
};
