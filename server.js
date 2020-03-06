const path = require('path')
const fs = require('fs')
const request = require('request')
const axios = require('axios')
const mongoose = require('mongoose')
const {User , Auth, Complaint, Worker } = require('./schema')
mongoose.set('useFindAndModify', false);
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
function registerUser(name, pno, pass){
    const newUser = new User({name, pno, pass, points : 0,complaints:[]})
    console.log("USER REGISTER :: ",newUser)
    newUser
        .save()
        .then(() => {
            console.log("Registration success")
            return null
        })
        .catch(err => {
            console.log("From User Reg :: ",err)
        });
    return null
}

//Sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Creation of Auth
function registerAuth(name, mail, pass, type, loc){
    const newAuth = new Auth({name, mail, pass, type, loc})
    console.log("AUTH REGISTER :: ",newAuth)
    newAuth
        .save()
        .then(() => {
            console.log("Registration success")
            return null
        })
        .catch(err => {
            console.log("From Auth Reg :: ",err)
        });
    return null
}

//Creation of worker
function registerWorker(name,pno,pass,auth){
    const newWorker = new Worker({name, pno, pass, auth})
    console.log("WORKER REGISTER :: ",newWorker)
    newWorker.save().then(()=>{
        console.log("Registeration success.")
        return null
    }).catch(err=>{
        console.log("From Worker Reg :: ",err)
    })
}



//Adding Complaint
async function addComplaint(pno,sum,loc,auth,time){
    let curpath = path.join(__dirname,"/asset/appImage/Complaint.jpg");
    console.log("Complaint From User :: ")
    //Finding User
    let updUser = await User.findOne({pno})
    console.log(updUser);
    //Registering complaint
    console.log("Complaint Auth ID :: ",mongoose.Types.ObjectId(auth));
    let complaint = new Complaint({
        pic : {
        data : fs.readFileSync(curpath),
        contentType : 'image/jpg'
        },
        sum,
        time, 
        loc,
        auth, 
        status:"not taken",
        vote: 1
    })
    complaint.users.push(updUser._id)
    await complaint.save().then(()=>{
        console.log("Added Complaint.")
    }).catch(err=>{
        console.log("Complaint Addition Error :: ",err)
    })
    //Updating Auth complaints
    let updAuth = await Auth.findOne({"_id" : auth})
    let authComplaints = updAuth.complaints||[]
    authComplaints.push(complaint._id)
    await Auth.findOneAndUpdate({"_id":auth},{"complaints":authComplaints})
    await updAuth.save().then(()=>{
        console.log("Auth updated")
    }).catch(err=>{
        console.log("Auth DB updation Error :: ",err)
    })
    //Updating User complaint list
    console.log("After addition",updUser);
    let newComplaintLog = updUser.complaints|| []
    newComplaintLog.push(complaint._id)
    await User.findOneAndUpdate({"_id":updUser._id},{ "complaints" : newComplaintLog})
    await User.findOneAndUpdate({"_id":updUser._id},{ "points" : updUser.points++})
    await updUser.save().then(() => {
            console.log("User DB Updated.")
            return null
        })
        .catch(err => {
            console.log("User Complaint DB Updation :: ",err)
        })
    console.log("Updated User and Complaint :: ",updUser.name)
}


//APP RELATED

//Registration of user
app.post('/regUser',async (req,res)=>{
    console.log("REGUSER :: BODY :: ",req.body)
    let {name ,pno , pass} = req.body
    await registerUser(name, pno, pass)
    res.send("Registration Complete.")
})

//Register Authority
app.post('/regAuth',async (req,res)=>{
    console.log("REGAUTH :: BODY :: ",req.body)
    let {name, mail, pass, type, lat, long} = req.body
    let loc={lat,long}
    await registerAuth(name,mail,pass,type,loc)
    res.send("Authority has been registered successfully.")
})

//Register Worker
app.post('/regWorker',async (req,res)=>{
    console.log("REGISTER WORKER :: ",req.body)
    let {name, pno, pass} = req.body
    // await registerWorker(name, pno, pass, auth)
    const newWorker = await new Worker({name,pno,pass,status:"free"})
    newWorker.save().then(()=>{
        console.log("Worker successfully added!");
    }).catch(err=>{
        console.log("Registeration Worker Error :: ",err);
    })
    res.send({
        status: "deprecated/using route"
    })
})

