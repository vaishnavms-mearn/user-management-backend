const express =require('express')
const userController=require('../Controllers/userController')
const jwtMiddleware=require('../Middlewares/jwtMiddleware')
const multerConfig=require('../Middlewares/multerMiddlware')
const router =new express.Router()
//1 Register APi routes-localhost:4002/register
router.post('/register',userController.register)
//2 Login APi routes-localhost:4002/login
router.post('/login',userController.login)
//2 Edit User APi routes-localhost:4002/Edit User
router.put('/edit-user/:id',jwtMiddleware,multerConfig.single('userImage'),userController.editUser)
router.get('/get-user/:id',jwtMiddleware,userController.getUser)
router.post('/confirm-mail',userController.resetPassword)
router.post('/reset-password',userController.resetPasswordConfirm)
module.exports=router