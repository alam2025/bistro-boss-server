const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

//midlewaer    
app.use(cors())
app.use(express.json())


// verify jswt 
const verifyJWT = (req, res, next) => {
     
      const authorization = req.headers.authorization;
      // console.log(req.headers);
     
      if (!authorization) {
            return res.status(401).send({ message: 'Unauthorized Access' })
      }
      const token = authorization.split(' ')[1];
      // console.log(token);
      jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
            if(err){
                 return res.status(401).send({error:true, message:'Unauthorized access'})
            }
            req.decoded= decoded;
            next()
      })

     
}



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


            // jwt token generate 
            app.post('/jwt', (req, res) => {
                  const user = req.body;
                  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                  res.send({ token })
            })

            const verifyAdmin=async(req,res,next)=>{
                  const email = req.decoded.email;
                  const query={email:email};
                  const user= await usersCollection.findOne(query);
                  if(user?.role !=='Admin'){
                        return res.status(403).send({error:true, message:'Forbidden access'})
                  }
                  next()

            }


            //users apis
            app.get('/users',verifyJWT,verifyAdmin, async (req, res) => {
                  const result = await usersCollection.find().toArray();
                  // console.log(result);
                  res.send(result)
            })

            app.patch('/users/admin/:id', async (req, res) => {
                  const id = req.params.id;
                  const filter = { _id: new ObjectId(id) };
                  const updateDoc = {
                        $set: {
                              role: `Admin`
                        },
                  };
                  const result = await usersCollection.updateOne(filter, updateDoc);
                  res.send(result)
            })
            
            app.get('/users/admin/:email',verifyJWT,async(req,res)=>{
                  const email= req.params.email;
                  const query = {email : email};
                  if(req.decoded.email !== email){
                         res.send({ admin:false})
                  }
                  const user= await  usersCollection.findOne(query);
                  const result = {admin: user?.role === 'Admin'};
                  console.log(result);
                  res.send(result)
            })

            app.delete('/users/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: new ObjectId(id) };
                  const result = await usersCollection.deleteOne(query);
                  res.send(result)
            })

            app.post('/users', async (req, res) => {
                  const user = req.body;
                  const query = { email: user.email }
                  const savedUser = await usersCollection.findOne(query);
                  if (savedUser) {
                        return res.send({ message: 'User already added.' })
                  }
                  const result = await usersCollection.insertOne(user);
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

            app.get('/carts',verifyJWT,  async (req, res) => {
                  const email = req.query.email;
                 
                 
                  if (!email) {
                        res.send([])
                  }
                  const decodedEmail = req.decoded.email;
                  // const decodedEmail= req.decoded.email;
                  if(decodedEmail !==email){
                        res.status(403).send({ error:true,message:'Forbidden Access'})
                  }

                  const query = { email: email };
                  const result = await cartsCollection.find(query).toArray();
                  res.send(result);


            })

            // delete cart apis 

            app.delete('/carts/:id', async (req, res) => {
                  const id = req.params.id;
                  const query = { _id: new ObjectId(id) };
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