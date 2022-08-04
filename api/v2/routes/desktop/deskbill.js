const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.delete('/delbill/:billid', (req, res) => {
    try{
        console.log('/delbill/:billid url called')
    pool.getConnection((err, connection) => {
        if(!err){
            connection.query('SELECT * FROM bills WHERE id = ?', [req.params.billid], (err, bill) => {
                if(!err){
                    
                    // await deleteFile(bill[0].s_sign)
                    // await deleteFile(bill[0].c_sign)

                    connection.query('DELETE FROM machine WHERE bill_id = ?', [req.params.billid], (err, rows) => {
                        
                        if(!err){
                            connection.query('DELETE FROM bills WHERE id = ?', [req.params.billid], (err, rows) => {
                                connection.release()    //return the connection to the pool
                
                                if(!err){
                                    res.send({status:200})
                                }
                                else{
                                    console.log(err)
                                    res.send({status:300})
                                }
                            })
                        }
                        else{
                            console.log(err)
                            res.send({status:300})
                        }
                    })
                }else{
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

router.post('/getadminbill', (req, res) => {
    try{
        console.log('/getadminbill url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        console.log(req.body)

        if(req.body.search != '')
        {
            connection.query(`SELECT * FROM bills WHERE invoice_id = ?`, 
                            [req.body.search], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                console.log(rows)
                if (rows.length != 0) {
                    res.send(rows[0])
                }
                else{
                    res.send({status:300})
                }
            }
            else{
                console.log(err)
                res.send({status:300})
            }
        })
        }
        else{
            res.send({status:300})
        }
    })
}
catch (error) {
    console.log(error)
    res.status(500).send({status:300})
}
})

module.exports = router;