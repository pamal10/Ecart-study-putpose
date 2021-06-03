var db = require('../config/connection')
var collection = require('../config/collections')
var Promise = require('promise')
var bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID
const { resolve } = require('promise')


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
        
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) }).then((userCart) => {
                console.log(proId)
                if (userCart) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: {
                                products: objectId(proId)

                            }
                        }
                
                    ).then((respone)=>{
                        resolve()
                    })

                } else {
                    let cartObj = {
                        user: objectId(userId),
                        products: [objectId(proId)]

                    }
                    db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve()
                    })

                }
            })
           

        })
    },
    getCartProducts:    (userId) => {
        
        return new Promise(async (resolve, reject) => {
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { prodList: '$products' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', "$$prodList"]
 
                                    }
                                }
                            }
                        ],
                        as: 'userCartItems'
                    }
                }
            ]).toArray()
                 
               
                resolve(cartItems[0].userCartItems)
           

        })

    },
    getCartCount:(userId)=>{
       let count=0
        return new Promise(async(resolve,reject)=>{
            await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)}).then((cart)=>{
                count=cart.products.length
                resolve(count)
            })
        })
    }



}
