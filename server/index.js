require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const nodemailer = require("nodemailer");


const port = process.env.PORT || 9000
const app = express()
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(cors(corsOptions))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}

// Nodemailer setup Go browser and search the web site name: NODEMailer

const sendEmail = (emailAddress, emailData) => {
  // create transporter
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",   //go browser and search: gmail smtp server address
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.NODE_MAILER_USER,
      pass: process.env.NODE_MAILER_PASS,
    },
  });
  //verify connection

  transporter.verify((error, success) => {
    if (error) {
      console.log(error)
    } else {
      console.log('transporter is ready to email ', success)
    }
  })
  // transporter.sendMail()
  const mailBody = {
    from: process.env.NODE_MAILER_USER, // sender address
    to: emailAddress, // list of receivers
    subject: emailData?.subject, // Subject line
    // text: emailData?.massage, // plain text body
    html: `<p>${emailData?.massage}</p>`, // html body
  }
  transporter.sendMail(mailBody, (error, info) => {
    if (error) {
      console.log(error)
    } else {
      // console.log(info)
      console.log(" Mail send" + info?.response)
    }
  })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.crgmj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  try {

    // Collection 
    const userCollection = client.db("plantNetDB").collection("users");
    const plantCollection = client.db("plantNetDB").collection("plants");
    const orderCollection = client.db("plantNetDB").collection("orders");


    // verify admin middleware

    const verifyAdmin = async (req, res, next) => {
      // console.log("data from verifyToken middleware", req.user)
      const email = req.user?.email
      const query = { email }
      const result = await userCollection.findOne(query)
      if (!result || result.role !== 'admin') {
        return res.status(403).send({ massage: "Forbidden Access!, Admin only action" })
      }
      next()

    }

    // verify seller middleware

    const verifySeller = async (req, res, next) => {
      // console.log("data from verifyToken middleware", req.user)
      const email = req.user?.email
      const query = { email }
      const result = await userCollection.findOne(query)
      if (!result || result.role !== 'seller') {
        return res.status(403).send({ massage: "Forbidden Access!, Seller only action" })
      }
      next()

    }

    // user api 

    app.post("/user/:email", async (req, res) => {
      sendEmail()
      const email = req.params.email
      const user = req.body
      const query = { email }
      const isExist = await userCollection.findOne(query)
      if (isExist) {
        return res.send(isExist)
      }
      console.log(user)
      const result = await userCollection.insertOne({
        ...user,
        role: "customer",
        timeStamp: Date.now()
      })
      res.send(result)
    })

    app.get("/all-users/:email", verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email
      const query = { email: { $ne: email } }
      const result = await userCollection.find(query).toArray()
      res.send(result)
    })

    // manage user role 

    app.patch('/user/role/:email', verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email
      const filter = { email }
      const { role } = req.body
      const updateDoc = {
        $set: {
          role, status: 'verified'
        },
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    // role base api 

    app.get('/user/role/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      const result = await userCollection.findOne({ email })
      res.send({ role: result?.role })
    }
    )
    // manage status and role

    app.patch("/user/:email", verifyToken, async (req, res) => {
      const email = req.params.email
      const query = { email }
      const user = await userCollection.findOne(query)
      const { status } = req.body
      if (!user || user.status === "requested") {
        return res.status(400).send({ massage: "You have already requested , wait for some time" })
      }

      const updateDoc = {
        $set: {
          status: "requested"
        }
      }

      const result = await userCollection.updateOne(query, updateDoc)
      res.send(result)
    })

    // Generate jwt token
    app.post('/jwt', async (req, res) => {
      const email = req.body
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })
    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // plant related Api

    //get plant for seller my-inventory

    app.get('/plants/seller', verifyToken, verifySeller, async (req, res) => {
      const email = req.user?.email
      const query = { 'seller.email': email }
      const result = await plantCollection.find(query).toArray()
      res.send(result)
    })
    app.delete('/plants/:id', verifyToken, verifySeller, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await plantCollection.deleteOne(query)
      res.send(result)
    })
    app.get("/plants", async (req, res) => {
      const result = await plantCollection.find().toArray()
      res.send(result)
    })
    app.post("/plants", verifyToken, verifySeller, async (req, res) => {
      const plant = req.body
      const result = await plantCollection.insertOne(plant)
      res.send(result)
    })

    app.get("/plants/:id", async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await plantCollection.findOne(query)
      res.send(result)
    })

    //aggregate part

    // save to order data
    app.get("/customer-orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email

      const query = { "customer.email": email }
      const result = await orderCollection.aggregate(
        [
          // match specific customers data only by email
          {
            $match: query
          },
          // convert plantId string to ObjectId
          {
            $addFields: {
              plantId: { $toObjectId: "$plantId" }

            },
          },
          // go to different collection and look for data
          {
            $lookup: {
              from: 'plants',  //collection name
              localField: 'plantId', //local data that you want to match
              foreignField: '_id', //foreign field nome of the same data 
              as: 'plants' //return the data as array 

            }
          },
          {
            $unwind: '$plants' //unwind lookup data return without array 
          },
          {
            $addFields: {    //add those field in object
              name: '$plants.name',
              image: '$plants.image',
              category: '$plants.category'
            }
          },
          {
            $project: { //remove object property form order object  
              plants: 0
            }
          }
        ]
      ).toArray()
      res.send(result)
    })

    //gat all order for specific seller

    app.get("/seller-order/:email", verifyToken, verifySeller, async (req, res) => {
      const email = req.params.email
      const query = { seller: email }
      const result = await orderCollection.aggregate([
        {
          $match: query
        },
        {
          $addFields: {
            plantId: { $toObjectId: '$plantId' }
          }
        },
        {
          $lookup: {
            from: "plants",
            localField: "plantId",
            foreignField: "_id",
            as: "plants"
          }
        },
        {
          $unwind: "$plants"
        },
        {
          $addFields: {
            name: "$plants.name"
          }
        },
        {
          $project: {
            plants: 0
          }
        }

      ]).toArray()

      res.send(result)
    })

    // admin state api

    app.get('/admin-state', verifyToken, verifyAdmin, async (req, res) => {
      // const email= req.params.email
      // const query= {email}

      // get total user and plant
      const totalPlants = await plantCollection.estimatedDocumentCount()
      const totalUsers = await userCollection.estimatedDocumentCount()
      const orderDetails = await orderCollection.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            totalOrder: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
          }
        }
      ]).next()
      console.log(orderDetails)


      // generate chart data
      //       const mydata ={
      //       date:10/12/24,
      //       quantity: 4000,
      //       price: 2400,
      //       order: 2400
      // }

      const chartData= await orderCollection.aggregate([
        {
          $sort: {_id:-1}
        },
        {
          $addFields: {
            _id:{
              $dateToString:{
                format:'%Y-%m-%d',
                date:{
                  $toDate:'$_id'

                }
              }
            },
            quantity:{
              $sum:'$quantity'
            },
            price:{
              $sum:'$price'
            },
            order:{
              $sum:1
            }

          }
        },
        {
          $project:{
            _id:0,
            date:'$_id',
            quantity:1,
            price:1,
            order:1,
          }
        }
      ]).toArray()
      res.send({ totalPlants, totalUsers, orderDetails, chartData})
    })


    // update oder status

    app.patch("/orders/:id", verifyToken, verifySeller, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const { status } = req.body
      const updateDoc = {
        $set: {
          status
        }
      }
      const result = await orderCollection.updateOne(query, updateDoc)
      res.send(result)


    })

    // save order in db
    app.post("/orders", verifyToken, async (req, res) => {
      const order = req.body
      console.log(order)
      const result = await orderCollection.insertOne(order)

      //  send mail

      if (result?.insertedId) {
        // send mail to the customer
        sendEmail(order?.customer?.email, {
          subject: "Order Successful!",
          massage: ` You've place an order successfully , Transaction Id:${result?.insertedId}`
        })

        //send mail to the seller
        sendEmail(order?.seller, {
          subject: "Harry!, You have an order to process",
          massage: ` Get the plants ready for :${order?.customer?.name}`
        })
      }


      res.send(result)
    })

    app.patch('/order/quantity/:id', verifyToken, async (req, res) => {
      const id = req.params.id
      const { quantityToUpdate, status } = req.body
      const filter = { _id: new ObjectId(id) }
      let updateDoc = {
        $inc: {
          quantity: -quantityToUpdate
        }
      }
      if (status === 'increase') {
        updateDoc = {
          $inc: {
            quantity: quantityToUpdate
          }
        }
      }
      const result = await plantCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.delete("/order/:id", verifyToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const order = await orderCollection.findOne(query)
      if (order.status === 'delivered') {
        return res.status(409).send({ massage: "Cannot cancel once the product is delivered" })
      }
      const result = await orderCollection.deleteOne(query)
      res.send(result)
    })

    // create payment intent
    app.post('/create-payment-intent', verifyToken , async(req, res)=>{
      const {quantity, plantId}=req.body
      const query= {_id: new ObjectId(plantId)}
      const plant = await plantCollection.findOne(query)
      if(!plant){
        return res.status(400).send({massage:"Plant Not Found"})
      } 
      const totalPrice = (plant?.price * quantity)*100 //total price must be cent (poysa)
     if(totalPrice>0){
      const {client_secret} = await stripe.paymentIntents.create({
        amount: totalPrice,
        currency: 'usd',
      });
      res.send({clientSecret:client_secret})
     }
     
    })


    // Send a ping to confirm a successful connection
    await client.db('admin').command({ ping: 1 })
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    )
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from plantNet Server..')
})

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`)
})
