import * as db from '../helpers/database';

//add a user Favorite
export const addFav = async (dogid:any, userid:any) =>{
  try {
      let query = `INSERT INTO favs (dogid, userid) VALUES (?, ?) ON CONFLICT ON CONSTRAINT  NoDuplicateFavorites DO NOTHING RETURNING userid;`;
      const result = await db.run_query(query, [dogid, userid]);

      return { status: 201, affectedRows: result.affectedRows };


    } catch (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }
  };

//remove a fav record
export const removeFav = async (id:any, uid:any) =>{
   let query = `DELETE FROM favs WHERE dogid=${id} AND userid=${uid} ;`;
   try{
        await db.run_query(query, [id, uid]);  
    return { "affectedRows":1 }
  } catch(error) {
    return error
  }

}

export const listFav = async (id: any) => {
  let query = "SELECT dogs.* FROM dogs JOIN favs ON dogs.id = favs.dogid WHERE favs.userid = ?";
  const result = await db.run_query(query, [id]);
  return result;
};