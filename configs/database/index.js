const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(
            `mongodb+srv://phamgiatam:phamgiatam@phamgiatam11.hwz0dwx.mongodb.net/?retryWrites=true&w=majority`
        );
        console.log("connected to MongoDB successfuly");
    } catch (error) {
        console.log("connect failed");
        console.log(error.message);
    }
};

module.exports = {
    connect,
};