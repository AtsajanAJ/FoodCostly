/** Replace `{name}` placeholders in a dictionary string. */
export function formatMessage(
  template: string,
  vars: Record<string, string | number> = {},
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null ? `{${key}}` : String(value);
  });
}
