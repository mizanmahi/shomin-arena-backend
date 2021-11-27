const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const admin = require('firebase-admin');
const { default: axios } = require('axios');
const dotenv = require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const fileUpload = require('express-fileupload');

admin.initializeApp({
   credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACC_SDK)
   ),
});

const app = express();
const port = process.env.PORT || 5000; // important for deploy

// middleware
app.use(cors());
app.use(express.json({limit: 2000000}));
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@phero-crud.9f5td.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
});

//@ token verifying middleware
const verifyToken = async (req, res, next) => {
   if (
      req.headers?.authorization &&
      req.headers?.authorization?.startsWith('Bearer ')
   ) {
      const idToken = req.headers.authorization.split('Bearer ')[1];
      try {
         const decodedIdToken = await admin.auth().verifyIdToken(idToken);
         req.decodedEmail = decodedIdToken.email;
         return next();
      } catch (error) {
         console.log('Error while verifying Firebase ID token:', error.message);
         return res.status(403).json({ message: error.message });
      }
   } else {
      console.log(
         'No Firebase ID token was passed as a Bearer token in the Authorization header.'
      );
      return res.status(403).json({ message: 'Unauthorized' });
   }
};

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
      const newsletterEmailCollection = database.collection('newsletterEmail');

      // APIs

      // GET all products
      app.get('/headphones', async (req, res) => {
         const headphones = await headphoneCollection.find({}).toArray();
         res.json(headphones);
      });

      // GET a headphone by id
      app.get('/headphones/:id', async (req, res) => {
         const headphone = await headphoneCollection.findOne({
            _id: ObjectId(req.params.id),
         });
         res.json(headphone);
      });

      // POST add a headphone
      app.post('/headphones', async (req, res) => {
         // console.log('body',req.body); this will hold the all other data without files
         // console.log('file',req.files); this will hold the file comes with the form data
         console.log('sdjfsdk');
         const image = req.files.image;
         const imageData = image?.data;
         const encodedImage = imageData.toString('base64');
         const imageBuffer = Buffer.from(encodedImage, 'base64');

         const headphone = {...req.body, imageUrl: imageBuffer}
         const result = await headphoneCollection.insertOne(headphone);
         res.json({
            message: 'Product added successfully',
            headphoneId: result.insertedId,
         });
      });

      // DELETE delete a headphone by id
      app.delete('/headphones/:id', async (req, res) => {
         const result = await headphoneCollection.deleteOne({
            _id: ObjectId(req.params.id),
         });
         res.json(result);
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
         res.json(orders);
      });

      // DELETE an order by id
      app.delete('/orders/:id', async (req, res) => {
         const { id } = req.params;
         const result = await ordersCollection.deleteOne({ _id: ObjectId(id) });
         res.json({ message: 'Order deleted successfully', deletedId: id });
      });

      // PUT update order status
      app.put('/orders/:id', async (req, res) => {
         const { id } = req.params;
         const result = await ordersCollection.updateOne(
            { _id: ObjectId(id) },
            { $set: { status: 'shipped' } }
         );
         res.json(result);
      });

      app.get('/orders/:id', async (req, res) => {
         const result = await ordersCollection.findOne({
            _id: ObjectId(req.params.id),
         });
         res.json(result);
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
         const user = await userCollection.findOne({ email });
         res.json(user);
      });

      app.put('/users/admin', verifyToken, async (req, res) => {
         const { email } = req.body;
         const { decodedEmail } = req;

         if (decodedEmail) {
            const requester = await userCollection.findOne({
               email: decodedEmail,
            });
            if (requester.role === 'admin') {
               const result = await userCollection.updateOne(
                  { email },
                  { $set: { role: 'admin' } }
               );
               res.json(result);
            } else {
               res.status(403).json({
                  message: 'You are not allowed to make admin',
               });
            }
         }
      });

      app.post('/create-payment-intent', async (req, res) => {
         const paymentInfo = req.body;
         const amount = parseInt(paymentInfo.price) * 100;
         console.log(amount);

         // Create a PaymentIntent with the order amount and currency
         const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
         });

         res.json({
            clientSecret: paymentIntent.client_secret,
         });
      });

      app.post('/newsletterEmail', async (req, res) => {
         const {newsletterEmail} = req.body;
         console.log(`Received newsletter email: ${newsletterEmail}`);
         const result = await newsletterEmailCollection.insertOne({newsletterEmail}, {upsert: true});
         res.json(result);
      })

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
