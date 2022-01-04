const express = require('express')
const bodyParser = require('body-parser')
const mysql = require('mysql')
const morgan = require('morgan')
// image upload
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })

const { uploadFile, getFileStream, deleteFile } = require('./s3')

const app = express()
app.use(morgan('dev'))
const port = process.env.PORT || 9000

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// MySQL
const pool = mysql.createPool({
    connectionLimit: 10,
    // host:'scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com',
    // user:'scs2021admin',
    // password:'nodejs#$#878',
    // database:'scsappdbservices'

    host:'localhost',
    user:'root',
    password:'',
    database:'SCSbilling'

    // username and password
    // scs2021admin
    // nodejs#$#878
    
    // dbname
    // scsappdbservices

    // aws database
    // host:'scs-appservice-database.cuies1xmg40c.ap-south-1.rds.amazonaws.com',
    // user:'scs2021admin',
    // password:'nodejs#$#878',
    // database:'scsappdbservices'
})

// app login
app.post('/login', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const { username, password } = req.body

        connection.query('SELECT * FROM employee WHERE username = ? AND password = ?', [username, password], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length != 0) {
                    if(rows[0].account_type == 2){
                        const userData = {
                            id: rows[0].id,
                            name: rows[0].employee_name,
                            branch: rows[0].branch_id,
                            last_invoice_id:rows[0].last_invoice_id
                        }
                        res.send({userData:userData,status:200})
                    }
                    else{
                        res.send({status:300})
                    }
                  }else{
                    console.log('Nothing match');
                    res.send({status:300})
                  }
            }
            else{
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// add bill
app.post('/addbill', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const params = req.body

        console.log(params)

        connection.query('INSERT INTO bills SET ?', params.Bill, (err, rows) => {
            // connection.release()    //return the connection to the pool

            const insert_id = rows.insertId

            if(!err){
                connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [params.last_invoice_id, params.Bill.employee_id], (err, rows) => {
                    
                    if(!err){

                        connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                        [params.machineDetails.map(item => [item.machineModel, item.partNo, insert_id ])],
                        (err, mrows) => {
                            connection.release()    //return the connection to the pool
                
                            if(!err){
                                res.send({message:"Successfully inserted bill details and machine details", status:200})
                            }
                            else{
                                console.log(err)
                                res.send({message:"some error", status:500})
                            }
                        })
                    }
                })
                
            }
            else{
                console.log(err)
                res.send({message:"some error", status:500})
            }
        })

    })
})

// add multiple offline billdata
app.post('/addofflinebill', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const params = req.body.offlineBills

        let inserted = 0;

        // console.log(params)
        params.map(item=>{
          connection.query('INSERT INTO bills SET ?', item.Bill, (err, rows) => {
            if(!err){

                let iv_id = item.last_invoice_id;
                let ins_bill_id = rows.insertId;

                connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [iv_id, item.Bill.employee_id], (err, rows) => {
                    if(!err){
                        connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                        [item.machineDetails.map(item => [item.machineModel, item.partNo, ins_bill_id ])],
                        (err, mrows) => {
                            if(err){
                                console.log(err)
                                inserted = 1;
                            }
                        })
                    }
                })
            }
            else{
                console.log(err)
                inserted = 1;
            }
        })  
        })

        if(inserted == 0){
            res.send({message:"Successfully inserted bill details and machine details", status:200})
        }
        else{
            res.send({message:"some error", status:500})
        }

    })
})

// update last invoice id
app.put('/updateinvoice', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const { employee_id, last_invoice_id } = req.body

        connection.query('UPDATE employee SET last_invoice_id = ? WHERE id = ?', [last_invoice_id, employee_id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send({status:200})
            }
            else{
                console.log(err)
            }
        })
    })
})

// branch
app.get('/branch/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

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
})

// get employee bills data for dashboard
app.get('/dashboard/total/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT id FROM bills WHERE employee_id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                const total = rows.length;
                res.send({total:total})
            }
            else{
                console.log(err)
            }
        })
    })
})

app.get('/dashboard/month/:id/:month', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT id FROM bills WHERE employee_id = ? AND MONTH(bill_date) = ?', [req.params.id, req.params.month], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                const total = rows.length;
                res.send({total:total})
            }
            else{
                console.log(err)
            }
        })
    })
})

app.get('/dashboard/today/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT id FROM bills WHERE employee_id = ? AND DATE(bill_date) = CURDATE()', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                const total = rows.length;
                res.send({total:total})
            }
            else{
                console.log(err)
            }
        })
    })
})

// get all records
app.get('/lastservices/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT customer_name, customer_phoneno, invoice_id ,bill_date FROM bills WHERE (employee_id = ? AND bill_date BETWEEN NOW() - INTERVAL 30 DAY AND NOW() ) ORDER BY id DESC', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send(rows)
            }
            else{
                console.log(err)
            }
        })
    })
})

// get searched record from post method
app.post('/getbill/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        console.log(req.body)

        connection.query('SELECT * FROM bills WHERE customer_phoneno = ? OR invoice_id = ?', [req.body.search,req.body.search], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
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
    })
})

// get blob file s_sign
app.get('/getsersign/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        console.log('s_sign called')
        connection.query('SELECT s_sign FROM bills WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                console.log('s_sign work fine')
                res.send(rows[0].s_sign)
            }
            else{
                console.log('s_sign error')
                console.log(err)
            }
        })
    })
})

// get blob file c_sign
app.get('/getcussign/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        console.log('c_sign called')
        connection.query('SELECT c_sign FROM bills WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send(rows[0].c_sign)
            }
            else{
                console.log(err)
            }
        })
    })
})

// get machine derails
app.get('/getmachinedetails/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT * FROM machine WHERE bill_id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                res.send(rows)
            }
            else{
                console.log(err)
            }
        })
    })
})

// web login
app.post('/weblogin', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const { username, password } = req.body

        connection.query('SELECT * FROM employee WHERE username = ? AND password = ? ', [username, password], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length != 0) {
                    const userData = {
                        id: rows[0].id,
                        name: rows[0].employee_name,
                        branch: rows[0].branch_id,
                        account_type: rows[0].account_type
                    }
                    res.send(userData)
                  }else{
                    console.log('Nothing match');
                  }
            }
            else{
                console.log(err)
            }
        })

        console.log(req.body)
    })
})

// add branch manager
app.post('/addmanager',(req, res)=>{
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
})

app.listen(port, ()=>{
    console.log(`Listen on port ${port}`)
})