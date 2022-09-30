const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const mongoConnect = require("./dbConnect").mongoConnect;
const getDb = require("./dbConnect").getDb;

require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const findUser = async (username) => getDb().collection("users")
    .findOne({ username: username })







app.post("/login", async (req, res) => {

    const error = [];
    if (!req?.body?.username?.trim()) {
        error.push("Missing username!");
    }
    if (!req?.body?.password?.trim()) {
        error.push("Missing password!");
    }
    if (error.length) {
        res.status(400).send(error);
        return;
    }
    const foundUser = await findUser(req.body.username);
    if (!foundUser) {
        res.status(400).send(["User with that username doesn't exist!"]);
        return;
    }
    const passMatches = await bcrypt.compare(req.body.password, foundUser.password);

    if (passMatches) {
        const token = jwt.sign(
            { user_id: foundUser._id.toString(), username: foundUser.username },
            process.env.TOKEN_KEY,
            {
                expiresIn: "2h",
            }
        );
        res.status(200).send({
            id: foundUser._id.toString(),
            username: foundUser.username,
            token: token,
        });
        return;
    } else {
        res.status(400).send(["Username and password doesn't match!"]);
        return;
    }
});


app.post('/contact', async (req, res) => {
    const error = [];
    if (!req?.body?.name?.trim()) {
        error.push("Missing name!");
    }
    if (!req?.body?.email?.trim()) {
        error.push("Missing email!");
    }
    if (!req?.body?.message?.trim()) {
        error.push("Missing message!");
    }

    if (error.length) {
        return res.status(400).send(error);
    }


    const messageId = await getDb().collection("messages").insertOne({
        name: req.body.name,
        email: req.body.email,
        message: req.body.message,
        createdAt: new Date().toString()
    });
    return res.status(201).send({
        id: messageId.insertedId.toString(),
    });
})



app.use((req, res, next) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    }
    try {
        const decoded = jwt.verify(token, process.env.TOKEN_KEY);
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
});

app.post('/register', async (req, res) => {
    const error = [];
    if (!req?.body?.name?.trim()) {
        error.push("Missing name!");
    }
    if (!req?.body?.lastName?.trim()) {
        error.push("Missing last name!");
    }
    if (!req?.body?.username?.trim()) {
        error.push("Missing username!");
    }
    if (!req?.body?.password?.trim()) {
        error.push("Missing password!");
    }
    if (error.length) {
        return res.status(400).send(error);
    }

    const foundUser = await findUser(req.body.username);

    if (foundUser) {
        return res.status(400).send(["User already exists"]);
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const userID = await getDb().collection("users").insertOne({
        name: req.body.name,
        lastName: req.body.lastName,
        username: req.body.username,
        password: hashedPassword,
    });
    // const token = jwt.sign(
    //     { user_id: userID.insertedId.toString(), username: req.body.username },
    //     process.env.TOKEN_KEY,
    //     {
    //         expiresIn: "2h",
    //     }
    // );
    return res.status(201).send({
        id: userID.insertedId.toString(),
        username: req.body.username,
        // token: token,
    });
})

app.get('/contacts', async (req, res) => {
    const data = [];
    const contacts = await getDb().collection("messages").find().forEach(d => {
        data.push(d);
    });
    // console.log(contacts);
    return res.status(201).send(data);
})




app.get("/", (req, res) => {
    res.send("MAJMUNI");
});



const PORT = process.env.PORT || 4000;
mongoConnect(() => {
    app.listen(PORT, () => {
        console.log("Server started on: " + PORT);
    });
});