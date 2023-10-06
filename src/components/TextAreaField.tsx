import { Form, Textarea } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const TextAreaField = (props: {
  form: GeneralUseFormReturn;
  fieldKey: string;
  title: string;
  description?: string;
}) => {
  const { form, fieldKey, title, description } = props;
  return (
    <Form.Field
      control={form.control}
      name={fieldKey}
      render={({ field }) => {
        return (
          <Form.Item>
            <Form.Label>{title}</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                value={field.value ?? ""}
                autoComplete="off"
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        );
      }}
    />
  );
};
