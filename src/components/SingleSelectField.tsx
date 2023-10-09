import { Form, Select } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const SingleSelectField = (props: {
  form: GeneralUseFormReturn;
  fieldKey: string;
  title: string;
  description?: string;
  options: string[];
}) => {
  const { form, fieldKey, title, options, description } = props;

  return (
    <Form.Field
      control={form.control}
      name={fieldKey}
      render={({ field }) => {
        return (
          <Form.Item>
            <Form.Label>{title}</Form.Label>
            <Select.Root
              onValueChange={field.onChange}
              value={field.value ?? undefined}
            >
              <Form.Control>
                <Select.Trigger className="w-full">
                  <Select.Value />
                </Select.Trigger>
              </Form.Control>
              <Select.Content>
                {options.map((option) => {
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
  );
};
