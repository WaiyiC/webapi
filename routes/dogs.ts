import Router, {RouterContext} from "koa-router";
import bodyParser from "koa-bodyparser";
import * as model from "../models/dogs";
import * as dogLikes from "../models/dogLikes";
import * as favs from "../models/favs";
import * as msgs from "../models/msgs";
import { validateDog } from "../controllers/validation";
import { basicAuth } from "../controllers/auth";


interface Post {
  id: number,
  name: string;
  breed: string;
  age: number;
  description: string;
  imageurl: string;
  links: {
    likes: string,
    fav: string,
    msg: string,
    self: string
  }
}
const router:Router = new Router({prefix: '/api/v1/dogs'});

const getAll = async (ctx: RouterContext, next: any) => {
  //ctx.body = articles;
const {limit=100, page=1,  order="dateCreated", direction='ASC'} = ctx.request.query;
  const parsedLimit = parseInt(limit as string, 10);
  const parsedPage = parseInt(page as string, 10);
  const result = await model.getAllDog(20, 1, order, direction);
   if (result.length) {
     const body: Post[] = result.map((post: any) => {
       const { id = 0, name = "",  breed="",age = 0, imageurl = "",description="" }: Partial<Post> = post;
       const links = {
         likes: `http://${ctx.host}/api/v1/dogs/${post.id}/likes`,
         fav: `http://${ctx.host}/api/v1/dogs/${post.id}/fav`,
         msg: `http://${ctx.host}/api/v1/dogs/${post.id}/msg`,
         self: `http://${ctx.host}/api/v1/dogs/${post.id}`
       };
       return { id, name, age, breed, imageurl, description, links }; 
     });
  ctx.body = body;
  
  await next();
      
   }
}
const createDog = async (ctx: RouterContext, next: any) => {
  const body = ctx.request.body;
  let result = await model.addDog(body);
  if(result.status==201) {
    ctx.status = 201;
    ctx.body = body;
  } else {
    ctx.status = 500;
    ctx.body = {err: "insert data failed"};
  }
  await next();
}

const getById = async (ctx: RouterContext, next: any) => {
  let id = +ctx.params.id;
  let dog = await model.getByDogId(id);
  if(dog.length) {
    ctx.body = dog[0];
     ctx.status=200;
  } else {
    ctx.status = 404;
  }
  await next();
}

const updateDog = async (ctx: RouterContext, next: any) => {
  let id = +ctx.params.id;
  //let {title, fullText} = ctx.request.body;
  let c: any = ctx.request.body;
  
  let result = await model.updateDog(c,id)
  if (result) {
    ctx.status = 201
    ctx.body = `dogs with id ${id} updated` 
  } 
  await next();
}

const deleteDog = async (ctx: RouterContext, next: any) => {
  let id = +ctx.params.id;

let dog:any = await model.deleteByDogId(id)
  ctx.status=201
  ctx.body = dog.affectedRows ? {message: "removed"} : {message: "error"};
  await next();
}


// methods for like icon
async function likesCount(ctx: RouterContext, next: any) {
try {
    const id = +ctx.params.id;
    const result = await dogLikes.count(id);
    ctx.body = { likes: result };
  } catch (error) {
    console.error(`Error fetching likes count for dog with ID ${ctx.params.id}:`, error);
    ctx.body = { message: "Internal server error" };
    ctx.status = 500;
  }
  await next();
}

