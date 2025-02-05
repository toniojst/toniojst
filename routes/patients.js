const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { getPatientVitalSigns, addVitalSigns } = require('../models/patient');

// Funkcija za izračun starosti na podlagi datuma rojstva
function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Funkcija za pridobivanje naslednjega ID-ja
function getNextPatientId() {
  const filePath = path.join(__dirname, '../models/lastPatientId.json');

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ lastId: 10000 }));
    return 10000;
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  const lastId = JSON.parse(data).lastId;
  const newId = lastId + 1;

  fs.writeFileSync(filePath, JSON.stringify({ lastId: newId }));
  return newId;
}

// Nalaganje pacientov iz JSON datoteke
function loadPatients() {
  const filePath = path.join(__dirname, '../models/patientData.json');

  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf-8').trim() === '') {
    fs.writeFileSync(filePath, '[]');
    return [];
  }

  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Shranjevanje pacientov v JSON datoteko
function savePatients(patients) {
  const filePath = path.join(__dirname, '../models/patientData.json');
  fs.writeFileSync(filePath, JSON.stringify(patients, null, 2));
}

// Seznam pacientov
router.get('/', (req, res) => {
  const patients = loadPatients();
  res.render('index', { patients });
});

// Prikaz obrazca za dodajanje pacienta
router.get('/add', (req, res) => {
  res.render('add-patient');
});

// Dodajanje pacienta
router.post('/add', (req, res) => {
  const { firstName, lastName, dob, gender, patientType } = req.body;
  const newPatient = {
    id: getNextPatientId(),
    firstName,
    lastName,
    dob,
    gender,
    age: calculateAge(dob),
    patientType,
  };

  const patients = loadPatients();
  patients.push(newPatient);
  savePatients(patients);
  res.redirect('/patients');
});

// Brisanje pacienta
router.post('/delete/:id', (req, res) => {
  const patients = loadPatients();
  const patientId = parseInt(req.params.id);
  const updatedPatients = patients.filter(patient => patient.id !== patientId);
  savePatients(updatedPatients);
  deletePatientVitalSigns(patientId);
  res.redirect('/patients');
});

// Prikaz pacienta z njegovimi vitalnimi znaki
router.get('/:id', (req, res) => {
  const patients = loadPatients();
  const patientId = parseInt(req.params.id, 10);
  const patient = patients.find(p => p.id === patientId);

  if (patient) {
    res.render('patient-details', {
      patient: patient,
      vitalSigns: getPatientVitalSigns(patientId)
    });
  } else {
    res.render('patient-details', { patient: null });
  }
});

// Dodajanje nove meritve vitalnih znakov
router.post('/:id/vitals', (req, res, io) => {  // Sprejmi `io` kot parameter
    const patientId = req.params.id;
    console.log("Prejeti podatki:", req.body); // Dodaj log za preverjanje prejetih podatkov
	
    // Pošlji podatke vsem povezanim odjemalcem
    io.emit('newVitalSign', req.body);

    const { date, temperature, systolic, diastolic, meanPressure, heartRate, respiratoryRate } = req.body;

    if (!date || !temperature || !systolic || !diastolic || !meanPressure || !heartRate || !respiratoryRate) {
        console.log("Nekaj manjkajočih vrednosti!");
    }

    const newVitalSign = {
        date: date,
        temperature: parseFloat(temperature),
        systolic: parseInt(systolic, 10),
        diastolic: parseInt(diastolic, 10),
        meanPressure: parseInt(meanPressure, 10),
        heartRate: parseInt(heartRate, 10),
        respiratoryRate: parseInt(respiratoryRate, 10)
    };

    addVitalSigns(patientId, newVitalSign);
    res.status(200).send('Vitals data received');
});

module.exports = router;
