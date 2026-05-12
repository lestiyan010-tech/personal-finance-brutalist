module.exports = {
  apps: [
    {
      name: "brutalbudget",
      cwd: "/home/tik/personal-finance-brutalist",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
