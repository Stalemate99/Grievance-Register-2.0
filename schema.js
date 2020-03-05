const mongoose = require('mongoose')
const Schema = mongoose.Schema

const complaintSchema = new Schema({
    pic : { data: Buffer, contentType: String },
    sum : String,
    time : {
        type:String
    },
    loc : {
        lat : Number,
        long : Number
    },
    typeOf:{
        type:String,
        enum:["overflowing sewers","patchy roads","overflowing garbage","open manholes"]
    },
    auth : Schema.Types.ObjectId,
    worker : Schema.Types.ObjectId,
    users : [Schema.Types.ObjectId],
    status : {
        type:String,
        enum:["not taken","in progress","completed"]
    },
    vote : {
        type:Number,
        default: 0
    }
})

const Complaint = mongoose.model('Complaint', complaintSchema)

const userSchema = new Schema({
    name : {
        type: String,
        unique : true
    },
    pno : {
        type:String,
        unique:true
    },
    pass : {
        type:String,
        required : true,
        unique: true
    },
    points:{
        type:Number,
        required:true
    },
    complaints : [Schema.Types.ObjectId]
})

const User = mongoose.model('User',userSchema)

//Worker Schema 

const workerSchema = new Schema({
    name: {
        type:String,
        required:true
    },
    pno:{
        type:String,
        unique:true
    },
    pass:{
        type:String,
        required:true
    },
    complaint: Schema.Types.ObjectId,
    auth : Schema.Types.ObjectId,
    status : {
        type:String,
        enum:["working","free"]
    }
})

const Worker = mongoose.model("Worker",workerSchema)

const authSchema = new Schema({
    name : {
        type:String,
        required:true,
        unique:true
    },
    mail : {
        type:String,
        required:true,
        unique:true
    },
    pass : {
        type:String,
        required:true,
        unique:true
    },
    type : {
        type:String,
        enum:["CMWSSB","SWM","PWD","Road"]
    },
    loc : {
        lat : Number,
        long : Number
    },
    workers : [Schema.Types.ObjectId],
    complaints : [Schema.Types.ObjectId]
})

const Auth = mongoose.model('Auth',authSchema)

module.exports = {
    User : User,
    Auth : Auth,
    Complaint : Complaint,
    Worker : Worker
}