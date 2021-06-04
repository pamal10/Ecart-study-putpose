var db = require('../config/connection')
var collection = require('../config/collections')
var Promise = require('promise')
var bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID
const { resolve } = require('promise')
const { ObjectID } = require('bson')
const { CART_COLLECTION } = require('../config/collections')


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
                count = cart.products.length
                resolve(count)
            })
        })
    },
    countChange: (cartId, proId, count, quantity) => {
        return new Promise( (resolve, reject) => {
            if (quantity == 1 && count == -1) {
                 db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId) },
                    {
                        $pull: { products: { item: objectId(proId) } }
                    }
                ).then((response) => {
                    resolve({ removedProduct: true })
                })
            } else {
                 db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId), 'products.item': objectId(proId) }, {
                    $inc: {
                        'products.$.quantity': count
                    }
                }).then((response) => {

                    resolve(true)
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
                        total: { $sum:{$multiply:[{ $toInt: '$quantity' },{ $toInt: '$products.Price' }]}}
                    }
                }


            ]).toArray()
                    console.log(Total)

            resolve(Total[0].total)




        })


    }



}
