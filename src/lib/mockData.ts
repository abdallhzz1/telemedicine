import {
    collection,
    addDoc,
    setDoc,
    doc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export async function seedMockData(currentUserUid?: string, currentRole?: string, profile?: any) {
    console.log("Starting mock data seeding...");

    try {
        const targetPatientId = currentRole === 'patient' && currentUserUid ? currentUserUid : "patient_demo_123";
        const targetDoctorId = currentRole === 'doctor' && currentUserUid ? currentUserUid : "doctor_demo_456";
        const targetLabId = currentRole === 'lab' && currentUserUid ? currentUserUid : "lab_demo_789";

        // 1. Seed Users
        const users = [
            {
                uid: "patient_demo_123",
                fullName: "Ahmad Patient",
                email: "patient@demo.com",
                role: "patient",
                status: "active",
                createdAt: serverTimestamp(),
            },
            {
                uid: "doctor_demo_456",
                fullName: "Dr. Salem Mohammed",
                email: "doctor@demo.com",
                role: "doctor",
                status: "active",
                specialization: "Cardiology",
                createdAt: serverTimestamp(),
            },
            {
                uid: "lab_demo_789",
                fullName: "Hebron Central Lab",
                email: "lab@demo.com",
                role: "lab",
                status: "active",
                labName: "Hebron Central Lab",
                createdAt: serverTimestamp(),
            },
            {
                uid: "admin_demo_000",
                fullName: "System Administrator",
                email: "admin@demo.com",
                role: "admin",
                status: "active",
                createdAt: serverTimestamp(),
            }
        ];

        for (const user of users) {
            if (user.uid !== currentUserUid) {
                await setDoc(doc(db, 'users', user.uid), user);
            }
        }

        // 2. Seed Appointments
        const appointments = [
            {
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? (profile?.fullName || "Dr. Salem") : "Dr. Salem Mohammed",
                patientId: targetPatientId,
                patientName: currentRole === 'patient' ? (profile?.fullName || "Ahmad") : "Ahmad Patient",
                dateTime: Timestamp.fromDate(new Date(Date.now() + 86400000)), // Tomorrow
                status: "upcoming",
                notes: "Regular heart checkup",
                createdAt: serverTimestamp(),
            },
            {
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? (profile?.fullName || "Dr. Salem") : "Dr. Salem Mohammed",
                patientId: targetPatientId,
                patientName: "Ali Patient",
                dateTime: Timestamp.fromDate(new Date(Date.now() + 172800000)), // Day after
                status: "upcoming",
                notes: "Flu symptoms",
                createdAt: serverTimestamp(),
            },
            {
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? (profile?.fullName || "Dr. Salem") : "Dr. Salem Mohammed",
                patientId: targetPatientId,
                patientName: currentRole === 'patient' ? (profile?.fullName || "Ahmad") : "Ahmad Patient",
                dateTime: Timestamp.fromDate(new Date(Date.now() - 86400000)), // Yesterday
                status: "completed",
                notes: "Follow-up for previous visit",
                createdAt: serverTimestamp(),
            }
        ];

        for (const appt of appointments) {
            await addDoc(collection(db, 'appointments'), appt);
        }

        // 3. Seed Lab Requests & Results
        const labRequests = [
            {
                patientId: targetPatientId,
                patientName: currentRole === 'patient' ? profile?.fullName : "Ahmad Patient",
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? profile?.fullName : "Dr. Salem Mohammed",
                labId: targetLabId,
                labName: currentRole === 'lab' ? (profile?.labName || profile?.fullName) : "Hebron Central Lab",
                testType: "Blood Test",
                notes: "New request",
                status: "new",
                createdAt: serverTimestamp(),
            },
            {
                patientId: targetPatientId,
                patientName: currentRole === 'patient' ? profile?.fullName : "Ali Patient",
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? profile?.fullName : "Dr. Salem Mohammed",
                labId: targetLabId,
                labName: currentRole === 'lab' ? (profile?.labName || profile?.fullName) : "Hebron Central Lab",
                testType: "X-Ray",
                notes: "In progress test",
                status: "in_progress",
                createdAt: serverTimestamp(),
            },
            {
                patientId: targetPatientId,
                patientName: currentRole === 'patient' ? profile?.fullName : "Sara Patient",
                doctorId: targetDoctorId,
                doctorName: currentRole === 'doctor' ? profile?.fullName : "Dr. Salem Mohammed",
                labId: targetLabId,
                labName: currentRole === 'lab' ? (profile?.labName || profile?.fullName) : "Hebron Central Lab",
                testType: "Glucose",
                notes: "Ready request",
                status: "ready",
                createdAt: serverTimestamp(),
            }
        ];

        for (const req of labRequests) {
            const docRef = await addDoc(collection(db, 'labRequests'), req);
            if (req.status === 'ready') {
                await addDoc(collection(db, 'labResults'), {
                    requestId: docRef.id,
                    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    uploadedAt: serverTimestamp(),
                });
            }
        }

        // 4. Seed Prescriptions
        await addDoc(collection(db, 'prescriptions'), {
            patientId: targetPatientId,
            patientName: currentRole === 'patient' ? (profile?.fullName || "Ahmad") : "Ahmad Patient",
            doctorId: targetDoctorId,
            doctorName: currentRole === 'doctor' ? (profile?.fullName || "Dr. Salem") : "Dr. Salem Mohammed",
            createdAt: serverTimestamp(),
            medicines: [
                { name: "Aspirin", dose: "100mg", duration: "7 days", notes: "Take after breakfast" },
                { name: "Panadol", dose: "500mg", duration: "3 days", notes: "If fever persists" }
            ]
        });

        // 5. Seed Policies
        const policies = [
            {
                title: "Privacy Policy",
                content: "This application values your medical privacy.",
                createdAt: serverTimestamp(),
            }
        ];

        for (const policy of policies) {
            await addDoc(collection(db, 'policies'), policy);
        }

        console.log("Mock data seeding completed successfully.");
        return true;
    } catch (error) {
        console.error("Error seeding mock data:", error);
        throw error;
    }
}
