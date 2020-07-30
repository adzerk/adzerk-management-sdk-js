import fileType from "file-type";
import FormData from "form-data";
import { URLSearchParams } from "url";
import { isStream } from "./utils";

const bodySerializerFactory = (contentType: string) => {
  switch (contentType) {
    case "application/x-www-form-urlencoded":
      return async (body: any) => {
        let form = new URLSearchParams();
        Object.keys(body).forEach((k) => form.append(k, body[k]));
        return form;
      };
    case "application/json":
      return async (body: any) => JSON.stringify(body);
    case "multipart/form-data":
      return async (body: any) => {
        let form = new FormData();
        let promises = Object.keys(body).map(async (k) => {
          if (Buffer.isBuffer(body[k])) {
            let ft = await fileType.fromBuffer(body[k]);
            if (ft == undefined) {
              return;
            }
            form.append(k, body[k], {
              contentType: ft.mime,
              filename: `temp.${ft.ext}`,
            });
          } else if (isStream(body[k])) {
            let ft = await fileType.fromStream(body[k]);
            if (ft == undefined) {
              return;
            }
            form.append(k, body[k], {
              contentType: ft.mime,
              filename: `temp.${ft.ext}`,
            });
          } else {
            form.append(k, body[k]);
          }
        });

        await Promise.all(promises);
        return form;
      };
    default:
      return async (body: any) => undefined;
  }
};

export default bodySerializerFactory;
