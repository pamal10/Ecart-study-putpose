var db=require('../config/connection')
var collection=require('../config/collections')
var Promise=require('promise')
var bcrypt=require('bcrypt')
const { response } = require('../app')

module.exports={
    getUserData:(userData)=>{
        return new Promise(async (resolve,reject)=>{
            userData.Password=await bcrypt.hash(userData.Password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])


            })
            
        })

    },
    doLogin:(userData)=>{
        let response={}
        return new Promise(async (resolve,reject)=>{
           
        let user=await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
        if(user){
            bcrypt.compare(userData.Password,user.Password).then((status)=>{
                if(status){
                    response.user=user
                    response.status=true
                    resolve(response)
                }else{
                    resolve({status:false})
                }
            })
           
        }  else {
            resolve({status:false})
        }
    }) 
}
    

} 
