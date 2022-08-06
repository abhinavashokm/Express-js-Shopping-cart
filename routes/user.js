var express = require('express');
var { cartCount } = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require("../helpers/product-helpers")
var userHelper = require("../helpers/user-helpers")
const objectId = require('mongodb').ObjectId

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next()
  } else {
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/', async (req, res) => {
  let user = req.session.user
  let cartCount = null
  if (user) {
    let userId = req.session.user._id
    cartCount = await productHelper.cartCount(userId)
  }
  productHelper.getAllProduct().then((products) => {
    res.render('user/index', { products, user, cartCount })
  })
});

router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/user-login', { 'loginErr': req.session.userLoginErr })
    req.session.userLoginErr = false

  }

})

router.post('/login', (req, res) => {
  userHelper.doLogin(req.body).then((responce) => {

    if (responce.status) {
      if (responce.account) {
        req.session.user = responce.user
        req.session.user.loggedIn = true
        res.redirect('/')
      } else {
        req.session.userLoginErr = responce.loginErr
        res.redirect('/login')
      }

    } else {
      req.session.userLoginErr = responce.loginErr
      res.redirect('/login')
    }
  })

})

router.get('/sign-up', (req, res) => {
  res.render('user/sign-up')

})

router.post('/sign-up', (req, res) => {
  userHelper.doSignup(req.body).then((responce) => {
    req.session.user = responce
    req.session.user.loggedIn = true
    res.redirect('/login')
  })

})

router.get('/logout', (req, res) => {
  req.session.user = null
  res.redirect('/')
})

router.get('/cart', verifyLogin, async (req, res) => {
  userId = req.session.user._id
  user = req.session.user
  let cartItems = await productHelper.getCartProducts(userId)
  let totalPrice = 0
  if (cartItems.length > 0) {
    totalPrice = await userHelper.cartTotalPrice(userId).then()
  }

  res.render('user/cart', { cartItems, user, totalPrice })
})

router.get('/addToCart/:id', (req, res) => {


  let proId = req.params.id
  let userId = req.session.user._id

  productHelper.addToCart(proId, userId).then(() => {
    res.json({ status: true })
  })

})
router.get('/removeCart/:id', (req, res) => {
  console.log('hello world')
  let proId = req.params.id
  let userId = req.session.user._id

  productHelper.removeCart(proId, userId).then((responce) => {
    res.json(responce)
  })
})
router.post('/changeQuantity', (req, res) => {
  let user = req.body.user

  productHelper.changeQuantity(req.body).then(async (responce) => {
    responce.totalPrice = await userHelper.cartTotalPrice(user).then()
    res.json(responce)
  })

})


router.get('/order-page', verifyLogin, async (req, res) => {
  user = req.session.user
  let orderDetails = await userHelper.getOrderDetails(user._id).then()
  let items = await userHelper.getOrderProducts(user._id)
  res.render('user/order-page', { orderDetails, user, items })
})

router.get('/order-success', verifyLogin, (req, res) => {
  res.render('user/order-success', { 'user': req.session.user })
})

router.post('/verify-payment', (req, res) => {
  userHelper.verifyPayment(req.body).then((responce) => {
    userHelper.changeOrderStatus(req.body['order[receipt]']).then(() => {
      res.json(responce)
    })
  })
})

router.get('/place-order', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  let totalPrice = await userHelper.cartTotalPrice(userId).then()
  singleOrder = false
  cartCount = await productHelper.cartCount(userId)
  if (cartCount != '0') {
    res.render('user/placeOrder', { totalPrice, userId, 'user': req.session.user, singleOrder })
  }else{
    res.redirect('/cart')
  }


})

router.get('/place-order-single/:total/:quantity/:id', verifyLogin, async (req, res) => {

  let userId = req.session.user._id
  let totalPrice = req.params.total
  let quantity = req.params.quantity
  let proId = req.params.id
  let singleOrder = true
  cartCount = await productHelper.cartCount(userId)
  if(cartCount!='0'){
    res.render('user/placeOrder', { totalPrice, userId, 'user': req.session.user, quantity, singleOrder, proId })
  }else{
    res.redirect('/cart')
  }
  
})

router.post('/place-order', verifyLogin, async (req, res) => {
 let username=req.body.userName
 console.log(username)
  userId = req.body.userId

  let cartList = []
  let singleProduct = false
  if (req.body.single) {
    quantity = await userHelper.getProductQuantity(userId, req.body.proId)
    console.log('placeorder')
    cartList = [{ 'item': objectId(req.body.proId), 'quantity': quantity }]
    totalPrice = req.body.totalPrice * quantity
    singleProduct = true
  } else {
    cartList = await userHelper.getCartList(userId).then()
    totalPrice = await userHelper.cartTotalPrice(userId)
  }
  if (req.body['payment-method'] == 'COD') {
    userHelper.placeOrder(req.body, cartList, totalPrice, singleProduct).then((orderId) => {
      res.json({ codSuccess: true })
    })
  } else if (req.body['payment-method'] == 'ONLINE') {
    userHelper.checkInternetConnection().then((connection) => {
      console.log(connection)
      if (connection) {
        userHelper.placeOrder(req.body, cartList, totalPrice, singleProduct).then((orderId) => {
          userHelper.generateRazorpay(orderId, totalPrice).then((order) => {
            res.json({ order })
          })
        })
      } else {
        res.json({ error: true })
        console.log('No internet connection')
      }
    })
  } else {
    console.log('no payment mehtod selected')
  }
})

router.get('/connectionErr', (req, res) => {
  res.json({ status: true })
})


module.exports = router;
