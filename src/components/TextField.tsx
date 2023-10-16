import { Form, Input } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const TextField = (props: {
  form: GeneralUseFormReturn;
  path: string;
  title: string | null;
  description?: string;
}) => {
  const { form, path, title, description } = props;
  return (
    <Form.Field
      key={path}
      control={form.control}
      name={path}
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
