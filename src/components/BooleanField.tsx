import { Form, Switch } from "@instill-ai/design-system";
import { GeneralUseFormReturn } from "@instill-ai/toolkit";

export const BooleanField = (props: {
  form: GeneralUseFormReturn;
  path: string;
  title: null | string;
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
