require('dotenv').config()
//console.log(process.env) 
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require('crypto-js/md5');

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));
async function main(){
    await mongoose.connect("mongodb+srv://"+process.env.DB_IDPW+"@cluster0.2zhul.mongodb.net/secretsDB");
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/register", (req, res) =>{
    
    res.render("register");
});

app.get("/login", (req, res) =>{
    res.render("login");
});

app.post("/register", (req, res) =>{
    const user = new User({
        username: req.body.username,
        password: md5(req.body.password)
    });
    user.save((err)=>{
        if (err) console.log(err);
        else{
            res.render("secrets");
        }
    });
})

app.post("/login", (req, res)=>{
    User.findOne({username: req.body.username}, (err, foundUser)=>{
        if (err) console.log(err);
        else{
            if ((foundUser) && foundUser.password === md5(req.body.password).toString())  res.render("secrets");
            else res.send("User not found or password not matching!");
        }
    })
})

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });