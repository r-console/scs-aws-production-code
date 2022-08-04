const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

// add branch manager
router.post('/addmanager',(req, res)=>{
    try{
        console.log('/addmanager url called')
        pool.getConnection((err,connection)=>{
            if(err)throw err;
            console.log(`connected as id ${connection.threadId}`)

            const params=req.body
            connection.query('INSERT INTO admin_table SET ?',params,(err, rows)=>{
                connection.release();
                if(!err)
                {
                    res.send({status:200})
                }
                else{
                    res.send({status:300})
                }
            })
        })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({status:300})
    }
})

router.put('/updatemanager', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(!err){
            
            const data = req.body.currentMng

            connection.query('UPDATE admin_table SET name = ?, username= ?, password=?  WHERE id = ?', 
                            [data.name, data.username, data.password, data.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
                }
                else{
                    console.log(err)
                }
            })
        }else{
            res.send({msg:'Database not connected',status:300})
            console.log('Database not connected')
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

// delete manager
router.delete('/delmanager/:managerid', (req, res) => {
    try{
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('DELETE FROM admin_table WHERE id = ?', [req.params.managerid], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
                }
                else{
                    console.log(err)
                    res.send({status:300})
                }
            })
        }else{
            res.send({msg:'Database not connected',status:300})
            console.log('Database not connected')
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

module.exports = router;