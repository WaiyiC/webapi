import * as db from '../helpers/database';

export const getAll = async (limit = 10, page = 1) => {
  const offset = (page - 1) * limit;
  const query = "SELECT * FROM users LIMIT ? OFFSET ?;";
  try {
    const data = await db.run_query(query, [limit, offset]);
    return data;
  } catch (error) {
    console.error('Error in getAll:', error);
    throw error;
  }
};

export const getSearch = async (sfield: any, q: any) => {
  const query = `SELECT ${sfield} FROM users WHERE ${sfield} LIKE '%${q}%'`;
  try {
    const data = await db.run_query(query, null);
    return data;
  } catch (error) {
    console.error('Error in getSearch:', error);
    throw error;
  }
};

export const getByUserId = async (id: number) => {
  const query = "SELECT * FROM users WHERE id = ?";
  try {
    const data = await db.run_query(query, [id]);
    return data;
  } catch (error) {
    console.error('Error in getByUserId:', error);
    throw error;
  }
};

export const add = async (user: any) => {
  const keys = Object.keys(user);
  const values = Object.values(user);
  const key = keys.join(',');
  let parm = '';
  for (let i = 0; i < values.length; i++) { parm += '?,'; }
  parm = parm.slice(0, -1);
  const query = `INSERT INTO users (${key}) VALUES (${parm})`;
  try {
    await db.run_insert(query, values);
    return { status: 201 };
  } catch (error) {
    console.error('Error in add:', error);
    throw error;
  }
};

export const findByUsername = async (username: string) => {
  const query = 'SELECT * FROM users where username = ?';
  try {
    const user = await db.run_query(query, [username]);
    return user;
  } catch (error) {
    console.error('Error in findByUsername:', error);
    throw error;
  }
};

export const update = async (user: any, id: any) => {
  const keys = Object.keys(user);
  const values = Object.values(user);
  let updateString = "";
  for (let i: number = 0; i < values.length; i++) { updateString += keys[i] + "=" + "'" + values[i] + "'" + "," }
  updateString = updateString.slice(0, -1);
  const query = `UPDATE users SET ${updateString} WHERE ID=${id} RETURNING *;`
  try {
    await db.run_query(query, values);
    return { status: 201 };
  } catch (error) {
    console.error('Error in update:', error);
    throw error;
  }
};

export const deleteById = async (id: any) => {
  const query = "DELETE FROM users WHERE ID = ?";
  const values = [id];
  try {
    await db.run_query(query, values);
    return { affectedRows: 1 };
  } catch (error) {
    console.error('Error in deleteById:', error);
    throw error;
  }
};