//Validation of user/worker/auth
app.get('/login',async (req,res)=>{
    console.log(req.query)
    let {pno, pass} = req.query
    let obj = await User.find({pno})
    console.log(obj);
    let isUser =  obj[0]
    console.log(isUser.name);
    if(isUser){
        if(pass === isUser.pass){
            let comarr = isUser.complaints
            let obj = {
                type : "citizen",
                complaint : comarr,
                points : isUser.points,
                name : isUser.name
            }
            console.log("In user response ",obj);
            res.send(obj)
        }
        else    
            res.send("Wrong Password.")
    }
    console.log("After user check :: ",isUser)
    obj = await Worker.find({pno})
    isUser = obj[0]
    if(isUser){
        if(pass === isUser.pass){
            res.send({
                type:"worker",
                complaint: isUser.complaint,
                name : isUser.name
            })
        }
        else{
            res.send("Wrong Password.")
        }
    }
    console.log("After Worker check :: ",isUser)
    obj = await Auth.findOne({mail})
    if(obj){
        if(pass === obj.pass){
            res.send({
                name: obj.name,
                type: obj.type,
                workers : obj.workers,
                complaints : obj.complaints
            })
        }else{
            res.send("Wrong Password!")
        }
    }else{
        res.send("Invalid Data.")
    }
})

//Complaint from user

//Location Check Complaint 
//NEEDS SOME WORK! LAT LONG NOT MATCHING....
async function checkComplaint(loc){
    let complaints = await Complaint.findOne({"lat":loc.lat,"long":loc.lang})
    let newComplaints = []
    console.log(complaints);
    await complaints.forEach(c=>{
        console.log(distCalc(c.loc.lat,c.loc.long,loc.lat,loc.long))
        if(distCalc(c.loc.lat,c.loc.long,loc.lat,loc.long)<=10){
            newComplaints.push(c._id)
        }
    })
    console.log("Location complaint :: ",newComplaints);
    return newComplaints
}

//Sending Local list of complaints
app.get('/complaint/loc', async (req,res)=>{
    console.log("COMPLAINT LIST :: ",req.query)
    let {lat,long} = req.query
    let result = await checkComplaint({lat,long})
    res.send({
        status:200,
        result
    })
})

//Getting Image via multer
const upload_image = multer.diskStorage({
    destination:(req, file, cb)=>{
        cb(null, "asset/appImage")
    },
    filename:(req, file, cb)=>{
        cb(null, "Complaint.jpg")
    }
})

const uploadImage = multer({
    storage:upload_image,
})

app.post('/complaint/user',uploadImage.single("image"),async (req,res)=>{
    console.log("COMPLAINT :: BODY :: ",req.body,"/n New Stuff",req)
    let curpath = path.join(__dirname,"/asset/appImage/Complaint.jpg");
    let {pno, sum, lat, long, time} = req.body
    let loc ={lat,long}
    //To be sent to flask
    let formData = {
        sum : sum,
        complaint_pic: fs.createReadStream(curpath)
    }
    // Flask handling
        // request.post({
        //     url: 'http://192.168.43.128:5000/findFace',
        //     formData: formData
        //  }, function optionalCallback(err, httpResponse, body) {
        // if (err) {
        //     return console.error('upload failed:', err);
        // }
    //Preprocessing to determine authority
    let text = "open manholes"
    let authType = ""
    if(text === "open manholes")
        authType = "Road"
    else if(text === "patchy roads")
        authType = "PWD"
    else if(text === "overflowing sewers")
        authType = "CMWSSB"
    else if(text === "overflowing garbage")
        authType = "SWM"
    else
         res.send({
             status: 400,
             message:"Complaint not identified"
         })
    //FUTURE PLAN :: MAKE IT SO THAT THEY CAN CONFIRM THE AUTHORITY...     
    console.log("Required Auth Type :: ",authType);
    let posAuths = await Auth.find({"type":authType})
    console.log("In get auth :: ",posAuths);
    let minDistance = {
        dist : 100000,
        authid : null
    }
    console.log(loc);
    posAuths.forEach( auth => {
        console.log("In for Each");
        let distance = distCalc(loc.lat, loc.long, auth.loc.lat, auth.loc.long)
        console.log("Distance",distance);
        if (minDistance.dist >= distance) {
            minDistance = {
                dist : distance,
                authid: auth._id
            }
        }
    })
    await sleep(2000)
    let reqAuth = minDistance.authid
    console.log("Distance Method : ",minDistance.authid);
    console.log("Required Auth :: ",reqAuth);
    await addComplaint(pno,sum,loc,reqAuth,time) 
    //increse user points
    res.send({
        status:200,
        message:"Complaint Registered."
    })
})

//Vote on existing complaint
app.post('/vote',async (req,res)=>{
    console.log("VOTE :: BODY :: ",req.body)
    let {id} = req.body
    //Update Database of Complaint and Auth 
    let complaint = await Complaint.findOne({_id:id})
    complaint.vote++
    let {lat,long} = complaint.loc
    complaint.save().then(()=>{
        console.log("Increased vote in complaint DB")
    }).catch(err=>{
        console.log("Error in Complaint Vote Increase :: ",err)
    })
    //Inform auth via Socket.io
    io.emit("Vote",id)
    //After updation
    res.send({
        status:200,
        votes:complaint.vote
    })
})

