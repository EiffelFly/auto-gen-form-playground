import { Form, Select } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const SingleSelectField = (props: {
  form: GeneralUseFormReturn;
  fieldKey: string;
  title: string;
  description?: string;
  items: string[];
}) => {
  const { form, fieldKey, title, items, description } = props;

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
                {items.map((item) => {
                  return (
                    <Select.Item
                      key={item}
                      value={item}
                      className="my-auto text-semantic-fg-primary product-body-text-2-regular group-hover:text-semantic-bg-primary data-[highlighted]:text-semantic-bg-primary"
                    >
                      <p className="my-auto">{item}</p>
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
