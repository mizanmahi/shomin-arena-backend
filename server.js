const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
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
      const ordersCollection = database.collection('orders');
      const reviewsCollection = database.collection('reviews');
      const userCollection = database.collection('users');

      // APIs

      // GET all products
      app.get('/headphones', async (req, res) => {
         const headphones = await headphoneCollection.find({}).toArray();
         res.json(headphones);
      });

      // GET a product by id
      app.get('/headphones/:id', async (req, res) => {
         const headphone = await headphoneCollection.findOne({
            _id: ObjectId(req.params.id),
         });
         res.json(headphone);
      });

      // POST add a product
      app.post('/headphones', async (req, res) => {
         const { name, price, discountedPrice, description, imageUrl } =
            req.body;
         const headphone = {
            name,
            price,
            discountedPrice,
            description,
            imageUrl,
         };
         const result = await headphoneCollection.insertOne(headphone);
         res.json({
            message: 'Product added successfully',
            headphoneId: result.insertedId,
         });
      });

      // POST save an orders
      app.post('/orders', async (req, res) => {
         const order = req.body;
         const result = await ordersCollection.insertOne(order);
         res.json({
            message: 'Order added successfully',
            orderId: result.insertedId,
         });
      });

      // GET all orders
      app.get('/orders', async (req, res) => {
         const orders = await ordersCollection.find({}).toArray();
         res.json(orders);
      });

      // GET customer specific order
      app.get('/myOrders', async (req, res) => {
         const { email } = req.query;
         const orders = await ordersCollection.find({ email }).toArray();
         console.log(orders);
         res.json(orders);
      });

      // DELETE an order by id
      app.delete('/orders/:id', async (req, res) => {
         const { id } = req.params;
         const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });
         res.json({ message: 'Order deleted successfully', deletedId: id });
      });

      //POST a review
      app.post('/reviews', async (req, res) => {
         const review = req.body;
         const result = await reviewsCollection.insertOne(review);
         res.json({
            message: 'Review added successfully',
            reviewId: result.insertedId,
         });
      });

      // GET all reviews
      app.get('/reviews', async (req, res) => {
         const reviews = await reviewsCollection.find({}).toArray();
         res.json(reviews);
      });

      // POST, save a user info
      app.post('/users', async (req, res) => {
         const user = req.body;
         const { insertedId } = await userCollection.insertOne(user);
         user._id = insertedId;
         res.json(user);
      });

      app.get('/users/:email', async (req, res) => {
         const { email } = req.params;
         console.log(email);
         const user = await userCollection.findOne({ email });
         console.log(user);
         res.json(user);
      });

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
