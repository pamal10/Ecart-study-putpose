const { response } = require('express');
var express = require('express');
const { render } = require('../app');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }

}

/* GET home page. */
router.get('/', function (req, res, next) {
  let user = req.session.user
  let cartCount = null
  if (req.session.loggedIn) {
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
  if (req.session.loggedIn) {
    res.redirect('/')

  } else {
    res.render('user/login', { 'loginErr': req.session.loginErr })
    req.session.loginErr = false
  }



})
router.get('/signup', (req, res) => {
  res.render('user/signup')
})
router.post('/signup', (req, res) => {
  userHelpers.getUserData(req.body).then((info) => {
    console.log(info)
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('')
  })

})
router.post('/login', (req, res) => {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.loginErr = true
      res.redirect('/login')
    }
  })

})
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart', verifyLogin, (req, res) => {
  userHelpers.getCartProducts(req.session.user._id).then((cartItems) => {


    res.render('user/cart', { 'user': req.session.user, cartItems })
  })

})
router.get('/add-to-cart/',  (req, res) => {
console.log('call');
  userHelpers.addToCart(req.query.id, req.session.user._id).then(() => {
    res.json({status:true})
  })
})
router.post('/count-change',(req,res)=>{
  console.log('call');
  userHelpers.countChange(req.body.cart,req.body.product,req.body.count,req.body.quantity).then((response)=>{
    res.json(response)
  })
})
router.get('/checkout',verifyLogin, async (req,res)=>{
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  
  res.render('user/checkout',{total})
})


module.exports = router;

