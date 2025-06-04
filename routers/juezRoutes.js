const express = require("express");
const router = express.Router();
const juezController = require("../controllers/juezController");
const { verifyToken, allowRoles } = require("../middlewares/authMiddleware");
const {
  verifyViewToken,
  viewAllowRoles,
} = require("../middlewares/viewAuthMiddleware");

// Dashboard del juez - vista principal (usa middleware de vistas)
router.get(
  "/dashboard",
  verifyViewToken,
  viewAllowRoles("juez"),
  juezController.renderDashboard
);

// Eliminar rutas de cambio de rol

module.exports = router;
