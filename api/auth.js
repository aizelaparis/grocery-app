import { sql } from './db';
import { saveSession } from './session';

export const registerUser = async ({ firstName, lastName, email, password }) => {
  const existing = await sql`
    SELECT id FROM users WHERE email = ${email}
  `;

  if (existing.length > 0) {
    throw new Error('Email is already registered.');
  }

  const result = await sql`
    INSERT INTO users (first_name, last_name, email, password)
    VALUES (${firstName}, ${lastName}, ${email}, ${password})
    RETURNING id, first_name, last_name, email, created_at
  `;

 const { password: _, ...safeUser } = result[0];
  await saveSession(safeUser);
  return safeUser;
};

export const loginUser = async ({ email, password }) => {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;

  if (result.length === 0) {
    throw new Error('No account found with that email.');
  }

  const user = result[0];

  if (user.password !== password) {
    throw new Error('Incorrect password.');
  }

 const { password: _, ...safeUser } = user;
  await saveSession(safeUser);
  return safeUser;
};