module.exports = {
  apps : [{
    name:"app",
    script: 'app.js',
    instances : 2,
    exec_mode : "cluster",
    out_file:"./ec2.log",
  }],  
};