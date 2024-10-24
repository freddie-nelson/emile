import { ZodError } from "zod";

export function zodErrorToUserFriendlyMessage(error: ZodError) {
  const messages = error.errors.map((e) =>
    e.message
      .replace("String", e.path[0].toString() ?? "Value")
      .replace("Required", (e.path[0].toString() ?? "Value") + " is required")
  );

  return messages.join(", ");
}
