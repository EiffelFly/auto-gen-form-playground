# About this repo

This is a PoC of InstillAI Auto-generated form. 

## Implementation details

### About form validation

- We set the `mode` and `reValidateMode` of react-hook-form re to `onSubmit` to block the error when user switch an oneOf field's condition cause Zod to have literal validation issue. 

But at the same time, we also want to validate user's input on change to clean up a path toward auto-saving feature. We manually trigger react-hook-form validation onChange in every fields.