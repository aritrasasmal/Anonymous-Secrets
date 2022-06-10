require('dotenv').config()
//console.log(process.env) 
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "our little secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));
async function main(){
    await mongoose.connect("mongodb+srv://"+process.env.DB_IDPW+"@cluster0.2zhul.mongodb.net/secretsDB");
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/register", (req, res) =>{
    res.render("register");
});

app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/logout"), (req, res) =>{
    req.logOut((err)=>{
        res.redirect("/");
    });
}

app.get("/secrets", (req, res)=>{
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if(req.isAuthenticated()) res.render("secrets");
    else res.redirect("/");
});

app.post("/register", (req, res) =>{
    User.register({username: req.body.username}, req.body.password, (err, user)=>{
        if (err) console.log(err);
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        };
    });
});

app.post("/login", (req, res)=>{
    passport.authenticate("local")(req,res,function(){
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.logIn(user, (err)=>{
            if(err) console.log(err);
            else    res.redirect("/secrets");
        });
    });
});

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });