interface uploadImageType {
  file: File | string;
  isBase64?: boolean;
}

interface JsonBody {
  base64?: string;
  fileLink?: string;
}

export class API {

  static uploadImage = async ({ file, isBase64 = false }: uploadImageType) => {
    try {
      const url = '/api/image';
      let body: string | FormData;

      const headers: Record<string, string> = {
      };

      if (typeof file === "string") {
        const jsonBody: JsonBody = {};
        if (isBase64) {
          jsonBody.base64 = file;
        } else {
          jsonBody.fileLink = file;
        }
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(jsonBody);
      } else {
        body = new FormData();
        body.append('file', file);
      }

      const response = await fetch(`${url}`, {
        method: 'POST',
        headers,
        body
      });

      const json = await response.json().catch(() => ({} as Record<string, unknown>));
      const data = json.data as
        | { url?: string; kind?: string; name?: string; text?: string }
        | undefined;
      if (!response.ok || json.status !== true || typeof data?.url !== "string") {
        const message =
          typeof json.message === "string"
            ? json.message
            : typeof json.error === "string"
              ? json.error
              : "Upload failed.";
        return { status: false as const, message };
      }

      return {
        status: true as const,
        url: data.url,
        kind: data.kind === "document" ? ("document" as const) : ("image" as const),
        name: typeof data.name === "string" ? data.name : "file",
        text: typeof data.text === "string" ? data.text : "",
      };
    } catch (error) {
      void error;
      return { status: false as const, message: "Upload failed." };
    }
  };

}

export default API;
