import { Form, Switch } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const BooleanField = (props: {
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
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </Form.Control>
            <Form.Message />
            <Form.Description>{description}</Form.Description>
          </Form.Item>
        );
      }}
    />
  );
};
