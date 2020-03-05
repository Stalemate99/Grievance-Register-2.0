// const path = require('path')
const fs = require('fs')
const path  = require('path')
const request = require('request')
// const axios = require('axios')
// const mongoose = require('mongoose')
// const {User , Auth, Complaint, Worker } = require('./schema')
// mongoose.set('useFindAndModify', false);
// let express = require('express')
// let bodyParser = require('body-parser')
// let multer = require('multer')
// let app = express()

// app.use(bodyParser.json())

// app.get("/",(req,res)=>{
//     res.send("Server Running. Connection Check :: Success")
// })

let curpath = path.join(__dirname,"/asset/appImage/Complaint.jpg");
let formData = {
    // sum : sum,
    image: fs.createReadStream(curpath)
}
request.post({
    url: 'http://192.168.43.189:5000/predict',
    formData: formData
 }, function optionalCallback(err, httpResponse, body) {
if (err) {
    return console.error('upload failed:', err);
}
console.log('Upload successful!  Server responded with:', body);
return body
})
// request.post({
//             url: 'http://192.168.43.189:5000/predict',
//             formData: formData
//          }, function optionalCallback(err, httpResponse, body) {
//         if (err) {
//             return console.error('upload failed:', err);
//         }
//         console.log('Upload successful!  Server responded with:', body);
//         return body
//     })