//Get complaints using phone-number
app.get('/complaint',async (req,res)=>{
    console.log("MY COMPLAINTS :: ",req.body)
    let {pno} = req.body
    let result = await User.findOne({pno})
    let comarr = result.complaints
    let coms= []
    comarr.forEach(async com => {
        let comp = await Complaint.find({_id:com})
        comp = comp[0]
        coms.push({
            sum: comp.sum,
            type : comp.typeOf,
            time : comp.time,
            vote : comp.vote,
            status : comp.status
        })
    })
    let obj = {
        type : "citizen",
        complaint : coms,
        points : result.points,
        name : result.name
    }
    res.send({
        status:200,
        result: obj
    })
})

//Staus of complaint 
app.get('/status',async (req,res)=>{
    console.log("STATUS :: BODY :: ",req.query)
    let {id} = req.query
    let complaint = await Complaint.findOne({_id:id})
    let type = ""
    if(complaint.sum.includes("manhole")||complaint.sum.includes("Manhole"))
        type = "Road"
    else if(complaint.sum.includes("garbage")||complaint.sum.includes("Garbage"))
        type="SWM"
    else if(complaint.sum.includes("patchy")||complaint.sum.includes("Patchy")||complaint.sum.includes("roads")||complaint.sum.includes("Roads"))
        type="PWD"
    let obj = {
        sum : complaint.sum,
        type,
        time : "22/02/2020",
        vote : complaint.vote,
        status : complaint.status
    }
    console.log("STATUS CONGIF ::: ",obj);
    res.send({
        status:200,
        result : obj
    })
})



//Worker Completion Updation
app.post('/complete',async (res,req)=>{
    console.log("COMPLETE :: BODY :: ",req.body)
    let {pno} = req.body
    //Find worker via Auth
    //Validate the info using FLask again
    //Update status in Complaint and Auth
    //Send to Users who voted
    res.send({
        status:200
    }) 
})

//getComplaint

//WEB INTERFACE OF AUTHORITY



//Add worker to auth
app.post('/setWorker',async (req,res)=>{
    console.log(req.body)
    let {mail,pno} = req.body
    let auth = await Auth.find({mail})
    auth = auth[0]
    console.log(auth);
    let worker = await Worker.find({pno})
    worker = worker[0]
    console.log(worker);
    worker.auth = auth._id
    console.log("After exchange :: ",auth.workers,worker);
    let curWork = auth.workers
    console.log(curWork);
    curWork.push(worker._id)
    auth.workers = curWork
    await worker.save().then(()=>{
        console.log("Success fully added worker to auth.");
    }).catch(err=>{
        console.log("Error whilist adding worker's auth :: ",err);
    })
    await auth.save().then(()=>{
        console.log("Success fully added worker to auth.");
    }).catch(err=>{
        console.log("Error whilist adding auth's worker :: ",err);
    })
    res.send("SUCCESS")
})

//Assign worker
//Unique ID
onlyUnique = (value,index,self)=>{
    return self.indexOf(value) === index
}

//Update issues
app.get('/authcomp',async (req,res)=>{
    console.log("Auth Complaint Give :: ",req.query)
    let {mail} = req.query
    let auth = await Auth.findOne({mail})
    console.log("Auth ::: ",auth.complaints);
    let newauthcom = auth.complaints.filter(onlyUnique)
    let obj = []
    console.log("New ayth comps :: ",newauthcom);
    newauthcom.forEach(async c=>{
        let co = await Complaint.findOne({"_id":c})
        console.log(co.sum);
        obj.push({
            sum : co.sum,
            vote : co.vote
        })
        console.log("object : ",obj.length);
    })

    res.send({
        status:200,
        result:obj
    })  
})
//FLASK

//To flask 

//From Flask

//UTILITY

//getAuthType
function getAuthType(text){
    if(text === "open manholes")
        return "Road"
    else if(text === "patchy roads")
        return "PWD"
    else if(text === "overflowing sewers")
        return "CMWSSB"
    else if(text === "overflowing garbage")
        return "SWM"
    else
        return "Invalid"
}

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

async function GetAuth(type,loc){
    //Getting Authority in respective type
    let posAuths = await Auth.find({type})
    console.log("In get auth :: ",posAuths);
    let minDistance = {
        dist : 1000,
        authid : ""
    }
    posAuths.forEach(auth=>{
        let distance = distCalc(loc.lat,loc.long,auth.loc.lat,auth.loc.long)
        if (minDistance.dist >= distance){
            minDistance = {
                dist,
                authid : auth._id.toString()
            }
        }
        console.log("Distance Method : ",minDistance.authid);
        return minDistance.authid
    })
}