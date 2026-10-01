export async function functionErrorMessage(error, fallback) {
  try {
    const body = await error?.context?.clone?.().json();
    if (typeof body?.message === "string") return body.message.slice(0, 500);
  } catch { /* Network failures have no response body. */ }
  return fallback;
}
