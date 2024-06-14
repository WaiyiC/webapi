import * as db from '../helpers/database';

//add a new like record
export const like = async (dogid:any, userid:any) =>{

 let query = `INSERT INTO dogLikes (dogid,userid) VALUES (${dogid},${userid}) ON CONFLICT ON CONSTRAINT  NoDuplicateLike DO NOTHING RETURNING userid;`   

 try{   
  const result:any=await db.run_query(query, [dogid, userid]); 
  console.log("result return ", result)
       return {"status": 201, "affectedRows":1,"userid" :result[0].userid}

 } catch(error) {
  return error
}
 }

//remove a like record
export const dislike = async  (dogid:any, userid:any)=> {
  let query = "DELETE FROM dogLikes WHERE dogid=? AND userid=?; ";
   try{
    await db.run_query(query, [dogid, userid]);  
    return { "affectedRows":1 }
  } catch(error) {
    return error
  }

}


//count the likes for an article

export const count = async  (dogid:any) =>{
  let query = "SELECT count(1) as likes FROM dogLikes WHERE dogid=?;";
  const result:any = await db.run_query(query, [dogid]);
  return result[0].likes;
}

