const express = require("express");
const {
  createUser,
  getUsers,
  updateMe,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(authMiddleware);

// Self-service — must be defined before /:userId so "me" isn't parsed as an id
router.put("/me", updateMe);

// Admin-only
router.post("/", checkRole(["ADMIN"]), createUser);
router.get("/", checkRole(["ADMIN"]), getUsers);
router.put("/:userId", checkRole(["ADMIN"]), updateUser);
router.delete("/:userId", checkRole(["ADMIN"]), deleteUser);

module.exports = router;
