var createError = require("http-errors");
var express = require("express");
var path = require("path");
var flash = require("express-flash");
var session = require("express-session");
var mysql = require("mysql");
var connection = require("./lib/db");
var usersRouter = require("./routes/users");
const userController = require("./controller/userController");
const authController = require("./controller/authController");

let dotenv = require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const {
  authMiddleware,
  authenticateToken,
  validateToken,
} = require("./routes/authMiddleware");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());
app.use("/users", usersRouter);
app.use("/auth", authController);

//api for singup
app.post("/api/newuser", userController.newuseradd);
app.post("/api/doLogin", userController.signin);
app.post("/api/checkauth", userController.checkauth);
app.post("/api/checkvalidtoken", userController.checkvalidtoken);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});
app.listen(3000);
