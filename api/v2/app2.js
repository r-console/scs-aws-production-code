// version2
const express = require('express');
const morgan = require('morgan')
const app = express();
const bodyParser = require('body-parser')

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false, limit: '30mb' }))
app.use(bodyParser.json({ limit: '30mb' }))

// mobile routes
const authRoutes = require('./routes/mobile/auth');
const billRoutes = require('./routes/mobile/bill');
const creditBillRoutes = require('./routes/mobile/creditBills');
const dashboardRoutes = require('./routes/mobile/dashboard');
const S3UploadRoutes = require('./routes/mobile/s3uploads');
const searchdRoutes = require('./routes/mobile/search');
const versionRoutes = require('./routes/mobile/version');

// desktop routes
const deskBranch = require('./routes/desktop/branch');
const deskDashboard = require('./routes/desktop/dashboard');
const deskAuth = require('./routes/desktop/deskauth');
const deskBill = require('./routes/desktop/deskbill');
const deskSearch = require('./routes/desktop/desksearch');
const deskEmployee = require('./routes/desktop/employee');
const deskManager = require('./routes/desktop/manager');
const deskPayment = require('./routes/desktop/payment');

// mobile
app.use('/auth', authRoutes);
app.use('/bill', billRoutes);
app.use('/creditBill', creditBillRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/search', searchdRoutes);
app.use('/version', versionRoutes);
app.use('/s3image', S3UploadRoutes)

// desktop
app.use('/deskbranch', deskBranch)
app.use('/deskdashboard', deskDashboard)
app.use('/deskauth', deskAuth)
app.use('/deskbill', deskBill)
app.use('/desksearch', deskSearch)
app.use('/deskemployee', deskEmployee)
app.use('/deskmanager', deskManager)
app.use('/deskpayment', deskPayment)

module.exports = app;