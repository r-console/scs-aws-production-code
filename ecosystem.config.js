module.exports = {
  apps : [{
    name:"app",
    script: 'app.js',
    watch: '.',
    instances : "max",
    exec_mode : "cluster",
    out_file:"./ec2.log"
  }],
};
