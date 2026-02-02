const router = require('express').Router();
const Appointment = require('../models/Appointment');
const verify = require('./verifyToken');

// Get all appointments for the logged-in user
router.get('/', verify, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id }).sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(400).send("Error fetching appointments");
  }
});

// Create a new appointment
router.post('/', verify, async (req, res) => {
  try {
    const { doctor, specialty, date, time, notes } = req.body;

    const newAppointment = new Appointment({
      userId: req.user._id,
      doctor,
      specialty,
      date,
      time,
      notes,
      status: 'Upcoming'
    });

    const savedAppointment = await newAppointment.save();
    res.json(savedAppointment);
  } catch (err) {
    res.status(400).send("Error creating appointment");
  }
});

// Update appointment status (optional, but good to have)
router.patch('/:id', verify, async (req, res) => {
    try {
        const updatedAppointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { $set: req.body },
            { new: true }
        );
        res.json(updatedAppointment);
    } catch (err) {
        res.status(400).send("Error updating appointment");
    }
});

// Delete appointment
router.delete('/:id', verify, async (req, res) => {
    try {
        await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.send("Appointment deleted");
    } catch (err) {
        res.status(400).send("Error deleting appointment");
    }
});

module.exports = router;
