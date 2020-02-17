const path = require('path')
const fs = require('fs')
const request = require('request')
const axios = require('axios')
const mongoose = require('mongoose')
const {User , Auth, Complaint } = require('./schema')

let express = require('express')
let bodyParser = require('body-parser')
let multer = require('multer')
let app = express()
let server = app.listen(process.env.PORT||2000,()=>{
    console.log("Server Running on PORT :: "+2000);
})
let io = require('socket.io').listen(server)
let service = require('./service')

app.use(bodyParser.json())

io.on('connection',()=>{
    console.log("Socket Connection :: ON");
})

app.get("/",(req,res)=>{
    res.send("Server Running. Connection Check :: Success")
})

//DATABASE OERATIONS

//Creation of User
function registerDb(name, pno, pass, type){
    
    //Setting Time of registration
    const newUser = new User({name, pno, pass, type, complaints:[]})
    console.log("USER REGISTER? :: ",newUser)
    newUser
        .save()
        .then(() => {
            console.log("Registration success")
            return null
        })
        .catch(err => {
            console.log(err)
        });
    return null
}

//Updation of User
async function updateDb(mail,timestamp,complaint,status){
    let key = new Date().toLocaleDateString()
    console.log("Complaint On :: ",key);
    let updUsr = await User.findOne({mail})
    updUsr.complaints[key] = {
        timestamp,
        complaint,
        status
    };
    let replaceUsr = {}
    replaceUsr.complaints = updUsr.complaints
    console.log("Updated User Id :: ",updUsr._id)
    await User.findOneAndUpdate({"_id":updUsr._id},{ "complaints" : replaceUsr.complaints})
    updUsr.save().then(() => {
            console.log("successful update XD ::  ",updUsr)
            // io.sockets.emit('changeAttendance',updUsr)
            return null
        })
        .catch(err => {
            console.log(err)
        })
}

//APP RELATED

//Registration of user
app.post('/regUser',async (req,res)=>{
    console.log("REGUSER :: BODY :: ",req.body)
    let {name ,pno , pass, type} = req.body
    await registerDb(name, pno, pass, type)
    res.send("Registration Complete.")
})

//Complaint from user
app.post('/complaint',async (req,res)=>{
    console.log("COMPLAINT :: BODY :: ",req.body)
    let {pno, sum, loc} = req.body
    //Preprocessing to determine authority
    //Use Spacey on summary
    //Get Keywords from Flask
    //Compare and determine complaint type and authority
    //Check if Auth Database has that complaint
    //If no
    //Update Databse of User, Complaint and Auth Databases
    res.send({
        status:"new"
    })
    //Else
    /*res.send({
        status:"vote",
        complaintId : _id
    })*/
})

//Vote on existing complaint
app.post('/vote',async (req,res)=>{
    console.log("VOTE :: BODY :: ",req.body)
    let {id} = req.body
    //Update Database of Complaint and Auth 
    //Inform auth via Socket.io
    //After updation
    res.send("Successfully upvoted! Thanks for your contribution!")
})

//Staus of complaint 
app.get('/status',async (req,res)=>{
    console.log("STATUS :: BODY :: ",req.body)
    let {id} = req.body
    //Find the requested complaints status along with pictures
    res.send({
        status:200,
        complaint
    })
})

//Worker Completion Updation
app.post('/complete',async (res,req)=>{
    console.log("COMPLETE :: BODY :: ",req.body)
    let {id, pno} = req.body
    //Find worker via Auth
    //Validate the info using FLask again
    //Update status in Complaint and Auth
    //Send to Users who voted
    res.send({
        status:200
    }) 
})

//WEB INTERFACE OF AUTHORITY

//Register Authority
app.post('/regAuth',async (req,res)=>{
    console.log("REGAUTH :: BODY :: ",req.body)
    let {name, mail, pass, type, loc, }
})

//Add worker

//Assign worker

//Update issues

//FLASK

//To flask 

//From Flask

//UTILITY

//Math function to compute the distance between two locations
function distCalc(lat, long, lat1, long1) { 
    function toRadians(l) {
        return (Math.PI * l) / 180;
    }

    let R = 6371e3;
    let φ1 = toRadians(lat);
    let φ2 = toRadians(lat1);
    let Δφ = toRadians((lat1 - lat));
    let Δλ = toRadians((long1 - long));
    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;

    return d;

}