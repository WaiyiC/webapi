import Router, { RouterContext } from "koa-router";
import koaBody from "koa-body";
import mime from "mime-types";
import { copyFileSync, existsSync, createReadStream } from "fs";
import { v4 as uuidv4 } from 'uuid';

const upload_options = {
    multipart: true,
    formidable: { uploadDir: './img' }
};

const koaBodyM = koaBody(upload_options);
const fileStore = './img';
const router = new Router({ prefix: '/api/v1' });

router.post('/images', koaBodyM, async (ctx: RouterContext, next: any) =>
{
try {   
      const upload = ctx.request.files?.upload;
      let path: string | undefined;
      let name: string | undefined;
      let type: string | undefined;;
      let extension:string|null;
      if (Array.isArray(upload)) {
          // Handle if 'upload' is an array of files
          if (upload.length > 0) {
              path = upload[0].filepath;
              name = upload[0].newFilename;
               type = upload[0].mimetype|| ''                   
          }
      } else {
          // Handle if 'upload' is a single file
          path = upload?.filepath;
          name = upload?.newFilename;
          type = upload?.mimetype|| '';    
      }
  if (type) {
    extension = mime.extension(type) || null;
  } else {
    // Handle the case where 'type' is undefined
    extension = null;
  }
  
    
      console.log('Uploaded file details:')
      console.log(`path: ${path}`);
      console.log(`filename: ${name}`);
      console.log(`type: ${type}`);
      console.log(`extension: ${extension}`);   
      const imageName = uuidv4();
      const newPath = `${fileStore}/${imageName}`;
     if (path) {
        copyFileSync(path, newPath);
      } else {
        throw new Error('Path is not defined for copying the file.');
     }
      ctx.status = 201;
      ctx.body = {
      filename: name,
      type: type,
      extension: extension,
        links: {//`https://${ctx.host}${prefix}/${path}`

            path: `http://${ctx.host}${router.url('get_image', imageName)}`
          }

      };
  } catch(err:any) {
      console.log(`error ${err.message}`);
      ctx.throw(500, 'upload error', {message: err.message});
  }
});

router.get('get_image', '/images/:uuid([0-9a-f\\-]{36})', async (ctx: RouterContext, next: any) => {
  const uuid = ctx.params.uuid;
  const path = `${fileStore}/${uuid}`;
  console.log('client requested image with path', path);

          try {
              if (existsSync(path)) {
                  // Determine MIME type from the file extension
                  const mimeType = mime.lookup(path) || 'application/octet-stream';
                  ctx.type = mimeType;
                  const src = createReadStream(path);
                  ctx.body = src;
                  ctx.status = 200;
              } else {
                  ctx.status = 404;
              }
          } catch (err: any) {
              console.log(`error ${err.message}`);
              ctx.throw(500, 'image download error', { message: err.message });
          }
      });

      export { router };