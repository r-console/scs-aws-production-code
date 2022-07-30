const express = require('express');
const router = express.Router();

router.post('/login', (req, res, next) => {
    res.status(200).json({
        message:"GET request to login"
    })
});

module.exports = router;