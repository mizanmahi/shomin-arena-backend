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


app.get('/', (req, res) => {
    res.send('Hello From Shomin Arena 🎧');
 });
 
 app.listen(port, () => {
    console.log(`Shomin Arena's Server listening at http://localhost:${port}`);
 });
 