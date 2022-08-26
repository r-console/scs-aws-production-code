const express = require("express")
const router = express.Router()
const { Console } = require("console")
const fs = require("fs")
const { v4: uuidv4 } = require("uuid")
const pool = require("../../mysqlConfig")

const { param } = require("express/lib/request")

const {
  uploadFile,
  getFileStream,
  deleteFile,
  uploadBase64,
} = require("../../s3")

router.post("/addbill", (req, res, next) => {
  try {
    console.log("/addbill url called")
    pool.getConnection(async (err, connection) => {
      if (err) throw err

      const params = req.body

      const Sersign = param.s_sign
      const Cussign = param.c_sign

      let s_sign_name = uuidv4()
      let c_sign_name = uuidv4()

      buf1 = Buffer.from(
        req.body.Bill.s_sign.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      )
      const result1 = await uploadBase64(buf1, s_sign_name)
      if (result1 === 0) {
        buf2 = Buffer.from(
          req.body.Bill.c_sign.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        )
        const result2 = await uploadBase64(buf2, c_sign_name)
        if (result2 === 0) {
          params.Bill.s_sign = s_sign_name
          params.Bill.c_sign = c_sign_name
          params.Bill.payment_status = "PENDING"

          if (
            params.Bill.customer_phoneno == 0 ||
            params.Bill.customer_phoneno == "0" ||
            params.Bill.customer_phoneno == ""
          ) {
            params.Bill.customer_phoneno = null
          }
          connection.query(
            "INSERT INTO bills SET ?",
            params.Bill,
            (err, rows) => {
              // connection.release()    //return the connection to the pool

              const insert_id = rows.insertId

              if (!err) {
                // add bill locations
                connection.query(
                  "UPDATE employee SET last_invoice_id = ? WHERE id = ?",
                  [params.last_invoice_id, params.Bill.employee_id],
                  (err, rows) => {
                    if (!err) {
                      connection.query(
                        "INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?",
                        [
                          params.machineDetails.map((item) => [
                            item.machineModel,
                            item.partNo,
                            insert_id,
                          ]),
                        ],
                        (err, mrows) => {
                          if (!err) {
                            if (req.body.bill_location) {
                              const { bill_location } = req.body
                              const loc_data = {
                                lat: bill_location.latitude,
                                lng: bill_location.longitude,
                                bill_id: insert_id,
                                emp_id: params.Bill.employee_id,
                              }
                              connection.query(
                                "INSERT INTO billing_locations SET ?",
                                loc_data,
                                (err, loc) => {
                                  if (!err) {
                                    if (
                                      item.Bill.payment_method ===
                                      "Calls Pending"
                                    ) {
                                      const pend = {
                                        bill_id: insert_id,
                                        status: "pending",
                                      }
                                      connection.query(
                                        "INSERT INTO callspending_update SET ?",
                                        pend,
                                        (finerr, fin) => {
                                          if (!finerr) {
                                            connection.release() //return the connection to the pool
                                            res.send({
                                              message:
                                                "Successfully inserted bill details and machine details",
                                              status: 200,
                                            })
                                          } else {
                                            console.log(err)
                                            res.send({
                                              message: "some error",
                                              status: 500,
                                            })
                                          }
                                        }
                                      )
                                    } else {
                                      connection.release()
                                      res.send({
                                        message:
                                          "Successfully inserted bill details and machine details",
                                        status: 200,
                                      })
                                    }
                                  } else {
                                    console.log(err)
                                    res.send({
                                      message: "some error",
                                      status: 500,
                                    })
                                  }
                                }
                              )
                            } else {
                              connection.release() //return the connection to the pool
                              res.send({
                                message:
                                  "Successfully inserted bill details and machine details",
                                status: 200,
                              })
                            }
                          } else {
                            console.log(err)
                            res.send({ message: "some error", status: 500 })
                          }
                        }
                      )
                    } else {
                      console.log(err)
                      res.send({ message: "some error", status: 500 })
                    }
                  }
                )
              } else {
                console.log(err)
                res.send({ message: "some error", status: 500 })
              }
            }
          )
        } else {
        }
      } else {
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

// add multiple offline billdata
router.post("/addofflinebill", (req, res, next) => {
  try {
    console.log("/addofflinebill url called")
    pool.getConnection((err, connection) => {
      if (err) throw err

      const params = req.body.offlineBills
      let inserted = 0
      // console.log(params)
      params.map(async (item) => {
        let s_sign_name = uuidv4()
        let c_sign_name = uuidv4()

        buf1 = Buffer.from(
          item.Bill.s_sign.replace(/^data:image\/\w+;base64,/, ""),
          "base64"
        )
        const result1 = await uploadBase64(buf1, s_sign_name)
        if (result1 === 0) {
          buf2 = Buffer.from(
            item.Bill.c_sign.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
          )
          const result2 = await uploadBase64(buf2, c_sign_name)
          if (result2 === 0) {
            item.Bill.s_sign = s_sign_name
            item.Bill.c_sign = c_sign_name
            item.Bill.payment_status = "PENDING"

            connection.query(
              "INSERT INTO bills SET ?",
              item.Bill,
              (err, rows) => {
                if (!err) {
                  let iv_id = item.last_invoice_id
                  let ins_bill_id = rows.insertId

                  connection.query(
                    "UPDATE employee SET last_invoice_id = ? WHERE id = ?",
                    [iv_id, item.Bill.employee_id],
                    (err, rows) => {
                      if (!err) {
                        connection.query(
                          "INSERT INTO machine (machineModel, partNo, bill_id) VALUES ?",
                          [
                            item.machineDetails.map((item) => [
                              item.machineModel,
                              item.partNo,
                              ins_bill_id,
                            ]),
                          ],
                          (errr, mrows) => {
                            if (!errr) {
                              if (req.body.bill_location) {
                                const { bill_location } = req.body
                                const loc_data = {
                                  lat: bill_location.latitude,
                                  lng: bill_location.longitude,
                                  bill_id: insert_id,
                                  emp_id: params.Bill.employee_id,
                                }
                                connection.query(
                                  "INSERT INTO billing_locations SET ?",
                                  loc_data,
                                  (err, loc) => {
                                    if (!err) {
                                      if (
                                        item.Bill.payment_method ===
                                        "Calls Pending"
                                      ) {
                                        const pend = {
                                          bill_id: insert_id,
                                          status: "pending",
                                        }
                                        connection.query(
                                          "INSERT INTO callspending_update SET ?",
                                          pend,
                                          (finerr, fin) => {
                                            if (!finerr) {
                                              connection.release() //return the connection to the pool
                                              res.send({
                                                message:
                                                  "Successfully inserted bill details and machine details",
                                                status: 200,
                                              })
                                            } else {
                                              console.log(err)
                                              res.send({
                                                message: "some error",
                                                status: 500,
                                              })
                                            }
                                          }
                                        )
                                      } else {
                                        connection.release() //return the connection to the pool
                                        res.send({
                                          message:
                                            "Successfully inserted bill details and machine details",
                                          status: 200,
                                        })
                                      }
                                    } else {
                                      console.log(err)
                                      res.send({
                                        message: "some error",
                                        status: 500,
                                      })
                                    }
                                  }
                                )
                              } else {
                                //else need to remove after app update with location
                                connection.release() //return the connection to the pool
                                res.send({
                                  message:
                                    "Successfully inserted bill details and machine details",
                                  status: 200,
                                })
                              }
                            }
                          }
                        )
                      }
                    }
                  )
                } else {
                  console.log(err)
                  inserted = 1
                }
              }
            )
          }
        }
      })

      if (inserted == 0) {
        res.send({
          message: "Successfully inserted bill details and machine details",
          status: 200,
        })
      } else {
        res.send({ message: "some error", status: 500 })
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

// update last invoice id
router.put("/updateinvoice", (req, res) => {
  try {
    console.log("/updateinvoice url called")
    pool.getConnection((err, connection) => {
      if (err) throw err

      const { employee_id, last_invoice_id } = req.body

      connection.query(
        "UPDATE employee SET last_invoice_id = ? WHERE id = ?",
        [last_invoice_id, employee_id],
        (err, rows) => {
          connection.release() //return the connection to the pool

          if (!err) {
            res.send({ status: 200 })
          } else {
            console.log(err)
          }
        }
      )
    })
  } catch (error) {
    console.log(error)
    res.status(500).send({ status: 300 })
  }
})

module.exports = router
