const express = require("express");
const router = express.Router();
var connection = require("../lib/db");

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
let dotenv = require("dotenv").config();

// Configure the Google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.Client_key,
      clientSecret: process.env.SecretKey,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Handle the user authentication and store the user's details as needed
      // You can access user details via the 'profile' object
      // Call 'done' to complete the authentication process

      done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialization: retrieve user information from the session
passport.deserializeUser((id, done) => {
  // Replace this with your own code to retrieve the user from the database or any other storage
  const user = findUserById(id);

  if (user) {
    done(null, user);
  } else {
    done(new Error("User not found"));
  }
});

// Route for initiating the authentication process
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Callback route for handling the response from Google
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/users" }),
  (req, res) => {
    // Successful authentication, redirect or perform additional actions as needed

    const profile = req.user;

    var userId = profile.id;
    var userName = profile.displayName;
    var emailarr = profile.emails;
    var photoarr = profile.photos;

    const emailuser = emailarr[0].value;
    const photoUser = photoarr[0].value;

    // Your logic here for create signinup connection

    const query = "SELECT * FROM users WHERE email = ?";

    connection.query(query, [emailuser], (err, rows, fields) => {
      if (err) throw err;

      // if user not found
      if (rows.length <= 0) {
        //if user not register
        var form_data = {
          name: userName,
          email: emailuser,
          password: "",
        };

        connection.query(
          "INSERT INTO users SET ?",
          form_data,
          function (err, result) {
            //if(err) throw err
            if (err) {
              req.flash("error", err);
              console.log(err);
            } else {
              // Store the user ID in the session
              req.session.userId = userId;
              req.session.email = emailuser;
              req.session.name = userName;
              req.session.loggedin = true;
              req.flash("success", "Welcome " + userName + "!");
              res.redirect("/users/home");
            }
          }
        );
      } else {
        //if user aready rester

        // Store the user ID in the session
        req.session.userId = userId;
        req.session.email = emailuser;
        req.session.name = userName;
        req.session.loggedin = true;
        req.flash("success", "Welcome " + userName + "!");
        res.redirect("/users/home");
      }
    });
  }
);

module.exports = router;
