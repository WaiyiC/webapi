import Router, {RouterContext} from "koa-router";
import bodyParser from "koa-bodyparser";
import * as model from "../models/dogs";
import * as dogLikes from "../models/dogLikes";
import * as favs from "../models/favs";
import * as msgs from "../models/msgs";
import { validateDog } from "../controllers/validation";
import { basicAuth } from "../controllers/auth";
import mime from "mime-types";
import { copyFileSync, existsSync, createReadStream } from "fs";
import { v4 as uuidv4 } from 'uuid';

interface Post {
  id: number,
  name: string;
  breed: string;
  age: number;
  description: string;
  image: string;
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
       const { id = 0, name = "",  breed="",age = 0, image = "",description="" }: Partial<Post> = post;
       const links = {
         likes: `http://${ctx.host}/api/v1/dogs/${post.id}/likes`,
         fav: `http://${ctx.host}/api/v1/dogs/${post.id}/fav`,
         msg: `http://${ctx.host}/api/v1/dogs/${post.id}/msg`,
         self: `http://${ctx.host}/api/v1/dogs/${post.id}`
       };
       return { id, name, age, breed, image, description, links }; 
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

const getByDog = async (ctx: RouterContext, next: any) => {
  const age = parseInt(ctx.params.age);
  const breed = ctx.params.breed;

  if (isNaN(age) && !breed) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid age or breed' };
    return;
  }

  try {
    const dogs = await model.getByDog(age, breed);
    if (dogs.length) {
      ctx.body = dogs;
      ctx.status = 200;
    } else {
      ctx.status = 404;
      ctx.body = { message: 'No dogs found' };
    }
  } catch (error) {
    console.error('Error fetching dogs by age or breed:', error);
    ctx.status = 500;
    ctx.body = { message: 'Internal server error' };
  }

  await next();
};

const updateDog = async (ctx: RouterContext, next: () => Promise<any>) => {
  const body = ctx.request.body;
  const id = ctx.params.id; // Use the ID from params directly
  console.log(body, id);

  let result = await model.updateDog(body, id); // Pass the ID directly here
  if (result.status == 201) {
    ctx.status = 201;
    ctx.body = body;
  } else {
    ctx.status = 500;
    ctx.body = { err: "Update data failed" };
  }
  await next();
};
const deleteDog = async (ctx: RouterContext, next: any) => {
  let id = +ctx.params.id;

let dog:any = await model.deleteByDogId(id)
  ctx.status=201
  ctx.body = dog.affectedRows ? {message: "removed"} : {message: "error"};
  await next();
}

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

async function userFav(ctx: RouterContext, next: any) {
  // For you TODO: add error handling and error response code
  const user = ctx.state.user;
  const uid:number =user.id;
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
  const uid:number =user.id;
  const id = parseInt(ctx.params.id);
  const result:any = await favs.removeFav(id, uid);
  ctx.body = result.affectedRows ? {message: "removed"} : {message: "error"};
  await next();
}

async function listMsg(ctx: RouterContext, next: any){
   const id = parseInt(ctx.params.id);
   const result = await msgs.getMsg(id);
  ctx.body = result ? result : 0;
  await next();
}

async function addComment(ctx: RouterContext, next: () => Promise<any>) {
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

    const requestBody: { messagetxt: string } = ctx.request.body as { messagetxt: string };
    const messagetxt: string = requestBody.messagetxt;
    console.log('Comment:', messagetxt);

    
    const result: any = await msgs.add_Msg(dogid, userid, messagetxt);
    console.log('Database result:', result);

    ctx.body = result.affectedRows ? { message: "liked", userid: result.userid } : { message: "error" };
  } catch (error) {
    console.error("Error in likeDogs:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }
  await next();
}

async function deleteComment(ctx: RouterContext, next: any) {
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

    const commentId: number = parseInt(ctx.params.commentId, 10);
    const result: any = await dogComments.deleteComment(commentId);

    ctx.body = result.affectedRows ? { message: "Comment deleted" } : { message: "Failed to delete comment" };
  } catch (error) {
    console.error("Error deleting comment:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }

  await next();
}

const uploadImage = async (ctx: RouterContext, next: any) => {
  if (!ctx.isAuthenticated()) {
    ctx.status = 401;
    ctx.body = { message: "Unauthorized" };
    return;
  }

  const user = ctx.state.user;
  const userid: number = user.id;

  const file = ctx.request.files?.image;
  if (!file) {
    ctx.status = 400;
    ctx.body = { message: "No image file provided" };
    return;
  }

  const fileName = `${uuidv4()}.${mime.extension(file.type)}`;
  const filePath = `/path/to/upload/directory/${fileName}`;

  try {
    copyFileSync(file.path, filePath);
    ctx.body = { image: filePath };
  } catch (error) {
    console.error("Error uploading image:", error);
    ctx.status = 500;
    ctx.body = { message: "Internal server error" };
  }

  await next();
};

router.get('/', getAll);
router.post('/', basicAuth, bodyParser(), validateDog, createDog);
router.put('/:id([0-9]{1,})', basicAuth, bodyParser(),updateDog);
router.delete('/:id([0-9]{1,})', basicAuth, deleteDog);

router.get('/:id([0-9]{1,})', getById);
router.get('/age/:age([0-9]{1,})', getByDog);
router.get('/breed/:breed([a-z,A-Z]{1,})', getByDog);

router.get('/:id([0-9]{1,})/like', likesCount);
router.post('/:id([0-9]{1,})/likes', basicAuth, likeDogs);
router.delete('/:id([0-9]{1,})/likes', basicAuth, dislikeDogs);

router.get('/fav', basicAuth, userFav);
router.post('/:id([0-9]{1,})/fav', basicAuth, postFav);
router.delete('/:id([0-9]{1,})/fav', basicAuth, rmFav);

router.get('/:id([0-9]{1,})/comment', listMsg);
router.post('/:id([0-9]{1,})/comment', bodyParser(), basicAuth, addComment);
router.delete('/:id([0-9]{1,})/delComment', basicAuth, bodyParser(),deleteComment);
export { router };