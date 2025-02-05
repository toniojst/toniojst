const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/vitalSigns.json');

// Funkcija za pridobivanje vitalnih znakov pacienta
function getPatientVitalSigns(patientId) {
    if (!fs.existsSync(filePath)) {
        return [];
    }

    const vitalSignsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    return vitalSignsData[patientId] || [];
}

// Funkcija za dodajanje nove meritve vitalnih znakov
function addVitalSigns(patientId, newVitalSign) {
    let vitalSignsData = {};

    // Če datoteka obstaja, jo preberemo
    if (fs.existsSync(filePath)) {
        vitalSignsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    // Če pacient že ima meritve, jih dodamo v seznam
    if (!vitalSignsData[patientId]) {
        vitalSignsData[patientId] = [];
    }

    vitalSignsData[patientId].push(newVitalSign); // Dodaj novo meritev

    // Shranimo posodobljen seznam nazaj v JSON datoteko
    fs.writeFileSync(filePath, JSON.stringify(vitalSignsData, null, 2));
}

// models/patient.js
function deletePatientVitalSigns(patientId) {
    let vitalSignsData = {};

    if (fs.existsSync(filePath)) {
        vitalSignsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }

    if (vitalSignsData[patientId]) {
        delete vitalSignsData[patientId];
        fs.writeFileSync(filePath, JSON.stringify(vitalSignsData, null, 2));
    }
}

module.exports = { getPatientVitalSigns, addVitalSigns, deletePatientVitalSigns };