async function likeDogs(ctx: RouterContext, next: () => Promise<any>) {
  try {
    if (!ctx.isAuthenticated()) {
      ctx.status = 401;
      ctx.body = { message: "Unauthorized" };
      return;
    }

    const user = ctx.state.user;
    if (!user || !user.id) {
      ctx.status = 401;
      ctx.body = { message: "Unauthorized" };
      return;
    }

    const userid: number = user.id;
    console.log('User ID:', userid);

    const dogid: number = parseInt(ctx.params.id, 10);
    console.log('Dog ID:', dogid);

    const result: any = await dogLikes.like(dogid, userid);
    console.log('Database result:', result);

    ctx.body = result.affectedRows ? { message: "liked", userid: result.userid } : { message: "error" };
  } catch (error) {
    console.error("Error in likeDogs:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }

  await next();
}



async function dislikeDogs(ctx: RouterContext, next: () => Promise<any>) {
  try {
    
    if (!ctx.isAuthenticated()) {
      ctx.status = 401;
      ctx.body = { message: "Unauthorized" };
      return;
    }

    const user = ctx.state.user;
    if (!user || !user.id) {
      ctx.status = 401;
      ctx.body = { message: "Unauthorized" };
      return;
    }

    const userid: number = user.id;
    console.log('User ID:', userid);

    const dogid: number = parseInt(ctx.params.id, 10);
    console.log('Dog ID:', dogid);

    const result: any = await dogLikes.dislike(dogid, userid);
    console.log('Database result:', result);

    ctx.body = result.affectedRows ? { message: "unliked", userid: result.userid } : { message: "error" };
  } catch (error) {
    console.error("Error in likeDogs:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }

  await next();
}

//mehtods for Heart(Favorite) icon
async function userFav(ctx: RouterContext, next: any) {
  // For you TODO: add error handling and error response code
  const user = ctx.state.user;
  const uid:number =user.user.id;
  const result = await favs.listFav(uid);
  ctx.body = result ? result : 0;
  await next();
}

async function postFav(ctx: RouterContext, next: any) {
  // For you TODO: add error handling and error response code
  const user = ctx.state.user;
  const uid:number =user.user.id;
  const id = parseInt(ctx.params.id);
  const result:any = await favs.addFav(id, uid);
  ctx.body = result.affectedRows ? {message: "added",userid:result.userid} : {message: "error"};
  await next();
}

async function rmFav(ctx: RouterContext, next: any) {
  // For you TODO: add error handling and error response code
  const user = ctx.state.user;
  const uid:number =user.user.id;
  const id = parseInt(ctx.params.id);
  const result:any = await favs.removeFav(id, uid);
  ctx.body = result.affectedRows ? {message: "removed"} : {message: "error"};
  await next();
}

//methods for message icon
async function listMsg(ctx: RouterContext, next: any){
   const id = parseInt(ctx.params.id);
   const result = await msgs.getMsg(id);
  ctx.body = result ? result : 0;
  await next();
}

async function addMsg(ctx: RouterContext, next: any){
  const id = parseInt(ctx.params.id);
  const user = ctx.state.user;
  const uid:number =user.user.id;
  const uname = user.user.username;
  let msg:any = ctx.request.body;
  console.log('ctx.request.body ',ctx.request.body)
  console.log('..msg ',msg)
  const result:any= await msgs.add_Msg(id, uid,uname, msg);
  ctx.body = result.affectedRows ? {message: "added"} : {message: "error"};
  await next();
}

async function rmMsg(ctx: RouterContext, next: any){
  // const uid = ctx.state.user.id;
// only admin can del article comment
 let b:any = ctx.request.body;
 
 const id = parseInt(ctx.params.id); 
  const result:any = await msgs.removeMsg(id, b);
  ctx.body = result.affectedRows ? {message: "removed"} : {message: "error"}; 
  await next();
}

router.get('/', getAll);
router.post('/', basicAuth, bodyParser(), validateDog, createDog);
router.get('/:id([0-9]{1,})', getById);
router.put('/:id([0-9]{1,})', basicAuth, bodyParser(),validateDog, updateDog);
router.delete('/:id([0-9]{1,})', basicAuth, deleteDog);
router.get('/:id([0-9]{1,})/like', likesCount);
router.post('/:id([0-9]{1,})/likes', basicAuth, likeDogs);
router.delete('/:id([0-9]{1,})/likes', basicAuth, dislikeDogs);

router.get('/fav', basicAuth, userFav);
router.post('/:id([0-9]{1,})/fav', basicAuth, postFav);
router.delete('/:id([0-9]{1,})/fav', basicAuth, rmFav);

router.get('/:id([0-9]{1,})/msg', listMsg);
router.post('/:id([0-9]{1,})/msg', bodyParser(), basicAuth, addMsg);
router.delete('/:id([0-9]{1,})/msg', basicAuth, bodyParser(),rmMsg);
export { router };
