const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const connect = async () => {
    try {
        await mongoose.connect(
            `mongosh "mongodb+srv://phamgiatam11.hwz0dwx.mongodb.net/myFirstDatabase?authSource=%24external&authMechanism=MONGODB-X509" --apiVersion 1 --tls --tlsCertificateKeyFile ../cert.pem` 
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