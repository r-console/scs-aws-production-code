// mobile users
const express = require('express');
const router = express.Router();
const { Console } = require('console');
const fs = require("fs");
const pool = require('../../mysqlConfig');

router.post('/addemp',(req, res)=>{
    try{
        pool.getConnection((err,connection)=>{
            if(err)throw err;
            console.log(`connected as id ${connection.threadId}`)

            const params=req.body.employee
            console.log(params)
            connection.query('INSERT INTO employee SET ?',params,(err, rows)=>{
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

// get employees by branch id
router.get('/getemp/:branchid', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('SELECT * FROM employee WHERE branch_id = ?', [req.params.branchid], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({emp:rows,status:200})
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

// update employee details
router.put('/updateemp', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            const data = req.body.currentEmp

            connection.query('UPDATE employee SET employee_name = ?, username= ?, password=?  WHERE id = ?', 
                            [data.employee_name, data.username, data.password, data.id],
                            (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
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

// delete employee by id
router.delete('/deleteemp/:id', (req, res) => {
    try{
        pool.getConnection((err, connection) => {
            if(err) throw err;
            
            connection.query('DELETE FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
                connection.release()    //return the connection to the pool

                if(!err){
                    res.send({status:200})
                }
                else{
                    console.log(err)
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