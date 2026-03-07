module.exports = {
  apps: [{
    name: 'tool-control-center',
    script: 'dist/index.js',
    cwd: './server',
    env: {
      NODE_ENV: 'production',
    },
    max_restarts: 10,
    restart_delay: 5000,
    watch: false,
  }],
};
