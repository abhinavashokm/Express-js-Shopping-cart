const ObjectId = require('mongodb').ObjectId
const db=require('../config/connection')
const collection=require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')

module.exports={
    adminLogin:(details)=>{
        return new Promise(async(resolve,reject)=>{
            let loginSuccess=false
            admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({'adminEmail':details.adminEmail})
            if(admin){
                bcrypt.compare(details.adminPassword,admin.password).then((result)=>{
                    console.log(result)
                    if(result){
                       loginSuccess=true
                        resolve(loginSuccess)
                    }else{
                        resolve(loginSuccess)
                    }
                })
                console.log('loginSuccess')
            }else{
                resolve(loginSuccess)
                console.log('loginERr')
            }
        })
    },
    getAllUser:()=>{
        return new Promise(async(resolve,reject)=>{
            
            let allUser=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(allUser)
        })
    },
    accountBan:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $set:{accountStatus:'Suspended'}
            }).then(()=>{
                resolve({status:'Suspended'})
            })
            
        })
    },
    accountUnban:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:ObjectId(userId)},{
                $set:{accountStatus:'Active'}
            }).then(()=>{
                resolve({status:'Active'})
            })
            
        })
    },
    getAllOrders:() => {
        return new Promise(async(resolve,reject) => {
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)

        })
            
        
    },
    updateOrderStatus:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{
                $set:{status:'shipped'}  
            }).then(()=>{
                response.status=true
                response.id=orderId
                resolve(response)
            })
            
        })
    }
}

