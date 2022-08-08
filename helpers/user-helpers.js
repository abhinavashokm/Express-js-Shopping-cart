const bcrypt = require('bcrypt')
const db = require('../config/connection')
const collection = require('../config/collections')
const objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
const e = require('express')
const productHelpers = require('./product-helpers')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_9t63s6OQgKA4r2',
    key_secret: 'oFKBYAtl0jPnX8n8AUbPH7AN',
});
module.exports = {
    doSignup: (userData, callback) => {
        return new Promise(async (resolve, reject) => {
            dateTime = await productHelpers.getDateTime()
            userData.createdDate = dateTime.date
            userData.lastLogin = dateTime.date
            userData.accountStatus = 'Active'
            userData.userPassword = await bcrypt.hash(userData.userPassword, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {

                db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(data.insertedId) }).then((user) => {
                    resolve(user)

                })
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let responce = {}
            let date = await productHelpers.getDateTime()
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ userName: userData.userName })
            if (user) {
                bcrypt.compare(userData.userPassword, user.userPassword).then((status) => {
                    if (status) {
                        responce.user = user
                        responce.status = true
                        if (user.accountStatus == 'Active') {
                            db.get().collection(collection.USER_COLLECTION).updateOne({ '_id': user._id }, {
                                $set: { lastLogin: date.date }
                            })
                            responce.account = true
                        } else {
                            responce.loginErr = 'Your account has been banned!'
                            responce.account = false
                        }
                        resolve(responce)
                    } else {
                        responce.loginErr = 'password does not match!'
                        responce.status = false
                        resolve(responce)
                    }
                })
            } else {
                responce.loginErr = 'invalid user name!'
                responce.status = false
                resolve(responce)
            }
        })
    },
    cartTotalPrice: (userId) => {
        return new Promise(async (resolve, reject) => {
            let totalPrice = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$product'
                },
                {
                    $project: {
                        item: '$product.item',
                        quantity: '$product.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,

                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            if (totalPrice[0]) {
                resolve(totalPrice[0].total)
            } else {
                resolve(0)
            }

        })
    },
    placeOrder: (orderDetails, cartList, totalPrice, singleProduct) => {

        userId = orderDetails.userId
        userName = orderDetails.userName
        proId = orderDetails.proId
        let cartLength = cartList.length

        return new Promise(async (resolve, reject) => {
            totalPrice = parseInt(totalPrice)
            let DateTime = await productHelpers.getDateTime()
            let status = orderDetails['payment-method'] === 'COD' ? 'placed' : 'pending'
            for (let i = 0; i < cartLength; i++) {
                let cartObj = {
                    user: userId,
                    userName: userName,
                    deliveryDetails: {
                        address: orderDetails.address,
                        mobile: orderDetails.mobile,
                        pincode: orderDetails.pincode,
                    },
                    totalPrice: totalPrice,
                    payment: orderDetails['payment-method'],
                    products: cartList[i],
                    status: status,
                    date: DateTime.date,
                    time: DateTime.time

                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(cartObj).then((data) => {
                    if (singleProduct) {
                        resolve(data.insertedId)
                        productHelpers.removeCart(proId, userId)
                    } else {
                        resolve(data.insertedId)
                        db.get().collection(collection.CART_COLLECTION).deleteOne({ 'user': objectId(orderDetails.userId) })

                    }




                })
            }

        })
    },
    getCartList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let list = await db.get().collection(collection.CART_COLLECTION).findOne({ 'user': objectId(userId) })
            if (list) {
                resolve(list.product)
            }



        })
    },
    getOrderDetails: (userId) => {
        console.log('id::' + userId)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({ 'user': userId }).then((orderData) => {

                resolve(orderData)
            })
        })
    },
    getOrderProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let Items = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { user: userId }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$products', 0] }
                    }
                }
            ]).toArray()

            resolve(Items)
        })
    },
    // creating an order in server side
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {

            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    resolve(order)
                }
            });
        })
    },

    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require("crypto");
            var hmac = crypto.createHmac("SHA256", "oFKBYAtl0jPnX8n8AUbPH7AN")
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve({ status: true })
            } else {
                reject()
            }



        })
    },

    changeOrderStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) }, {
                $set: { status: 'placed' }
            }).then((data) => {
                resolve()
            })
        })
    },
    getProductQuantity: (userId, proId) => {
        return new Promise(async (resolve, reject) => {
            let quantity = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId), 'product.item': objectId(proId) })
            if (quantity) {
                let product = quantity.product
                let position = product.findIndex(product => product.item == proId)
                let proQuantity = quantity.product[position].quantity
                resolve(proQuantity)
            }

        })
    },
    checkInternetConnection: () => {
        return new Promise((resolve, reject) => {
            let connection = null
            require('dns').resolve('www.google.com', function (err) {
                if (err) {
                    console.log("No connection");
                    connection = false
                } else {
                    console.log("Connected");
                    connection = true
                }
                resolve(connection)
            })
        })
    },
}
