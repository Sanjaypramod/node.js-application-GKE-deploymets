// index.js
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('POC 0.4 urolime...')
  // res. send ('sanjay')
})
app.listen(3000, () => console.log('Server is up and running'));
