const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//midlewaer    
app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
      res.send('Bitro Boss is Running!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nfkbd0s.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
      serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
      }
});

async function run() {
      try {
            // Connect the client to the server	(optional starting in v4.7)
            // await client.connect();
            // Send a ping to confirm a successful connection
            const menuCollection = client.db('BistroBoss').collection('menu');
            const reviewsCollection = client.db('BistroBoss').collection('reviews');
            const cartsCollection = client.db('BistroBoss').collection('carts');
            const usersCollection = client.db('BistroBoss').collection('users');



            //users apis
            app.post('/users',async(req,res)=>{
                  const user= req.body;
                  const query={email:user.email}
                  const savedUser= await usersCollection.findOne(query);
                  if(savedUser){
                        return res.send({message:'User already added.'})
                  }
                  const result= await usersCollection.insertOne(user);
                  res.send(result)
            })

            //menu api
            app.get('/menu', async (req, res) => {
                  const result = await menuCollection.find().toArray();
                  res.send(result)
            })

            //reviews apis
            app.get('/reviews', async (req, res) => {
                  const result = await reviewsCollection.find().toArray();
                  res.send(result)
            })

            //carts apis
            app.post('/carts', async (req, res) => {
                  const cart = req.body;
                  const result = await cartsCollection.insertOne(cart);
                  res.send(result)
            })

            app.get('/carts', async (req, res) => {
                  const email = req.query.email;
                  if (!email) {
                        res.send([])
                  }
                  else {
                        const query = { email: email };
                        const result = await cartsCollection.find(query).toArray();
                        res.send(result);
                  }

            })

            // delete cart apis 

            app.delete('/carts/:id',async(req,res)=>{
                  const id= req.params.id;
                  const query={_id:new ObjectId(id)};
                  const result = await cartsCollection.deleteOne(query);
                  res.send(result)
            })

            await client.db("admin").command({ ping: 1 });
            console.log("Pinged your deployment. You successfully connected to MongoDB!");
      } finally {
            // Ensures that the client will close when you finish/error
            // await client.close();
      }
}
run().catch(console.dir);


app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
})