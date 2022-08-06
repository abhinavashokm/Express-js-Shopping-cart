const { response } = require('express');
var express = require('express');
const res = require('express/lib/response');
var router = express.Router();
var productHelper = require("../helpers/product-helpers")
const fs = require('fs')
var adminHelpers = require('../helpers/admin-helpers');
const { runInNewContext } = require('vm');
const userHelpers = require('../helpers/user-helpers');
const verifyAdminLogin = (req, res, next) => {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/admin/admin-login')
  }

}

/* GET users listing. */
router.get('/', function (req, res) {
  productHelper.getAllProduct().then((products) => {
    admin = req.session.admin
    res.render('admin/admin-products', { products, admin: true })
  })

});

router.get('/add-products', verifyAdminLogin, function (req, res) {
  res.render('admin/add-products', { admin: true })
})

router.post('/add-products', (req, res) => {

  productHelper.addProduct(req.body, (id) => {
    if (req.files) {
      let image = req.files.image
      image.mv('./public/product-images/' + id + '.jpg', (err) => {
        if (err) {
          console.log(err)
          res.render('admin/add-products')
        } else {
          res.redirect('/admin')
        }
      })
    }
  })
})


router.get('/delete-product/:id', (req, res) => {
  var proId = req.params.id

  productHelper.deleteProduct(proId).then((response) => {
    res.redirect('/admin')
    let fileExistence = fs.existsSync('./public/product-images/' + proId + '.jpg')
    if (fileExistence) {
      fs.unlinkSync('./public/product-images/' + proId + '.jpg')
    }
  })
})

router.get('/edit-product/:id', verifyAdminLogin, async (req, res) => {
  let product = await productHelper.getOneProduct(req.params.id).then()

  res.render('admin/edit-product', { admin: true, product })
})

router.post('/update-products/:id', (req, res) => {

  let ID = req.params.id
  productHelper.updateProduct(ID, req.body).then((data) => {
    res.redirect('/admin')

    if (req.files) {
      let image = req.files.image
      image.mv('./public/product-images/' + ID + '.jpg')
    }
  })
})

router.get('/admin-login', (req, res) => {

  res.render('admin/admin-login', { 'adminLoginErr': req.session.adminLoginErr, admin: true })
})

router.post('/login', (req, res) => {

  loginDetails = req.body
  adminHelpers.adminLogin(loginDetails).then((loginStatus) => {
    if (loginStatus) {
      req.session.admin = true
      res.redirect('/admin')
    } else {
      req.session.adminLoginErr = 'Invalid email address or password'
      res.redirect('/admin/admin-login')
    }
  })

})

router.get('/logout', (req, res) => {
  req.session.admin = null
  res.redirect('/admin')
})

router.get('/users', async (req, res) => {

  let allUser = await adminHelpers.getAllUser()
  allUser.forEach(element => {
    if (element.accountStatus == 'Active') {
      element.status = true
    } else {
      element.status = false
    }
  })

  res.render('admin/userDetails', { admin: true, allUser })
})

router.get('/account-ban/:id', (req, res) => {
  userId = req.params.id
  adminHelpers.accountBan(userId).then((response) => {
    res.json(response)
  })
})

router.get('/account-unban/:id', (req, res) => {
  userId = req.params.id
  adminHelpers.accountUnban(userId).then((response) => {
    res.json(response)
  })
})
router.get('/orders', async (req, res) => {
  let allOrders = await adminHelpers.getAllOrders().then()
  allOrders.forEach(element => {
    let itemId = element.products.item
    productHelper.getOneProduct(itemId).then((pro) => {
      element.productTitle = pro.title
      element.productPrice = pro.price
      element.quantity = element.products.quantity
      element.proId = itemId
      console.log(allOrders)
    })
  })
  res.render('admin/all-orders', { admin: true, allOrders })


})

router.post('/changeOrderStatus', (req, res) => {
  console.log(req.body.orderId)
  adminHelpers.updateOrderStatus(req.body.orderId).then((responce) => {
    res.json(responce)
  })
})
module.exports = router;
