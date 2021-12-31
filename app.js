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
    host:'localhost',
    user:'root',
    password:'',
    database:'SCSbilling'

    // aws database
    // host:'scs-service.cglbjoi49zmb.ap-south-1.rds.amazonaws.com',
    // user:'admin',
    // password:'qwert54321',
    // database:'scsservice'
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
                if (rows.length !== 0) {
                    if(rows[0].account_type == 2){
                        const userData = {
                            id: rows[0].id,
                            name: rows[0].employee_name,
                            branch: rows[0].branch_id,
                        }
                        res.send({userData:userData,status:200})
                    }
                    else{
                        res.send({status:300})
                    }
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

// add bill
app.post('/addbill', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const params = req.body

        console.log(params)

        connection.query('INSERT INTO bills SET ?', params.Bill, (err, rows) => {
            // connection.release()    //return the connection to the pool

            if(!err){

                // db.query(
                //     'INSERT INTO my_table (name, description, value) VALUES ?',
                //     [items.map(item => [item.name, item.description, item.value])],
                //     (error, results) => {...}
                // );

                connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                [params.machineDetails.map(item => [item.machineModel, item.partNo, rows.insertId ])],
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

                connection.query('INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?', 
                [item.machineDetails.map(item => [item.machineModel, item.partNo, rows.insertId ])],
                (err, mrows) => {
                    if(err){
                        console.log(err)
                        inserted = 1;
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

// branch
app.get('/branch/:id', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        connection.query('SELECT branch_name FROM branch WHERE id = ?', [req.params.id], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length !== 0) {
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

        connection.query('SELECT customer_name, customer_phoneno, bill_date FROM bills WHERE (employee_id = ? AND bill_date BETWEEN NOW() - INTERVAL 30 DAY AND NOW() ) ORDER BY id DESC', [req.params.id], (err, rows) => {
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
app.post('/login', (req, res) => {
    pool.getConnection((err, connection) => {
        if(err) throw err;
        console.log(`connected ${connection.threadId}`)

        const { username, password } = req.body

        connection.query('SELECT * FROM employee WHERE username = ? AND password = ?', [username, password], (err, rows) => {
            connection.release()    //return the connection to the pool

            if(!err){
                if (rows.length !== 0) {
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

app.listen(port, ()=>{
    console.log(`Listen on port ${port}`)
})

// // upload image to s3 bucket
// app.post('/images', upload.single('file'), async(req,res)=> {
//     const file = req.file
//     console.log(file)
//     const result = await uploadFile(file)
//     await unlinkFile(file.path)
//     console.log(result)
//     // const description = req.body.description
//     res.send({ imagePath: `images/${result.Key}` })
//     // res.send("jo");
// })

// // get image from s3
// app.get('/images/:key', (req, res)=>{
//     const key = req.params.key
//     const readStream = getFileStream(key)
//     readStream.pipe(res)
// })

// // delete image in s3
// app.get('/deleteimage/:key', async (req, res)=>{
//     const key = req.params.key
//     const result = await deleteFile(key)
//     console.log(result)
//     res.send(result)
// })

// // get all records
// app.get('', (req, res) => {
//     pool.getConnection((err, connection) => {
//         if(err) throw err;
//         console.log(`connected ${connection.threadId}`)

//         connection.query('SELECT * FROM employee', (err, rows) => {
//             connection.release()    //return the connection to the pool

//             if(!err){
//                 res.send(rows)
//             }
//             else{
//                 console.log(err)
//             }
//         })
//     })
// })

// // get by id
// app.get('/:id', (req, res) => {
//     pool.getConnection((err, connection) => {
//         if(err) throw err;
//         console.log(`connected ${connection.threadId}`)

//         connection.query('SELECT * FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
//             connection.release()    //return the connection to the pool

//             if(!err){
//                 res.send(rows)
//             }
//             else{
//                 console.log(err)
//             }
//         })
//     })
// })

// // delete a record
// app.delete('/:id', (req, res) => {
//     pool.getConnection((err, connection) => {
//         if(err) throw err;
//         console.log(`connected ${connection.threadId}`)

//         connection.query('DELETE FROM employee WHERE id = ?', [req.params.id], (err, rows) => {
//             connection.release()    //return the connection to the pool

//             if(!err){
//                 res.send(`Employee record deleted. Record ID ${req.params.id}`)
//             }
//             else{
//                 console.log(err)
//             }
//         })
//     })
// })

// // add record
// app.post('', (req, res) => {
//     pool.getConnection((err, connection) => {
//         if(err) throw err;
//         console.log(`connected ${connection.threadId}`)

//         const params = req.body

//         connection.query('INSERT INTO employee SET ?', params, (err, rows) => {
//             connection.release()    //return the connection to the pool

//             if(!err){
//                 res.send("Inserted")
//             }
//             else{
//                 console.log(err)
//             }
//         })

//         console.log(req.body)
//     })
// })

// // update a record
// app.put('', (req, res) => {
//     pool.getConnection((err, connection) => {
//         if(err) throw err;
//         console.log(`connected ${connection.threadId}`)

//         const { id, name, branch, username, password } = req.body

//         connection.query('UPDATE employee SET name = ? WHERE id = ?', [name, id], (err, rows) => {
//             connection.release()    //return the connection to the pool

//             if(!err){
//                 res.send(`Updated ${name}`)
//             }
//             else{
//                 console.log(err)
//             }
//         })

//         console.log(req.body)
//     })
// })
