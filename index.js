const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.SRTIP_API_SECURE)

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.nz4na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const userCrete = client.db('jerinUserDB').collection('users')
        // users Create 
        app.post('/users/:email', async (req, res)=>{
            const email = req.params.email
            const query = {email}
            const isExist = await userCrete.findOne(query)
            if(isExist){
                return res.send(isExist)
            }
            const newUser = req.body;
            const result = await userCrete.insertOne({
                ...newUser, 
            role : "user"})
            res.send(result)
        })
        // get All Users
        app.get('/users', async (req,res)=>{
            const result = await userCrete.find().toArray()
            res.send(result)
        })
        // Create Payment Intent
app.post('/create-checkout-session', async (req, res) => {
    const { price } = req.body;

    try {
        // Convert price to cents (Stripe uses smallest currency units)
        const amount = price * 100;

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: 'usd',
            payment_method_types: ['card'],
        });

        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).send({ error: 'Failed to create payment intent' });
    }
    });
    // userRole
    app.get('/user/:email', async (req, res)=>{
        const email = req.params.email;
        const query = {email}
        const result = await userCrete.findOne(query)
        res.send({role : result?.role})
    })
//
    }finally{

    }
    console.log("Pinged your deployment. You successfully connected to MongoDB!");


}
run().catch(console.dir);

app.get('/', (req, res)=>{
    res.send('jerin server running')
})

app.listen(port , () =>{
    console.log(`Jerin server running ${port}`)
})