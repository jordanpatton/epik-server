module.exports = {
  
  db: process.env.MONGODB|| 'mongodb://localhost:27017/epik',
  
  sessionSecret: process.env.SESSION_SECRET || 'secret',
  
  gmail: {
    user: process.env.GMAIL_USER || 'user@gmail.com',
    password: process.env.GMAIL_PASSWORD || 'password'
  },
  
};
