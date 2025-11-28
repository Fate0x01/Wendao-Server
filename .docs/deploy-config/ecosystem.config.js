module.exports = {
  apps: [
    {
      name: 'login-server',
      script: 'C:\\YunCangServer\\dll-server\\dll-server.exe',
    },
    {
      name: 'app-server',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      log_date_format: 'YYYY-MM-DD HH:mm',
      out_file: './logs/app-server-out.log',
      error_file: './logs/app-server-error.log',
      merge_logs: true,
      watch: ['./dist'],
    },
  ],
}
