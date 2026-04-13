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

      const json = await response.json();
      if (json.status === true) {
        return { status: true, url: json.data.url };
      }

      return { status: false };
    } catch (error) {
      void error;
      return { status: false };
    }
  };

}

export default API;
