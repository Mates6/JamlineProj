console.log('Bff server is starting...');

import cors from 'cors';
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Basic test route
app.get('/', (req, res) => {
  res.send('Bff is running!');
});


app.get('/api/test', async (req, res) => {
    try{
      const response = await fetch('http://backend:80/test-db');
      const data = await response.json();
      res.json(data);
    }
    catch(err){
      console.error('Error fetching from backend: ', err);
      res.status(500).json({ message: 'Error fetching from backend', error: err });
    }

});

app.get('/api/getGroups', async (req, res) => {

  try{
    const response = await fetch('http://backend:80/getGroups');
    const data = await response.json();
    res.status(200).json(data);
  }
  catch(err){
    console.error('Error fetching from backend: ', err);
    res.status(500).json({ message: 'Error fetching from backend', error: err });
  }

});

// IMPORTANT: listen on 0.0.0.0 so Docker can expose it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT}`);
});
