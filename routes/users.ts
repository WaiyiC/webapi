import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import { basicAuth } from '../controllers/auth';
import { validateUser } from '../controllers/validation';
import * as model from '../models/users';

const prefix = '/api/v1/users';
const router = new Router({ prefix });

const getAll = async (ctx: any, next: any) => {
  let users = await model.getAll(20, 1);
  ctx.body = users.length ? users : {};
  await next();
};

const doSearch = async (ctx: any, next: any) => {
  let { limit = 50, page = 1, fields = "", q = "" } = ctx.request.query;
  limit = Math.min(Math.max(parseInt(limit), 1), 200);
  page = Math.max(parseInt(page), 1);
  try {
    let result = q ? await model.getSearch(fields, q) : await model.getAll(limit, page);
    if (result.length && fields) {
      if (!Array.isArray(fields)) fields = [fields];
      result = result.map((record: any) => {
        let partial: any = {};
        for (let field of fields) {
          partial[field] = record[field];
        }
        return partial;
      });
    }
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }
  await next();
};

const getById = async (ctx: any, next: any) => {
  let user = await model.getByUserId(ctx.params.id);
  ctx.body = user.length ? user[0] : {};
  await next();
};

const createUser = async (ctx: any, next: any) => {
  const { username, password, email, acticode } = ctx.request.body;
  let role = ['mongkok_123456789', 'mongkok_987654321', 'shatin_123456789', 'shatin_987654321', 'chaiwan_123456789', 'chaiwan_987654321'].includes(acticode) ? 'admin' : 'user';
  let newUser = { username, password, email, role, acticode };
  let result = await model.add(newUser);
  ctx.status = 201;
  ctx.body = result ? result : { message: "New user created" };
};

const login = async (ctx: any, next: any) => {
  // Return any details needed by the client
  const user = ctx.state.user;
  if (!user) {
    ctx.status = 401;
    ctx.body = { message: 'Authentication failed' };
    return;
  }
  const { id, username, email, role } = user;
  const links = {
    self: `http://${ctx.host}${prefix}/login/${id}`,
  };
  ctx.body = { id, username, email, role, links };
  await next();
}

const updateUser = async (ctx: any) => {
  let result = await model.update(ctx.request.body, +ctx.params.id);
  ctx.status = 201;
  ctx.body = `User with id ${ctx.params.id} updated`;
};

const deleteUser = async (ctx: any, next: any) => {
  await model.deleteById(+ctx.params.id);
  ctx.status = 201;
  ctx.body = `User with id ${ctx.params.id} deleted`;
  await next();
};

router.get('/', basicAuth, doSearch);
router.post('/', bodyParser(), validateUser, createUser);
router.get('/:id([0-9]{1,})', getById);
router.put('/:id([0-9]{1,})', bodyParser(), validateUser, updateUser);
router.del('/:id([0-9]{1,})', deleteUser);
router.post('/login', bodyParser(), basicAuth, login);

export { router };
