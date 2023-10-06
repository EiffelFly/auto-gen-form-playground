import { Form, Input } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const TextField = (props: {
  form: GeneralUseFormReturn;
  fieldKey: string;
  title: string;
  description?: string;
}) => {
  const { form, fieldKey, title, description } = props;
  return (
    <Form.Field
      key={fieldKey}
      control={form.control}
      name={fieldKey}
      render={({ field }) => {
        return (
          <Form.Item>
            <Form.Label>{title}</Form.Label>
            <Form.Control>
              <Input.Root>
                <Input.Core
                  {...field}
                  type="text"
                  value={field.value ?? ""}
                  autoComplete="off"
                />
              </Input.Root>
            </Form.Control>
            <Form.Description>{description}</Form.Description>
            <Form.Message />
          </Form.Item>
        );
      }}
    />
  );
};
