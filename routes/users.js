var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");
const bcrypt = require("bcrypt");

const nodemailer = require("nodemailer");

var ejs = require("ejs");
let dotenv = require("dotenv").config();

const {
  authMiddleware,
  authenticateToken,
  validateToken,
} = require("./authMiddleware");

// Create a transporter object using SMTP
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "sharukhkhan@belgiumwebnet.com",
    pass: "Sharukh@123",
  },
});

// Apply the authMiddleware to specific routes
const protectedRoutes = ["/home"]; //Specify the routes that require authentication
router.use(authMiddleware(protectedRoutes));

// display user page
router.get("/home", function (req, res, next) {
  dbConn.query("SELECT * FROM users ORDER BY id desc", function (err, rows) {
    if (err) {
      req.flash("error", err);
      // render to views/users/index.ejs
      res.render("users", { data: "" });
    } else {
      // render to views/users/index.ejs
      res.render("users", { data: rows });
    }
  });
});

// display add user page
router.get("/add", function (req, res, next) {
  // render to add.ejs
  res.render("users/add", {
    name: "",
    email: "",
    password: "",
  });
});

//login
router.post("/dologin", function (req, res, next) {
  let email = req.body.email;
  let password = req.body.password;
  let errors = false;

  //console.log(email);
  if (email == "" || password == "") {
    errors = true;
    // set flash message
    req.flash("error", "Please enter email and password");
    // render to add.ejs with flash message
    res.render("users/login", {
      email: email,
      password: password,
    });
  }

  // if no error
  if (!errors) {
    dbConn.query(
      "SELECT * FROM users WHERE email =" + "'" + email + "'",
      function (err, rows, fields) {
        if (err) throw err;

        // if user not found
        if (rows.length <= 0) {
          req.flash("error", "User not found with email = " + email);
          res.redirect("/users");
        }
        // if user found
        else {
          for (var count = 0; count < rows.length; count++) {
            roweId = rows[count].id;
            rowemail = rows[count].email;
            rowname = rows[count].name;
            rowpass = rows[count].password;

            bcrypt.compare(password, rowpass).then((isMatch) => {
              if (isMatch === false) {
                req.flash("error", "Incorrect Password");
                res.redirect("/users");
              } else {
                req.session.userId = roweId;
                req.session.email = rowemail;
                req.session.name = rowname;
                req.session.loggedin = true;

                req.flash("success", "Welcome " + rowname + "!");
                res.redirect("/users/home");
              }
            });
          }
        }
      }
    );
  }
});

// add a new user
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let errors = false;

  if (name == "" || email == "" || password == "") {
    errors = true;

    // set flash message
    req.flash("error", "Please enter name and email and password");
    // render to add.ejs with flash message
    res.render("users/add", {
      name: name,
      email: email,
      password: password,
    });
  }

  // if no error
  if (!errors) {
    var form_data = {
      name: name,
      email: email,
      password: password,
    };

    // insert query
    bcrypt
      .hash(password, 8)
      .then((hash) => {
        //set the password to hash value
        form_data.password = hash;
      })
      .then(() => {
        dbConn.query(
          "INSERT INTO users SET ?",
          form_data,
          function (err, result) {
            //if(err) throw err
            if (err) {
              req.flash("error", err);

              // render to add.ejs
              res.render("users/add", {
                name: form_data.name,
                email: form_data.email,
                password: form_data.password,
              });
            } else {
              req.session.name = form_data.name;
              req.session.email = form_data.email;
              req.session.loggedin = true;

              req.flash("success", "Welcome " + form_data.name + "!");
              res.redirect("/users/home");
            }
          }
        );
      });
  }
});

// display edit user page
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query(
    "SELECT * FROM users WHERE id = " + id,
    function (err, rows, fields) {
      if (err) throw err;

      // if user not found
      if (rows.length <= 0) {
        req.flash("error", "User not found with id = " + id);
        res.redirect("/users");
      }
      // if user found
      else {
        // render to edit.ejs
        res.render("users/edit", {
          title: "Edit User",
          id: rows[0].id,
          name: rows[0].name,
          email: rows[0].email,
          password: rows[0].password,
        });
      }
    }
  );
});

// update user data
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let email = req.body.email;
  let password = req.body.password;
  let errors = false;

  if (name.length === 0 || email.length === 0 || password.length === 0) {
    errors = true;

    // set flash message
    req.flash("error", "Please enter name and email and password");
    // render to add.ejs with flash message
    res.render("users/edit", {
      id: req.params.id,
      name: name,
      email: email,
      password: password,
    });
  }

  // if no error
  if (!errors) {
    var form_data = {
      name: name,
      email: email,
      password: password,
    };
    // update query
    bcrypt
      .hash(password, 8)
      .then((hash) => {
        //set the password to hash value
        form_data.password = hash;
      })
      .then(() => {
        dbConn.query(
          "UPDATE users SET ? WHERE id = " + id,
          form_data,
          function (err, result) {
            //if(err) throw err
            if (err) {
              // set flash message
              req.flash("error", err);
              // render to edit.ejs
              res.render("users/edit", {
                id: req.params.id,
                name: form_data.name,
                email: form_data.email,
                password: form_data.password,
              });
            } else {
              req.flash("success", "User successfully updated");
              res.redirect("/users/home");
            }
          } //
        );
      });
  }
});

