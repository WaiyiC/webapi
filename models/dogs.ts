import * as db from '../helpers/database';
 

export const getByDogId = async (id: any) => {
  let query = 'SELECT * FROM dogs WHERE ID = ?';
  let values = [id];
  let data = await db.run_query(query, values);
  return data;
}

export const getByDog = async (age: any, breed: any) => {
  let query = 'SELECT * FROM dogs WHERE 1=1';
  let values = [];

  if (!isNaN(age)) {
    query += ' AND age = ?';
    values.push(age);
  }

  if (breed) {
    query += ' AND breed = ?';
    values.push(breed);
  }

  let data = await db.run_query(query, values);
  return data;
};


export const getAllDog = async  (limit=10, page=1, order:any, direction:any) =>{
  const offset = (page - 1) * limit;
  const query = "SELECT * FROM dogs LIMIT  ? OFFSET  ?;";
  const data = await db.run_query(query, [limit, offset]);
  return data;
}

export const addDog = async(dog: any) => {
  let keys = Object.keys(dog);
  let values = Object.values(dog);
  let key = keys.join(',');
  let param = '';
  for(let i: number = 0; i<values.length; i++) {
    param += '? ,';
  }
  param=param.slice(0, -1);
  let query = `INSERT INTO dogs (${key}) VALUES (${param})`;
  try {
    await db.run_insert(query, values);
    return {status: 201};
  } catch(err: any) {
    return err;
  }
}


export const updateDog = async (dog: any, id: any) => {
  let keys = Object.keys(dog);
  let values = Object.values(dog);  
  let updateString = keys.map(key => `${key} = ?`).join(',');

  let query = `UPDATE dogs SET ${updateString} WHERE ID = ? RETURNING *;`
  try {
    await db.run_query(query, [...values, id]); // Add ID to the end of the values array
    return { status: 201 };
  } catch (error) {
    console.error('Database error:', error);
    return { status: 500, error: error.message };
  }
}
export const deleteByDogId = async (id:any) => {
  let query = "Delete FROM dogs WHERE ID = ?"
  let values = [id]
  try{
    await db.run_query(query, values);  
    return { "affectedRows":1 }
  } catch(error) {
    return error
  }
}