const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const patientRoutes = require('./routes/patients');



const app = express();
const port = 3000;

// Ustvari HTTP strežnik
const server = http.createServer(app);

// Nastavi socket.io na strežnik
const io = socketIo(server);

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Add this line to support JSON parsing
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }));

// Osnovna pot za glavno stran
app.get('/', (req, res) => {
  res.redirect('/patients');
});

// Delo s pacienti
app.use('/patients', patientRoutes);

// Povezava z odjemalcem (stran pacienta)
io.on('connection', (socket) => {
  console.log('Nov odjemalec povezan');

  // Pošlji posodobljene podatke o vitalnih znakih
  socket.on('updateVitals', (data) => {
	  console.log('***************************');
	  console.log(data);
	  
    io.emit('newVitalSign', data);  // Pošlji podatke vsem povezanim odjemalcem
  });
});

// Zaženi strežnik
server.listen(port, () => {
  console.log(`Sistem deluje na http://localhost:${port}`);
});
