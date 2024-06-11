import Koa from "koa";
import Router, { RouterContext } from "koa-router";
import logger from "koa-logger";
import json from "koa-json";
import passport from 'koa-passport';
import bodyParser from "koa-bodyparser";
import cors from '@koa/cors';
import serve from 'koa-static';
import { router as articles } from "./routes/articles";
import { router as dogs } from "./routes/dogs";
import { router as special } from './routes/special';
import { router as uploads } from './routes/uploads';
import { router as users } from "./routes/users";

const app: Koa = new Koa();
const router: Router = new Router();

// Serve static files from the docs directory
app.use(serve('./docs'));

// CORS middleware
app.use(cors());

// Logging middleware
app.use(logger());

// JSON pretty-printed response middleware
app.use(json());

// Body parser middleware
app.use(bodyParser());

// Initialize passport for authentication
app.use(passport.initialize());

// Routes
app.use(users.routes());
app.use(users.allowedMethods());
app.use(articles.routes());
app.use(articles.allowedMethods());
app.use(dogs.routes());
app.use(dogs.allowedMethods());
app.use(special.routes());
app.use(special.allowedMethods());
app.use(uploads.routes());
app.use(uploads.allowedMethods());

// 404 handler
app.use(async (ctx: RouterContext, next: any) => {
  await next();
  if (ctx.status === 404) {
    ctx.status = 404;
    ctx.body = { err: "No such endpoint existed" };
  }
});

// Global error handler
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
  ctx.status = err.status || 500;
  ctx.body = { err: err.message };
});

const port = process.env.PORT || 10888;
app.listen(port, () => {
  console.log(`Koa server started on port ${port}`);
});
