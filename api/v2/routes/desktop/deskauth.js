const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.post('/weblogin', (req, res) => {
    try{
        console.log('/weblogin url called')
    pool.getConnection((err, connection) => {
        if(err) throw err;
        
        const { username, password } = req.body

        connection.query('SELECT * FROM admin_table WHERE username = ? AND password = ?', [username, password], (err, rows) => {
            if(!err){
            if(rows.length != 0){
                if(rows[0].account_type == 1){
                    connection.query('SELECT branch_name FROM branch WHERE id = ?', [rows[0].branch_id], (err, data) => {
                        connection.release()    //return the connection to the pool
            
                        if(!err){
                            if(data.length != 0){
                                const userData = {
                                    id: rows[0].id,
                                    name: rows[0].name,
                                    username: rows[0].username,
                                    branch_id: rows[0].branch_id,
                                    account_type: rows[0].account_type,
                                    branch_name: data[0].branch_name
                                }
                                res.send({userData:userData,status:200})
                            }
                            else{
                                res.send({status:400})
                            }
                        }
                        else{
                            res.send({status:300})
                        }
                    })
                }
                else{
                    const userData = {
                        id: rows[0].id,
                        name: rows[0].name,
                        username: rows[0].username,
                        branch_id: rows[0].branch_id,
                        account_type: rows[0].account_type
                    }
                    res.send({userData:userData,status:200})
                }
            }else{
                res.send({status:300})
            }
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

module.exports = router;