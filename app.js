require('dotenv').config()

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreatePlugin = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: process.env.SECRET,
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
    password: String,
    googleId: String
});

const secretSchema = new mongoose.Schema({
    userId: String,
    secret: String
});

const Secret = mongoose.model("Secret", secretSchema);

//userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreatePlugin);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user._id, username: user.username });
    });
  });
  
// passport.deserializeUser(function(id, done) {
//     User.findById(id, function(err, user){
//         done(null, user.id);
//     })
// });
passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log(email.emails[0].value);
    console.log(profile);
    User.findOrCreate({ googleId: profile.id, username: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/auth/google",
  passport.authenticate('google', { scope: ["openid profile email"] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/", (req, res) =>{
    res.render("home");
});

app.get("/register", (req, res) =>{
    res.render("register");
});

app.get("/login", (req, res) =>{
    res.render("login");
});

app.get("/logout", (req, res) =>{
    //console.log(req);
    req.logOut((err)=>{
        if (err) console.log(err);
        res.redirect("/");
    });
});

app.get("/secrets", (req, res)=>{
    // res.set(
    //     'Cache-Control', 
    //     'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    // );
    // if(req.isAuthenticated()) res.render("secrets");
    // else res.redirect("/");
    Secret.find({}, (err, foundSecrets)=>{
        if (err) console.log(err);
        else{
            if(foundSecrets) res.render("secrets", {secrets: foundSecrets});
        }
    })
});

app.get("/submit", (req, res) =>{
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );
    if(req.isAuthenticated()) res.render("submit");
    else res.redirect("/login");
})

app.post("/submit", (req, res) =>{
    const secret = new Secret({
        secret: req.body.secret
    });
    secret.save((err)=>{
        if (!err) res.redirect("/secrets");
    });
})

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