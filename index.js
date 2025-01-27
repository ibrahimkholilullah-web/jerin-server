const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: axios } = require('axios')
const stripe = require('stripe')(process.env.SRTIP_API_SECURE)

app.use(cors())
app.use(express.json())
app.use(express.urlencoded())
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.nz4na.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
// Store ID: jerin6796586092aa6
// Store Password (API/Secret Key): jerin6796586092aa6@ssl


// Merchant Panel URL: https://sandbox.sslcommerz.com/manage/ (Credential as you inputted in the time of registration)


 
// Store name: testjerin9jet
// Registered URL: www.jerinparlour.com
// Session API to generate transaction: https://sandbox.sslcommerz.com/gwprocess/v3/api.php
// Validation API: https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?wsdl
// Validation API (Web Service) name: https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
 
// You may check our plugins available for multiple carts and libraries: https://github.com/sslcommerz
async function run() {
    try {
        const userCrete = client.db('jerinUserDB').collection('users')
        const paymentCollition = client.db('jerinUserDB').collection('payment')
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
    // payment Info 
    app.post('/create-payment-success', async (req, res)=>{
        const payment = req.body
        const trxId = new ObjectId().toString()
        const initiate = {
            store_id : "jerin6796586092aa6",
            store_passwd: 'jerin6796586092aa6@ssl',
                total_amount: payment.price,
                currency: 'BDT',
                tran_id: trxId, // use unique tran_id for each api call
                success_url: 'http://localhost:5000/success-payment',
                fail_url: 'http://localhost:5173/fail',
                cancel_url: 'http://localhost:5173/cancel',
                ipn_url: 'http://localhost:5000/ipn-success-payment',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: `${payment.name}`,
                cus_email: `${payment.email}`,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            
        }
        const inResponsive = await axios({
            url : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
            method : "POST",
            data : initiate,
            headers : {
                "content-type" : "application/x-www-form-urlencoded"
            }
        })
        payment.tran_id =trxId
        const saveData = await paymentCollition.insertOne(payment)
        const GatewayURL = inResponsive?.data?.GatewayPageURL
        
        res.send({GatewayURL})

    })
    app.post('/success-payment', async (req, res)=>{
        const paymentInfo = req.body;
        const {data} = await axios.get(`https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${paymentInfo.val_id}&store_id=jerin6796586092aa6&store_passwd=jerin6796586092aa6@ssl`)
        if(data.status !== "VALID"){
            return res.send({message :"Unvalid Payment"})
        }
        const updatePaymet = await paymentCollition.updateOne({tran_id : data.tran_id},{
            $set : {
                status : "Success"
            }
        })
        console.log(updatePaymet)
    })
    app.get('/payment', async (req, res)=>{
        const result = await paymentCollition.find().toArray()
        res.send(result)
    })
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