const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://admin:Root%40123@cluster0.ke96okb.mongodb.net/admin?authSource=admin&replicaSet=atlas-93v2lp-shard-0&w=majority&readPreference=primary&appname=MongoDB%20Compass&retryWrites=true&ssl=true` 
        );
        console.log("connected to MongoDB successfuly");
    } catch (error) {
        console.log("connect faile");
        console.log(error.message);
    }
};

module.exports = {
    connect,
};