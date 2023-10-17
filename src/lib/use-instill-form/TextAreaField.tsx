import { Form, Textarea } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const TextAreaField = (props: {
  form: GeneralUseFormReturn;
  path: string;
  title: string | null;
  description?: string;
}) => {
  const { form, path, title, description } = props;
  return (
    <Form.Field
      control={form.control}
      name={path}
      render={({ field }) => {
        return (
          <Form.Item>
            <Form.Label>{title}</Form.Label>
            <Form.Control>
              <Textarea
                {...field}
                value={field.value ?? ""}
                autoComplete="off"
                onChange={(e) => {
                  field.onChange(e);
                  form.trigger(path, { shouldFocus: true });
                }}
              />
            </Form.Control>
            <Form.Message />
          </Form.Item>
        );
      }}
    />
  );
};
