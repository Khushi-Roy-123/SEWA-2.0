import { db } from "./firebase";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { appointments, records } from "./data";

export const seedDatabase = async () => {
    try {
        console.log("Starting database seed...");

        // Seed Appointments
        const appointmentsCollection = collection(db, "appointments");
        // Optional: Clear existing (be determined) but for now just add

        for (const apt of appointments) {
            await addDoc(appointmentsCollection, {
                ...apt,
                date: apt.date, // Already string, fine for now
                createdAt: new Date()
            });
        }
        console.log("Appointments seeded!");

        // Seed Records
        const recordsCollection = collection(db, "records");
        for (const rec of records) {
            await addDoc(recordsCollection, {
                ...rec,
                createdAt: new Date()
            });
        }
        console.log("Records seeded!");

        alert("Database seeded successfully!");
    } catch (error) {
        console.error("Error seeding database:", error);
        alert("Error seeding database. Check console.");
    }
};
