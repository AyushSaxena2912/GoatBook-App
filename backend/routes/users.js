const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET api/users/profile
router.get('/profile', auth, userController.getProfile);

// @route   PUT api/users/profile
router.put('/profile', auth, userController.updateProfile);

// @route   POST api/users/change-password
router.post('/change-password', auth, userController.changePassword);

// @route   POST api/users/push-token
router.post('/push-token', auth, userController.updatePushToken);

// --- Employee Management (Owner Scoped) ---

// @route   GET api/users/employees
router.get('/employees', auth, userController.getEmployees);

// @route   POST api/users/employees
router.post('/employees', auth, userController.createEmployee);

// @route   PUT api/users/employees/:id
router.put('/employees/:id', auth, userController.updateEmployee);

// @route   PUT api/users/employees/:id/status
router.put('/employees/:id/status', auth, userController.updateEmployeeStatus);

// @route   POST api/users/employees/:id/reset-password
router.post('/employees/:id/reset-password', auth, userController.resetEmployeePassword);

module.exports = router;
