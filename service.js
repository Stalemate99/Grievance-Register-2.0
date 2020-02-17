const mongoose = require('mongoose')
const dotenv = require('dotenv')



mongoose.Promise = global.Promise
dotenv.config()
const mongoUri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@greivanceregister-cx4a7.azure.mongodb.net/test?retryWrites=true&w=majority`

mongoose.connect(mongoUri,{useNewUrlParser: true, useUnifiedTopology:true, useCreateIndex: true,},(err)=>{
    if(err){
      return console.log("Sambavam")
    }
    console.log("Successfully connected to Azure!")
})
