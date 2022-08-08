const db=require('../config/connection')
const collection=require('../config/collections')
const { CART_COLLECTION } = require('../config/collections')
const ObjectId = require('mongodb').ObjectId

module.exports={
    addProduct:(product,callback) => {
        
        product.price=parseInt(product.price)
        console.log(product)
     
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
        
            callback(data.insertedId)
        })
    },
    getAllProduct:() => {
        return new Promise(async(resolve,reject) => {
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)

        })
            
        
    },
    deleteProduct:(productId)=>{
        return new Promise((resolve,reject)=>{
          
            
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:ObjectId(productId) }).then((responce)=>{
               
                resolve(responce)
            })
        })
    },
    getOneProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:ObjectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(proId)},{$set:
            { "title":proDetails.title,
              "category":proDetails.category,
              "description":proDetails.description,
              "price":parseInt(proDetails.price),
              }}).then((data)=>{
                resolve(data)
              })
        })
    },

//    USER CART FUNCTIONS DOWN


    addToCart:(proId,userId)=>{
        let proObj={
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
           
            let userCart=await db.get().collection(collection.CART_COLLECTION)
            .findOne({user:ObjectId(userId)}).then()


            if(userCart){
                let proExit=userCart.product.findIndex(product=> product.item==proId)
                
                if(proExit!=-1){
                   
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId),'product.item' : ObjectId(proId)},{
                         $inc:{'product.$.quantity':1}
                    })
                }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                { 
                        $push:{product:proObj}
                }).then(()=>{
                    resolve()
                })
            }
            }else{
                let cartObj={
                    user:ObjectId(userId),
                    product:[proObj],
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((responce)=>{
                    resolve(responce)
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            
            resolve(cartItems)
        })
    },
    cartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
             if(cart){
            count=cart.product.length
             }
             resolve(count)
             
        })
    },
    removeCart:(proId,userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({'user':ObjectId(userId),'product.item':ObjectId(proId)},
            {
                $pull:{product:{item:ObjectId(proId)}}
            }).then((responce)=>{
                responce.removed=true
                resolve(responce)
            })
        })
    },
    changeQuantity:(details)=>{
        let quantity=details.quantity
        let cart=details.cart
        let product=details.product
        let count=parseInt(details.count)
        return new Promise((resolve,reject)=>{
            if(quantity==1 && count==-1){
               
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(cart) , 'product.item':ObjectId(product)},
                {
                    $pull:{product:{item:ObjectId(product)}}
                }
                ).then(()=>{
                    resolve({removePro:true})
                })
            }else{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:ObjectId(cart),'product.item' : ObjectId(product)},
            {
                $inc:{'product.$.quantity':count}
           }).then((responce)=>{
            resolve(responce)
           })
        }
        })
    
    },
    getProductPrize:(proId)=>{
        return new Promise(async(resolve,reject)=>{
            product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({'_id':ObjectId(proId)})
            resolve(product.price)
        })
    },
    getDateTime: () => {
        return new Promise((resolve, reject) => {
            let dt = {}
            let dateDetails = new Date();
            // current day
            dt.day = ("0" + dateDetails.getDate()).slice(-2);
            // current month
            dt.month = ("0" + (dateDetails.getMonth() + 1)).slice(-2);

            // current year
            dt.year = dateDetails.getFullYear();

            // current hours
            dt.hours = dateDetails.getHours();

            // current minutes
            dt.minutes = dateDetails.getMinutes();

            let date=dt.year + "-" + dt.month + "-" + dt.day
            let time=dt.hours + ":" + dt.minutes
            let dateTime={}
            dateTime.date=date
            dateTime.time=time
            resolve(dateTime)
        })
    }


}