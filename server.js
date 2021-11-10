const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
// const admin = require('firebase-admin');
const dotenv = require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000; // important for deploy

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@phero-crud.9f5td.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

const main = async () => {
   try {
      // Connect the client to the server
      await client.connect();
      console.log('Connected successfully to Mongo');

      const database = client.db('shomin-arena');
      const headphoneCollection = database.collection('headphones');

    // APIs
    





   } catch (err) {
      console.error(err);
   } finally {
      //   await client.close();
   }
};

main().catch((err) => console.dir);

app.get('/', (req, res) => {
   res.send('Hello From Shomin Arena 🎧');
});

app.listen(port, () => {
   console.log(`Shomin Arena's Server listening at http://localhost:${port}`);
});
