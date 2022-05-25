const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

main().catch(err => console.log(err));
async function main(){
    await mongoose.connect("mongodb+srv://dba:yT6pUuzFuGWyG0rp@cluster0.2zhul.mongodb.net/secretsDB");
}

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const secret = "thisIsaSecretKey";
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']});

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
        password: req.body.password
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
            if ((foundUser) && foundUser.password === req.body.password)  res.render("secrets");
            else res.send("User not found or password not matching!");
        }
    })
})

app.listen(3000, function() {
    console.log("Server started on port 3000");
  });