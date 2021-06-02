var db=require('../config/connection')
var collection=require('../config/collections')
var Promise=require('promise')
var objectId=require('mongodb').ObjectID
const { ObjectID } = require('bson')
module.exports={
    addProduct:(product,callback)=>{
        //console.log(product)

        db.get().collection('products').insertOne(product).then((data)=>{
            //console.log(data)
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        
        return new Promise(async (resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            
            resolve(products)
            
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                console.log(response)
                resolve()
            })
        })

    }    
}