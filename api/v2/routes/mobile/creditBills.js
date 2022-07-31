const express = require('express');
const router = express.Router();

router.post('/:userId', (req, res, next) => {
    const userId = req.params.userId;
    if(userId == 2){
        res.status(200).json({
            message:`Credit bills ${userId}`
        })
    }
    else{
        res.status(200).json({
            message:"GET request to login"
        })
    }
});

module.exports = router;