export async function formatResponseBody(
  responseText: string,
): Promise<string> {
  try {
    const jsonData = JSON.parse(responseText);
    return JSON.stringify(jsonData, null, 2);
  } catch {
    return responseText;
  }
}