// delete user
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query("DELETE FROM users WHERE id = " + id, function (err, result) {
    //if(err) throw err
    if (err) {
      // set flash message
      req.flash("error", err);
      // redirect to user page
      res.redirect("/users");
    } else {
      // set flash message
      req.flash("success", "User successfully deleted! ID = " + id);
      // redirect to user page
      res.redirect("/users/home");
    }
  });
});

// display add login page
router.get("/", function (req, res, next) {
  // render to add.ejs
  res.render("users/login", {
    email: "",
    password: "",
  });
});

//logout
router.get("/logout", function (req, res, next) {
  req.session.destroy();
  res.redirect("/users");
});

// Contacut us mail form
router.get("/contact", function (req, res, next) {
  // render to add.ejs
  res.render("users/contactus", {
    to_email: "",
    subject: "",
    msg: "",
  });
});

// Send mail function
router.post("/sendtomail", function (req, res, next) {
  try {
    let to_email = req.body.to_email;
    let subject = req.body.subject;
    let msg = req.body.msg;
    let errors = false;

    if (to_email == "" || subject == "" || msg == "") {
      errors = true;

      // set flash message
      req.flash("error", "Please enter to and subject and messages");
      // render to add.ejs with flash message
      res.render("users/contactus", {
        to_email: to_email,
        subject: subject,
        msg: msg,
      });
    }

    // if no error
    if (!errors) {
      var form_data = {
        to_email: to_email,
        subject: subject,
        messages: msg,
      };
      // insert query
      dbConn.query(
        "INSERT INTO contactus SET ?",
        form_data,
        function (err, result) {
          //if(err) throw err
          if (err) {
            // set flash message
            req.flash("error", err);

            // render to add.ejs
            res.render("users/contactus", {
              to_email: form_data.to_email,
              subject: form_data.subject,
              msg: form_data.messages,
            });
          } else {
            const templateData = {
              to_email: to_email,
              subject: form_data.subject,
              message: form_data.messages,
            };

            // Render the email template using EJS
            req.app.render(
              "users/template/contactemail",
              templateData,
              (error, renderedTemplate) => {
                if (error) {
                  console.error(error);
                  return res
                    .status(500)
                    .send(
                      "An error occurred while rendering the email template."
                    );
                } else {
                  // Send the email using Nodemailer
                  sendEmail(
                    transporter,
                    form_data.to_email,
                    form_data.subject,
                    renderedTemplate,
                    (sendError, info) => {
                      if (sendError) {
                        console.error(sendError);
                        return res
                          .status(500)
                          .send("An error occurred while sending the email.");
                      }

                      req.flash("success", "Email sent successfully!");
                      res.redirect("/users/contact");
                    }
                  );
                }
              }
            );
          }
        }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while sending the email.");
  }
});

//email function send
function sendEmail(transporter, form_data, subject, html, callback) {
  transporter.sendMail(
    {
      from: "sharukhkhan@belgiumwebnet.com",
      to: form_data,
      subject,
      html,
    },
    (error, info) => {
      callback(error, info);
    }
  );
}

router.get("/listcat", function (req, res, next) {
  //render to html pages
  // res.render("users/cat");

  dbConn.query("SELECT * FROM category ORDER BY id desc", function (err, rows) {
    if (err) {
      req.flash("error", err);
      // render to views/users/index.ejs
      res.render("users/cat", { data: "" });
    } else {
      // render to views/users/index.ejs
      res.render("users/cat", { data: rows });
    }
  });
});

router.post("/add-category", function (req, res, next) {
  const category = req.body.category;
  let errors = false;
  if (category == "") {
    errors = true;

    res.json({ status: false, message: "Please Fill Category!" });
  }

  // if no error
  if (!errors) {
    var form_data = {
      cat: category,
    };

    dbConn.query(
      "INSERT INTO category SET ?",
      form_data,
      function (err, result) {
        //if(err) throw err
        if (err) {
          req.flash("error", err);

          // render to add.ejs
          res.render("users/listcat", {
            category: category,
          });
        } else {
          // Set a flash message
          // req.flash("success", "Category added successfully!");

          // Send a response back to the client
          res.json({ status: true, message: "Category added successfully!" });
        }
      }
    );
  }
});

router.post("/deleteCategory/:id", function (req, res) {
  const catId = req.params.id;
  console.log(catId);
  let errors = false;

  if (catId == "") {
    errors = true;

    res.json({ status: false, message: "Id Not Found!" });
  }

  // if no error
  if (!errors) {
    dbConn.query(
      "DELETE FROM category WHERE id = " + catId,
      function (err, result) {
        if (err) {
          // req.flash("error", err);
          console.log(err);
        } else {
          res.json({ status: true, message: "Category deleted successfully!" });
        }
      }
    );
  }
});

module.exports = router;
