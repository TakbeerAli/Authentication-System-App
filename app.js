require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require('mongoose');
// const ecrypt = require("mongoose-encryption"); // encryting password
// const md5 = require("md5");
// const bcrypt = require("bcrypt"); // adding bcrypt for ecrypting code with salt method
// const saltRounds = 10;  // rounds of salt   10 
const session = require("express-session");
const passport = require("passport");
const passportLocalMogoose = require("passport-local-mongoose");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret:"Our little secret.",
    resave: false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true); // when error came in server starting some DB issue


const userSchema = new mongoose.Schema ({ //ecrypted Schema method
email: String,
password:String
});
userSchema.plugin(passportLocalMogoose);

  //ecryption key
// userSchema.plugin(ecrypt, { secret: process.env.SECRET, encryptedFields:["password"] });// password ecripted method

const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy()); // taking from passport
passport.serializeUser(User.serializeUser()); // passport
passport.deserializeUser(User.deserializeUser()); // passport


app.get("/", function(req,res){
res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
    });
    
app.get("/register", function(req,res){
        res.render("register");
        });

    
app.get("/secrets", function(req, res){

    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

  app.post("/register", function(req,res){
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) { //ecrypting password by bcrypt method
    //     const NewUser = new User({
    //         email:req.body.username,
    //         password:hash 
    //     });

    //     NewUser.save(function(err){
    //         if(err){
    //             console.log(err)
    //         }else{
    //             res.render("secrets");
    //         }
    //     });
    // });
    User.register({username:req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");s
            });
        }
    });
      
        
            });

 app.post("/login", function(req,res){
//    const username = req.body.username;
//     const  password = req.body.password;

//     User.findOne({email:username}, function(err, foundUser){

//         if(err){
//             console.log(err)
//         }else{
//             if(foundUser){
//                 bcrypt.compare(password, foundUser.password, function(err, result) { // checking password in DB
//                    if(result === true){
//                     res.render("secrets");
//                    }
//                 });
                    
                
//             }
//         }
//     })
const user = new User({
    username: req.body.username,
    passport : req.body.passport
});

req.login(user, function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
        });
    }
})

  });
  
  app.get("/logout", function(req,res){
      req.logout();
      res.redirect("/");
  });
                          



app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
  
