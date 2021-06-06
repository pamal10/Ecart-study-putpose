var db = require('../config/connection')
var collection = require('../config/collections')
var Promise = require('promise')
var bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID
const { resolve } = require('promise')
const { ObjectID } = require('bson')
const { CART_COLLECTION } = require('../config/collections')
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_G5InNhCrovBNz0',
    key_secret: 'ncaJVBfJNd54yKU7vyhD3Qx0',
});


module.exports = {
    getUserData: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])


            })

        })

    },
    doLogin: (userData) => {
        let response = {}
        return new Promise(async (resolve, reject) => {

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })

            } else {
                resolve({ status: false })
            }
        })
    },
    addToCart: (proId, userId) => {
        let proObj = {
            item: objectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) }).then((userCart) => {
                console.log(proId)
                if (userCart) {
                    let proIndex = userCart.products.findIndex(products => products.item == proId)
                    if (proIndex != -1) {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectID(userId), 'products.item': objectId(proId) }, {
                            $inc: {
                                'products.$.quantity': 1
                            }
                        }).then(() => {
                            resolve()
                        })
                    } else {
                        db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                            {
                                $push: {
                                    products: proObj

                                }
                            }

                        ).then((respone) => {
                            resolve()
                        })
                    }

                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [proObj]

                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve()
                    })

                }
            })


        })
    },
    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: { item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] } }
                }


            ]).toArray()

            console.log(cartItems);

            resolve(cartItems)




        })

    },
    getCartCount: (userId) => {
        let count = 0
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) }).then((cart) => {
                console.log('pro' + cart.products);
                count = cart.products.length
                resolve(count)
            })
        })
    },
    countChange: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) }, {

                    $pull: { products: { item: ObjectId(details.product) } }

                }
                ).then((response) => {
                    resolve({ removedProduct: true })
                })
            }
            else {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                    {
                        $inc: { 'products.$.quantity': details.count }
                    }



                ).then((response) => {
                    resolve({ status: true })
                })

            }



        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let Total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
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
                    $lookup:
                    {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'products'
                    }
                },
                {
                    $project: { item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] } }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: [{ $toInt: '$quantity' }, { $toInt: '$products.Price' }] } }
                    }
                }


            ]).toArray()
            console.log(Total)

            resolve(Total[0].total)




        })


    },
    getCartProductsList: (userId) => {
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            console.log('cart: ' + cart)
            resolve(cart.products)
        })
    },
    placeOrder: (order, products, total) => {
        let date = new Date()

      


        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                deliveryDetails: {
                    mobile: order.mobile,
                    address: order.address,
                    pincode: order.pincode
                },
                userId: objectId(order.userId),
                paymentMethod: order['payment-method'],
                products: products,
                totalAmount: total,
                date: date,
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(order.userId) })
                console.log('id' + response.ops[0]._id);
                resolve(response.ops[0]._id)

            })
        })

    },
    generateRazorPay: (orderId, price) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: price * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                }
                else {
                    console.log('order: ' + order);
                    resolve(order)
                }
            });


        })

    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto')
            let hmac = crypto.createHmac('sha256', 'ncaJVBfJNd54yKU7vyhD3Qx0')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + 'payment[razorpay_payment_id]')
            hmac = hmac.update('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log('oreder: ' + orderId);
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'Placed'
                    }
                }
            ).then(() => {
                resolve()
            })
        })
    },
    getOrderDetails: (user) => {
        return new Promise(async (resolve, reject) => {
            let Orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectId(user) }).toArray()

            resolve(Orders)

        })
    }





}
