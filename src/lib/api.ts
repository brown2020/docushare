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
      let filename: string | undefined;
      let heading: string | undefined;
      let size: number | undefined;

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
        filename = file.name ? file.name : '';
        heading = filename.replace(/\.[^/.]+$/, "");
        size = file.size;
      }

      const response = await fetch(`${url}`, {
        method: 'POST',
        headers,
        body
      });

      const json = await response.json();
      if (json.status === true) {
        return { status: true, url: json.data.filename };
      }

      return { status: false };
    } catch (error) {
      console.log("Error", error);
      return { status: false };
    }
  };

  static aiGenerate = async (option: string, prompt: string, command = '') => {
    try {
      const url = "/api/ai";
      const body: Record<string, string> = { option, prompt };
      if (command) body.command = command;

      const headers = { 'Content-Type': 'application/json' };
      const response = await fetch(`${url}?isIcon=false`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      const json = await response.json();
      return { status: true, data: json.response };
    } catch (error) {
      console.log("Error", error);
      return { status: false };
    }
  };

  static getCitation = async (command: string) => {
    try {
      const url = "/api/citation";
      const body = JSON.stringify({ command });
      const headers = { 'Content-Type': 'application/json' };

      const response = await fetch(`${url}?isIcon=false`, {
        method: 'POST',
        headers,
        body,
      });

      const json = await response.json();
      if (json.status) {
        return { status: true, data: json.data };
      } else {
        return { status: false, data: [] };
      }
    } catch (error) {
      console.log("Error", error);
      return { status: false };
    }
  };
}

export default API;
