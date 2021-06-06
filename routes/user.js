const { response } = require('express');
var express = require('express');
const { render } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  } else {
    res.redirect('/login')
  }

}

/* GET home page. */
router.get('/', function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.user) {
    userHelpers.getCartCount(user._id).then((count) => {
      console.log(count)
      cartCount = count
    })
  }
  productHelpers.getAllProducts().then((products) => {
    res.render('user/view-uproducts', { admin: false, products, user, cartCount })

  })
});
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')

  } else {
    res.render('user/login', { 'loginErr': req.session.userLoginErr })
    req.session.userLoginErr = false
  }



})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelpers.getUserData(req.body).then((info) => {
    console.log(info)

    req.session.user = info
    req.session.userLoggedIn = true
    res.redirect('/')
  })

})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {

      req.session.user = response.user
      req.session.userLoggedIn = true
      res.redirect('/')
    } else {
      req.session.userLoginErr = true
      res.redirect('/login')
    }
  })

})
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedin = false
  res.redirect('/')
})
router.get('/cart', verifyLogin, async (req, res) => {

  let cartItems = await userHelpers.getCartProducts(req.session.user._id)
  let totalAmount = 0

  if (cartItems.length > 0) {
    totalAmount = await userHelpers.getTotalAmount(req.session.user._id)
  }

  res.render('user/cart', { user: req.session.user, cartItems, totalAmount })



})
router.get('/add-to-cart/', (req, res) => {
  console.log('call');
  userHelpers.addToCart(req.query.id, req.session.user._id).then(() => {
    res.json({ status: true })
  })
})
router.post('/count-change', async (req, res) => {
  console.log('call');
  console.log(req.body)
  let response = userHelpers.countChange(req.body)
  response.total = await userHelpers.getTotalAmount(req.body.user)
  res.json(response)

})
router.get('/checkout', verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id)

  res.render('user/checkout', { total, user: req.session.user._id })
})
router.post('/place-order', async (req, res) => {
  let products = await userHelpers.getCartProductsList(req.body.userId)
  console.log('hii' + products);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body, products, totalPrice).then((orderId) => {
    if (req.body['payment-method'] == 'COD') {
      res.json({ codSuccess: true })
    } else {
      userHelpers.generateRazorPay(orderId, totalPrice).then((response) => {
        res.json(response)
      })

    }


  })
})
router.post('/verify-payment', (req, res) => {
  userHelpers.verifyPayment(req.body).then(() => {
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
      res.json({ status: true })
    })

  }).catch((err) => {
    res.json({ status: false, errMsg: '' })
  })
})
router.get('/cod-success', (req, res) => {
  res.render('user/cod-success')
})
router.get('/orders', (req, res) => {
  let user=req.session.user._id
  userHelpers.getOrderDetails(user).then((order) => {
    console.log(order);
    res.render('user/orders-list', { user:req.session.user,order})
  })
})

module.exports = router;

