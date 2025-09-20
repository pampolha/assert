// deno-lint-ignore no-explicit-any
export const inspectError = (err: unknown, ...data: any[]) =>
  console.error(
    new Error(new Date().toISOString()),
    `\nInspected error: ${Deno.inspect(err)}\n`,
    ...data,
  );
