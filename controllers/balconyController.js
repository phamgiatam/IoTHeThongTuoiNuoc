const Account = require("../models/Account");
const Balcony = require("../models/Balcony");

const balconyController = {
    createBalcony: async (req, res) => {
        try {
            const { name, balconyId } = req.body;
            const accessToken = req.headers.authorization.split(" ")[1];

            const balcony = await Balcony.findOne({ name: name });

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(400).send({
                    result: "failed",
                    reason: "Không đủ quyền truy cập",
                });
            }

            if (balcony) {
                return res.status(400).send({
                    result: "failed",
                    reason: "Tên ban công đã tồn tại",
                });
            } else {
                const newBalcony = new Balcony({
                    account: account._id,
                    balconyId: balconyId,
                    name: name,
                    humidity: 0,
                    temperature: 0,
                    image: "https://i.pinimg.com/564x/05/fc/9d/05fc9d39ac383eea6b85c0321771c326.jpg",
                });
                await newBalcony.save();

                return res.send({
                    result: "success",
                    balcony: newBalcony,
                });
            }
        } catch (error) {
            res.status(500).send({
                result: "failed",
                reason: error.message,
            });
        }
    },
    find: async (req, res) => {
        try {
            const accessToken = req.headers.authorization.split(" ")[1];
            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(400).send({
                    result: "failed",
                    reason: "Không đủ quyền truy cập",
                });
            }

            const balconies = await Balcony.find({ account: account._id });

            return res.send({
                result: "success",
                balconies: balconies,
            });
        } catch (error) {
            res.status(400).send({
                result: "failed",
                reason: error.message,
            });
        }
    },
    detail: async (req, res) => {
        try {
            const { balconyId } = req.query;

            const accessToken = req.headers.authorization.split(" ")[1];
            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(403).send({
                    result: "failed",
                    reason: "Không đủ quyền truy cập",
                });
            }

            const balcony = await Balcony.findOne({ balconyId: balconyId });
            res.status(200).send({
                result: "success",
                balcony: balcony,
            });
        } catch (error) {
            res.status(404).send({
                result: "failed",
                reason: error.message,
            });
        }
    },
    update: async (req, res) => {
        try {
            const { balconyId, image, name } = req.body;

            const accessToken = req.headers.authorization.split(" ")[1];
            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(403).send({
                    result: "failed",
                    reason: "Không đủ quyền truy cập",
                });
            }

            const balcony = await Balcony.findOneAndUpdate(
                { balconyId: balconyId },
                {
                    name: name,
                    image: image,
                },
                { new: true }
            );
            res.status(200).send({
                result: "success",
                balcony: balcony,
            });
        } catch (error) {
            res.status(404).send({
                result: "failed",
                reason: error.message,
            });
        }
    },
    delete: async (req, res) => {
        try {
          const { balconyId } = req.query;
          
          // Check for valid input
          if (!balconyId) {
            return res.status(400).send({
              result: "failed",
              reason: "Missing balconyId parameter",
            });
          }
      
          const accessToken = req.headers.authorization?.split(" ")[1];
          
          // Use try-catch for authentication
          try {
            const account = await Account.findOne({ accessToken });
            if (!account) {
              return res.status(401).send({
                result: "failed",
                reason: "Invalid access token",
              });
            }
          } catch (error) {
            return res.status(500).send({
              result: "failed",
              reason: error.message,
            });
          }
      
          await Balcony.findByIdAndDelete(balconyId);
      
          res.status(200).send({
            result: "success",
          });
        } catch (error) {
          res.status(404).send({
            result: "failed",
            reason: error.message,
          });
        }
      },
      
};

module.exports = balconyController;