const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user"); // make sure this points to your User model

mongoose.connect("mongodb://localhost:27017/CanteenManagement");

async function createAdmin() {
    const hashedPassword = await bcrypt.hash("aafiya", 10); // hash password

    const admin = new User({
        userName: "Admin",
        email: "aslam9892295654@gmail.com",
        password: hashedPassword,
        adminKey: "aafiyaismad",
        role: "admin",
    });

    await admin.save();
    console.log("Admin user created!");
    mongoose.connection.close();
}

createAdmin().catch(console.error);
