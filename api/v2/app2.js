// version2
const express = require('express');
const morgan = require('morgan')
const app = express();
const bodyParser = require('body-parser')

app.use(morgan('dev'));
// app.use(bodyParser.urlencoded({ extended: false, limit: '30mb' }))
// app.use(bodyParser.json({ limit: '30mb' }))

// routes
const authRoutes = require('./routes/mobile/auth');
const creditBillRoutes = require('./routes/mobile/creditBills');

app.use('/auth', authRoutes);
app.use('/creditBill', creditBillRoutes);

module.exports = app;