console.log('Backend server is starting...');

import { Pool } from "pg";
import express from "express";

export const pool = new Pool({
  host: "ssnd-db",   // ssnd-db
  port: 5432,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});


//const express = require('express');
const app = express();
const PORT = process.env.PORT || 80;


// Basic test route
app.get('/', (req, res) => {
  res.send('Backend is running!');
});

app.get('/test-db', async (req, res)  => {
  try {
    const result = await pool.query("SELECT * from users");
    res.json(result.rows);
  } catch (err) {
      console.error('Database connection error: ', err);
      res.status(500).json({ 
         message: 'Database connection failed ',
         error: err,
         DB_HOST : process.env.DB_HOST ,
         DB_USER : process.env.DB_USER , 
         DB_PASSWORD : process.env.DB_PASSWORD , 
         DB_NAME : process.env.DB_NAME , 
         PORT : 5432 
        });
  }
});

app.get('/getGroups', async (req, res)  => {
  try{
    const result = await pool.query("SELECT * from groups");
    res.status(200).json(result.rows);
  } catch (err) {
      console.error('Database connection error: ', err);
      res.status(500).json({ message: 'Database connection failed', error: err });
  }

});

app.get('/test', (req, res) => {
  res.json( { a: process.env.DB_HOST, b: process.env.DB_USER, c: process.env.DB_PASSWORD, d: process.env.DB_NAME, e: process.env.PORT});
  console.log('ENV: ', process.env);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT}`);
  console.log('ENV: ', process.env);
});