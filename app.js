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
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require("mongoose-findorcreate");  // for finding in DB for google


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({                 //SAVE USER LOGIN SESSION
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
password:String,
googleId:String,
secret: String
});
userSchema.plugin(passportLocalMogoose);
userSchema.plugin(findOrCreate)  // for google use

  //ecryption key
// userSchema.plugin(ecrypt, { secret: process.env.SECRET, encryptedFields:["password"] });// password ecripted method

const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy()); // taking from passport
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  }); // passport

passport.use(new GoogleStrategy({   // this is for google auth with app
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/", function(req,res){
res.render("home");
});

app.get("/auth/google" ,function(req,res){
passport.authenticate("google", { scope: ["profile"] });  //this is for googl buttom route & scope is what we need from google
});

app.get('/auth/google/secrets',  // callback when google authentication failed or succes
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });

app.get("/login", function(req,res){
    res.render("login");
    });
    
app.get("/register", function(req,res){
        res.render("register");
        });

    
app.get("/secrets", function(req, res){

    User.find({"secret": {$ne: null}}, function(err, foundUser){  // $ne:nul if user secret feeld empty don't pick it then
             if(err){
                 console.log(err)
             }else{
                 if(foundUser){
                     res.render("secrets", {userWithSecrets:foundUser});  // foundUser is secret value in DB
                 }
             }

    });
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
        passport.authenticate("local")(req,res, function(){ //looking for that user in DB if found then logedIN
            res.redirect("/secrets");
        });
    }
})

  });
  
  app.get("/logout", function(req,res){
      req.logout();
      res.redirect("/");
  });

  app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
  });

  app.post("/submit", function(req, res){  // savinf secrets to DB & check if user logd in then save secret in her account other please login first
      const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err,foundUser){
        if(err){
            console.log(err)
        }else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                        res.redirect("/secrets");
                });
            }
        }
    })
  })
                          



app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
  
