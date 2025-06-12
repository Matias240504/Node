const express=require('express');
const router=express.Router();
const { listar, marcarLeida }=require('../controllers/notificacionController');
const { verifyToken, allowRoles }=require('../middlewares/authMiddleware');

router.get('/notificaciones', verifyToken, allowRoles('cliente'), (req,res)=>{
  res.render('cliente/notificaciones',{user:req.user, currentPath:'/cliente/notificaciones'});
});

router.get('/api/notificaciones', verifyToken, allowRoles('cliente'), listar);
router.patch('/api/notificaciones/:id/leido', verifyToken, allowRoles('cliente'), marcarLeida);

module.exports=router;
