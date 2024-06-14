import * as db from '../helpers/database';

//get all Msgs of articled
export const getMsg= async  (id:any)=> {
  let query = "SELECT * FROM dogComments WHERE dogid=?;";
  const result = await db.run_query(query, [id]);
  return result;
}

//add a new Msg

export const add_Msg = async (id: any, uid: any, msg: string) => {
  try {
    let query = `INSERT INTO dogscomment (dogid, userid, messagetxt) VALUES (?, ?, ?)`;
    const result = await db.run_query(query, [id, uid, msg]);

    return { status: 201, affectedRows: result.affectedRows };

  } catch (error) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }
};



    

//remove a msg record
export const removeMsg = async  (id:any, msg:any)=> {
  console.log('body query ', msg)
  let msgtxtin=msg.source
  console.log("msgtxtin from source ", msgtxtin)
  let msgObj=JSON.parse(msgtxtin)
  console.log("msgtxtin from msgObje ", msgObj)
  
  let msgtxt:any=msgObj.messagetxt
  console.log('in query ', msgtxt)
let query = "DELETE FROM msgs WHERE articleid=? AND messagetxt=?; ";
   try{
    await db.run_query(query, [id, msgtxt]);  
    return { "affectedRows":1 }
  } catch(error) {
    return error
  }

}


