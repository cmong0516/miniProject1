const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");

let db;
let user_id;
let name;
MongoClient.connect(
  "mongodb+srv://admin:apple0516@cluster0.8jbzk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  function (error, client) {
    db = client.db("bookmember");
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signin", (req, res) => {
  res.render("signin.ejs");
});

app.get("/search", login, (req, res) => {
  res.render("search.ejs");
});

app.get("/cart", login, (req, res) => {
  res.render("cart.ejs");
});

app.get("/best", login, (req, res) => {
  res.render("best.ejs");
});

app.get("/hot", login, (req, res) => {
  res.render("hot.ejs");
});

app.use(express.static(__dirname + "/public"));

app.post("/memberadd", function (req, res) {
  console.log(req.body);

  db.collection("login").insertOne(
    {
      name: req.body.userName,
      id: req.body.userId,
      pw: req.body.userPassword,
      done: [{}],
      rent: [{}],
    },
    function (error, result) {
      res.redirect("/");
    }
  );
});

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  db.collection("login").findOne({ id: id }, function (error, result) {
    done(null, result);
  });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (inputId, inputPwd, done) {
      db.collection("login").findOne({ id: inputId }, function (error, result) {
        if (error) return done(error);

        if (!result)
          return done(null, false, { message: "존재하지않는 아이디요" });
        if (inputPwd == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/fail" }),
  function (req, res) {
    if (req.user._id == 0) {
      res.redirect("/member");
    } else {
      user_id = req.user._id;
      name = req.user.name;
      res.redirect("/");
    }
  }
);

function login(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/member", login, (req, res) => {
  db.collection("login")
    .find()
    .toArray(function (error, result) {
      res.render("member.ejs", { members: result });
    });
});

app.get("/rentbook", login, (req, res) => {
  db.collection("login")
    .find({}, { _id: user_id })
    .toArray(function (error, result) {
      res.render("rentbook.ejs", { members: result, name: name });
    });
});

app.get("/complit", login, (req, res) => {
  db.collection("login")
    .find({}, { _id: user_id })
    .toArray(function (error, result) {
      console.log(result);
      res.render("complit.ejs", {
        members: result,
        name: name,
      });
    });
});

app.post("/rent", login, (req, res) => {
  db.collection("login")
    .find({}, { _id: user_id })
    .toArray(function (error, result) {
      console.log(req.body.bookname);
      db.collection("login").updateOne(
        {
          _id: user_id,
        },
        { $push: { rent: req.body.bookname } }
      );
    });
});

app.post("/readed", login, (req, res) => {
  db.collection("login")
    .find({}, { _id: user_id })
    .toArray(function (error, result) {
      console.log(req.body.bookname);
      db.collection("login").updateOne(
        {
          _id: user_id,
        },
        { $push: { done: req.body.bookname } }
      );
    });
});
