const Account = require("../models/Account");
const Balcony = require("../models/Balcony");
const Plant = require("../models/Plant");
const mqtt = require("mqtt");
const utils = require("../utils");
const broker = "mqtt://broker.mqttdashboard.com:1883";
const topic = "IOTUET_RECEIVING";
const options = {};

const client = mqtt.connect(broker, options);

const plantController = {

    control: async (req, res) => {
        try {
            const { plantId, requestCode } = req.body;
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

            client.publish(
                topic,
                JSON.stringify({
                    flag: 0,
                    requestCode: parseInt(requestCode),
                    plantId: parseInt(plantId.slice(-1)),
                    balconyId: plantId.slice(0, plantId.length - 1),
                }),
                (err) => {
                    if (err) {
                        return res.status(400).send({
                            result: "failed",
                            reason: err.message,
                        });
                    } else {
                        return res.status(400).send({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );
        } catch (error) {
            res.status(404).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    updateData: async (data) => {
        try {
            const { balconyId, enviromentTemperature, enviromentHumidity, sensorArr } = data;
            const balcony = await Balcony.findOne({ balconyId: balconyId });
            if (balcony) {
                await balcony.updateOne({
                    temperature: enviromentTemperature ?? 20,
                    humidity: enviromentHumidity ?? 78,
                });

                const plants = await Plant.find({ balconyId: balconyId });
                for (let i = 0; i < sensorArr.length; i++) {
                    const havePlant = await plants.find((item) => {
                        return item.plantId == `${balconyId}${i}`;
                    });
                    // if (sensorArr[i] < 100) {
                    if (havePlant) {
                        await Plant.findOneAndUpdate(
                            { plantId: balconyId + i.toString() },
                            {
                                soilMoisture: sensorArr[i],
                                envTemp: enviromentTemperature,
                                envHumi: enviromentHumidity,
                            }
                        );
                    }
                    // else {
                    //     const newPlant = new Plant({
                    //         balconyId: balconyId,
                    //         plantId: balconyId + i.toString(),
                    //         name: `Cây số ${i}`,
                    //         soilMoisture: sensorArr[i],
                    //         envTemp: enviromentTemperature,
                    //         envHumi: enviromentHumidity,
                    //         autoMode: false,
                    //         status: "PENDING",
                    //         image: "https://i.pinimg.com/236x/40/d1/0f/40d10f4bf9cbad18736419123528d989.jpg",
                    //     });
                    //     await newPlant.save();
                    // }
                    // }
                    // else {
                    //     if (havePlant) {
                    //         await Plant.findOneAndDelete({ plantId: balconyId + i.toString() });
                    //     }
                    // }
                }
            }
        } catch (error) {
            console.log({
                result: "failed",
                message: "Không thể cập nhật dữ liệu cho cây",
                reason: error.message,
            });
        }
    },

    detail: async (req, res) => {
        try {
            const { plantId } = req.query;

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

            const plant = await Plant.findOne({ plantId: plantId });

            // console.log(plant._id);

            // const balcony = await Balcony.findOne({ plants: { $in: [plant?._id] } });
            // return res.json({
            //     balcony: balcony,
            // });
            if (plant) {
                res.status(200).json({
                    result: "success",
                    plant: plant,
                });
            } else {
                res.status(200).json({
                    result: "failed",
                    message: "Không tìm được cây",
                });
            }
        } catch (error) {
            res.status(404).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    toggleAutoMode: async (req, res) => {
        try {
            const { plantId, autoMode } = req.body;
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

            const plant = await Plant.findOneAndUpdate({ plantId: plantId }, { autoMode: autoMode });

            client.publish(
                topic,
                JSON.stringify({
                    flag: 1,
                    autoMode: autoMode,
                    plantId: parseInt(plantId.slice(-1)),
                    balconyId: plantId.slice(0, plantId.length - 1),
                    soilMoistureBreakpoint: plant.soilMoistureBreakpoint,
                }),
                (err) => {
                    if (err) {
                        return console.log({
                            result: "failed",
                            message: err.message,
                        });
                    } else {
                        console.log({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );

            plant.updateOne({ autoMode: autoMode });

            if (plant) {
                res.status(200).json({
                    result: "success",
                    plant: plant,
                    message: `Chế độ tự động đã được ${autoMode ? "bật" : "tắt"} đối với cây ${plantId}`,
                });
            } else {
                res.status(200).json({
                    result: "failed",
                    message: "Không tìm được cây",
                });
            }
        } catch (error) {
            res.status(404).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    setBreakpoint: async (req, res) => {
        try {
            const { plantId, soilMoistureBreakpoint } = req.body;
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

            const plant = await Plant.findOneAndUpdate(
                { plantId: plantId },
                { soilMoistureBreakpoint: soilMoistureBreakpoint }
            );

            client.publish(
                topic,
                JSON.stringify({
                    flag: 2,
                    autoMode: plant.autoMode,
                    plantId: parseInt(plantId.slice(-1)),
                    balconyId: plantId.slice(0, plantId.length - 1),
                    soilMoistureBreakpoint: soilMoistureBreakpoint,
                }),
                (err) => {
                    if (err) {
                        return console.log({
                            result: "failed",
                            message: err.message,
                        });
                    } else {
                        console.log({
                            result: "success",
                            message: "Yêu cầu đã được gửi",
                        });
                    }
                }
            );

            if (plant) {
                res.status(200).json({
                    result: "success",
                    message: "Cập nhật thành công",
                });
            } else {
                res.status(200).json({
                    result: "failed",
                    message: "Không tìm được cây",
                });
            }
        } catch (error) {
            res.status(404).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    find: async (req, res) => {
        try {
            const { balconyId } = req.query;
            const accessToken = req.headers.authorization.split(" ")[1];

            const account = await Account.findOne({
                accessToken: accessToken,
            });

            if (!account) {
                return res.status(403).send({
                    result: "failed",
                    message: "Không đủ quyền truy cập",
                });
            }

            const plants = await Plant.find({ balconyId: balconyId });

            return res.status(200).send({
                result: "success",
                plants: plants,
            });
        } catch (error) {
            res.status(404).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    update: async (req, res) => {
        try {
            const { plantId, name, image } = req.body;
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

            const plant = await Plant.findOneAndUpdate(
                { plantId: plantId },
                {
                    name: name,
                    image: image,
                },
                { new: true }
            );

            return res.status(200).json({
                result: "success",
                plant: plant,
            });
        } catch (error) {
            res.status(400).json({
                result: "failed",
                reason: error.message,
            });
        }
    },

    create: async (req, res) => {
        try {
            const { name, plantOrder, balconyId } = req.body;

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

            const balcony = await Balcony.findOne({ balconyId: balconyId });
            if (balcony) {
                const newPlant = new Plant({
                    balconyId: balconyId,
                    plantId: balconyId + plantOrder.toString(),
                    name: name,
                    // soilMoisture: sensorArr[plantOrder],
                    // envTemp: enviromentTemperature,
                    // envHumi: enviromentHumidity,
                    autoMode: false,
                    // status: "PENDING",
                    image: "https://i.pinimg.com/236x/40/d1/0f/40d10f4bf9cbad18736419123528d989.jpg",
                });
                await newPlant.save();
                res.status(200).json({
                    result: "success",
                    plant: newPlant,
                });
            } else {
                res.status(400).json({
                    result: "failed",
                    reason: "Ban công không tồn tại",
                });
            }
        } catch (error) {
            res.status(400).json({
                result: "failed",
                reason: error.message,
            });
        }
    },
    delete: async (req, res) => {
        try {
            const { _id } = req.query;
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
            await Plant.findByIdAndDelete(_id);
            res.status(200).json({
                result: "success",
            });
        } catch (error) {
            res.status(400).json({
                result: "failed",
                reason: error.message,
            });
        }
    },
};

module.exports = plantController;