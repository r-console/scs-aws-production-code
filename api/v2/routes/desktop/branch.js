const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

// add branch
router.post('/addbranch',(req, res)=>{
    try{
        console.log('/addbranch url called')
    pool.getConnection((err,connection)=>{
        if(err)throw err;
        console.log(`connected as id ${connection.threadId}`)

        const params=req.body
        connection.query('INSERT INTO branch SET ?',params,(err, rows)=>{
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

// get all branches
router.get('/allbranchs', (req, res) => {
    try{
        console.log('/allbranchs url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('SELECT * FROM branch', (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    if (rows.length != 0) {
                        res.send({branchs:rows,status:200})
                    }
                    else{
                        res.send({status:300})
                    }
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

// update branch name
router.put('/updatebranch', (req, res) => {
    try{
        console.log('/updatebranch url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            const data = req.body.currentBch

            connection.query('UPDATE branch SET branch_name = ?  WHERE id = ?', 
                            [data.branch_name, data.id],
                            (err, rows) => {
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

// delete branch
router.delete('/delbranch/:branchid', (req, res) => {
    try{
        console.log('/delbranch/:branchid url called')
    pool.getConnection((err, connection) => {
        if(!err){
            
            connection.query('DELETE FROM branch WHERE id = ?', [req.params.branchid], (err, rows) => {
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
});

router.get('/branch/:id', (req, res) => {
    try{
        console.log('/branch/:id url called')
        pool.getConnection((err, connection) => {
        if(err) throw err;
        
        connection.query('SELECT branch_name FROM branch WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length != 0) {
                    res.send({branch_name:rows[0].branch_name})
                }
                else{
                    res.send({status:300})
                }
            }
            else{
                console.log(err)
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