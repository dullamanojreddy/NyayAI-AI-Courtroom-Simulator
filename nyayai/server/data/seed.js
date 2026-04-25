require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Law = require('../models/Law');
const Scheme = require('../models/Scheme');

const lawsPath = path.join(__dirname, 'ipcSections.json');
const schemesPath = path.join(__dirname, 'schemes.json');

function readJson(filePath, callback) {
  fs.readFile(filePath, 'utf8', (error, content) => {
    if (error) {
      callback(error);
      return;
    }

    try {
      const parsed = JSON.parse(content);
      callback(null, parsed);
    } catch (parseError) {
      callback(parseError);
    }
  });
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nyayai');

    const laws = await new Promise((resolve, reject) => {
      readJson(lawsPath, (error, data) => {
        if (error) return reject(error);
        return resolve(data);
      });
    });

    const schemes = await new Promise((resolve, reject) => {
      readJson(schemesPath, (error, data) => {
        if (error) return reject(error);
        return resolve(data);
      });
    });

    await Law.deleteMany({});
    await Scheme.deleteMany({});

    await Law.insertMany(laws);
    await Scheme.insertMany(schemes);

    const lawsCount = await Law.countDocuments();
    const schemesCount = await Scheme.countDocuments();

    console.log(`Laws count: ${lawsCount}`);
    console.log(`Schemes count: ${schemesCount}`);
    console.log('? Database seeded successfully');
  } catch (error) {
    console.error('Seeding error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
