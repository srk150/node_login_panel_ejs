// exports.getUser = (req, res) => {
//   // Logic to fetch user data
//   const user = {
//     id: 1,
//     name: "John Doe",
//     email: "john@example.com",
//   };

//   res.json(user);
// };

var connection = require("../lib/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  authMiddleware,
  authenticateToken,
  validateToken,
} = require("../routes/authMiddleware");

exports.newuseradd = (req, res) => {
  let { name, email, password } = req.body;
  //creating user object
  const user = {
    email,
    password,
    name,
  };

  if (!name) {
    return res.status(400).send({
      msg: "Name should not be empty",
    });
  }

  //validate user and the information provided by them
  if (!email) {
    return res.status(400).send({
      msg: "Please enter valid email id",
    });
  }

  // password min 6 chars
  if (!password || password.length < 6) {
    return res.status(400).send({
      msg: "Please enter a password with min. 6 chars",
    });
  }

  connection.query(
    `SELECT * FROM users WHERE email=?`,
    email,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }

      //check whether username already exist or not
      if (result.length !== 0) {
        return res.status(409).send({
          msg: "This email is already in use!",
        });
      }
      // username is available
      bcrypt
        .hash(password, 8)
        .then((hash) => {
          //set the password to hash value
          user.password = hash;
        })
        .then(() => {
          connection.query("INSERT INTO users SET ?", user, (err, result) => {
            if (err) {
              return res.status(400).send({
                msg: err,
              });
            }

            connection.query(
              "SELECT * FROM users WHERE email=?",
              email,
              (err, result) => {
                if (err) {
                  return res.status(400).send({
                    msg: err,
                  });
                }

                return res.status(201).send({
                  userdata: user,
                  msg: "successfully registered",
                });
              }
            );
          });
        });
    }
  );
};

exports.signin = (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).send({
      msg: "Email should not be empty",
    });
  }

  // password min 6 chars
  if (!password || password.length < 6) {
    return res.status(400).send({
      msg: "Please enter a password with min. 6 chars",
    });
  }

  connection.query(
    `SELECT * FROM users WHERE email=?`,
    email,
    (err, result) => {
      if (err) {
        return res.status(400).send({
          msg: err,
        });
      }

      //check whether the user with that email exists or not
      if (result.length === 0) {
        return res.status(401).send({
          msg: "email or password is incorrect",
        });
      }

      //check password
      bcrypt.compare(password, result[0].password).then((isMatch) => {
        if (isMatch === false) {
          return res.status(401).send({
            msg: "email or Password is incorrect ",
          });
        }
        //generate token
        const token = jwt.sign({ id: result[0].user_id }, "secretKey");

        return res.status(200).send({
          msg: "logged in successfully",
          user: result[0],
          token,
        });
      });
    }
  );
};

exports.checkvalidtoken = (req, res) => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODcxNzU5OTN9.EVGj-YCMb2t32SuV8RZUIPnNxGpbab3bPGrZU7mTjbI";
  const result = validateToken(token);
  if (result.isValid) {
    console.log("Token is valid");
    console.log("Decoded payload:", result.payload);

    res.json({ message: "Token is valid " });
  } else {
    console.error("Token is invalid:", result.error);
    res.json({ message: "Token is invalid " });
  }
};

exports.checkauth = (req, res) => {
  // Only accessed if the JWT is valid

  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2ODcxNzU5OTN9.EVGj-YCMb2t32SuV8RZUIPnNxGpbab3bPGrZU7mTjbI";
  const result = authenticateToken(token);

  if (result.isValid) {
    res.json({ message: "Protected route accessed successfully!" });
  } else {
    console.error("Token is invalid:", result.error);
    res.json({ message: "Token is invalid:" });
  }
};

exports.checkauth = (req, res) => {};
