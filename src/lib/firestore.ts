import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  QueryConstraint,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Date;
  doctorName?: string;
  patientName?: string;
}

export interface DoctorAvailability {
  doctorId: string;
  weeklySlots: {
    [key: string]: string[]; // e.g., "monday": ["09:00", "09:30"]
  };
  updatedAt: Date;
}

export interface LabRequest {
  id: string;
  patientId: string;
  doctorId: string;
  labId: string;
  testType: string;
  notes?: string;
  status: 'new' | 'in_progress' | 'ready' | 'rejected';
  createdAt: Date;
  patientName?: string;
  doctorName?: string;
  labName?: string;
}

export interface LabResult {
  id: string;
  requestId: string;
  fileUrl: string;
  publicId?: string;
  resourceType?: 'image' | 'raw';
  uploadedAt: Date;
  editedReason?: string;
  updatedAt?: Date;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medicines: Medicine[];
  createdAt: Date;
  patientName?: string;
  doctorName?: string;
}

export interface Medicine {
  name: string;
  dose: string;
  duration: string;
  notes?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
}

export interface Policy {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Upload {
  id: string;
  patientId: string;
  doctorId?: string;
  fileUrl: string;
  fileType: string;
  publicId?: string;
  resourceType?: 'image' | 'raw';
  note?: string;
  createdAt: Date;
}

export interface VideoRoom {
  id: string;
  appointmentId: string;
  isActive: boolean;
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper to convert Firestore timestamp
function convertTimestamp(timestamp: any): Date {
  if (!timestamp) return new Date();
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'number') return new Date(timestamp);
  return new Date();
}

// Appointments
export async function getAppointments(
  userId: string,
  role: 'doctor' | 'patient',
  statusFilter?: string,
  limitCount: number = 50
): Promise<Appointment[]> {
  const constraints: QueryConstraint[] = [
    where(role === 'doctor' ? 'doctorId' : 'patientId', '==', userId),
    limit(limitCount)
  ];

  // Temporarily removing orderBy to avoid composite index requirement
  // constraints.push(orderBy('dateTime', 'desc'));

  if (statusFilter && statusFilter !== 'all') {
    constraints.splice(1, 0, where('status', '==', statusFilter));
  }

  try {
    const q = query(collection(db, 'appointments'), ...constraints);
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} appointments for ${userId} with role ${role}`);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateTime: convertTimestamp(doc.data().dateTime),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as Appointment[];
  } catch (error) {
    console.error('getAppointments error:', error, { userId, role });
    throw error;
  }
}

export async function getUpcomingAppointments(userId: string, role: 'doctor' | 'patient', limitCount: number = 5): Promise<Appointment[]> {
  const now = new Date();
  try {
    const q = query(
      collection(db, 'appointments'),
      where(role === 'doctor' ? 'doctorId' : 'patientId', '==', userId),
      where('status', '==', 'upcoming'),
      // orderBy('dateTime', 'asc'), // Removing orderBy to avoid index requirement
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} upcoming appointments for ${userId}`);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateTime: convertTimestamp(doc.data().dateTime),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as Appointment[];
  } catch (error) {
    console.error('getUpcomingAppointments error:', error);
    throw error;
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), { status });
    console.log(`Appointment ${appointmentId} status updated to ${status}`);
  } catch (error) {
    console.error(`updateAppointmentStatus error for ${appointmentId}:`, error);
    throw error;
  }
}

export async function createAppointment(data: Omit<Appointment, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...data,
      dateTime: Timestamp.fromDate(data.dateTime),
      createdAt: serverTimestamp(),
    });
    console.log(`Appointment created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('createAppointment error:', error);
    throw error;
  }
}

// Doctor Availability
export async function updateDoctorAvailability(doctorId: string, weeklySlots: Record<string, string[]>): Promise<void> {
  try {
    await setDoc(doc(db, 'doctor_availability', doctorId), {
      doctorId,
      weeklySlots,
      updatedAt: serverTimestamp(),
    });
    console.log(`Availability updated for doctor: ${doctorId}`);
  } catch (error) {
    console.error('updateDoctorAvailability error:', error);
    throw error;
  }
}

export async function getDoctorAvailability(doctorId: string): Promise<DoctorAvailability | null> {
  try {
    const docSnap = await getDoc(doc(db, 'doctor_availability', doctorId));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      ...(data as any),
      updatedAt: convertTimestamp(data.updatedAt),
    } as DoctorAvailability;
  } catch (error) {
    console.error('getDoctorAvailability error:', error);
    throw error;
  }
}

// Lab Requests
export async function getLabRequests(
  userId: string,
  role: 'doctor' | 'lab' | 'patient',
  statusFilter?: string,
  limitCount: number = 50
): Promise<LabRequest[]> {
  let userField = 'doctorId';
  if (role === 'lab') userField = 'labId';
  if (role === 'patient') userField = 'patientId';

  const constraints: QueryConstraint[] = [
    where(userField, '==', userId),
    limit(limitCount)
  ];

  // constraints.push(orderBy('createdAt', 'desc'));

  if (statusFilter && statusFilter !== 'all') {
    constraints.splice(1, 0, where('status', '==', statusFilter));
  }

  try {
    const q = query(collection(db, 'labRequests'), ...constraints);
    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} lab requests for ${userId}`);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as LabRequest[];
  } catch (error) {
    console.error('getLabRequests error:', error);
    throw error;
  }
}

export async function updateLabRequestStatus(requestId: string, status: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'labRequests', requestId), { status });
    console.log(`Lab request ${requestId} status updated to ${status}`);
  } catch (error) {
    console.error(`updateLabRequestStatus error for ${requestId}:`, error);
    throw error;
  }
}

export async function createLabRequest(data: Omit<LabRequest, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'labRequests'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`Lab request created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('createLabRequest error:', error);
    throw error;
  }
}

// Lab Results
export async function getLabResults(requestIds: string[]): Promise<LabResult[]> {
  if (requestIds.length === 0) return [];

  try {
    const q = query(
      collection(db, 'labResults'),
      where('requestId', 'in', requestIds.slice(0, 10)), // Firestore limit
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} lab results for request IDs: ${requestIds.join(', ')}`);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      uploadedAt: convertTimestamp(doc.data().uploadedAt),
      updatedAt: doc.data().updatedAt ? convertTimestamp(doc.data().updatedAt) : undefined,
    })) as LabResult[];
  } catch (error) {
    console.error('getLabResults error:', error);
    throw error;
  }
}

export async function getLabResultsForLab(labId: string): Promise<(LabRequest & { result?: LabResult })[]> {
  try {
    // 1. Get all ready lab requests for this lab
    const requestsQ = query(
      collection(db, 'labRequests'),
      where('labId', '==', labId),
      where('status', '==', 'ready')
    );
    const requestsSnap = await getDocs(requestsQ);
    const requests = requestsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as LabRequest[];

    if (requests.length === 0) return [];

    // 2. Get the associated results
    const requestIds = requests.map(r => r.id);
    const results = await getLabResults(requestIds);

    // 3. Combine them
    return requests.map(req => ({
      ...req,
      result: results.find(res => res.requestId === req.id)
    }));
  } catch (error) {
    console.error('getLabResultsForLab error:', error);
    throw error;
  }
}

export async function createLabResult(data: Omit<LabResult, 'id'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'labResults'), {
      ...data,
      uploadedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`Lab result created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('createLabResult error:', error);
    throw error;
  }
}

export async function updateLabResult(resultId: string, data: Partial<LabResult>): Promise<void> {
  try {
    await updateDoc(doc(db, 'labResults', resultId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`Lab result ${resultId} updated`);
  } catch (error) {
    console.error(`updateLabResult error for ${resultId}:`, error);
    throw error;
  }
}

// Prescriptions
export async function getPrescriptions(
  userId: string,
  role: 'doctor' | 'patient',
  limitCount: number = 50
): Promise<Prescription[]> {
  try {
    const q = query(
      collection(db, 'prescriptions'),
      where(role === 'doctor' ? 'doctorId' : 'patientId', '==', userId),
      // orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    console.log(`Found ${snapshot.size} prescriptions for ${userId}`);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
    })) as Prescription[];
  } catch (error) {
    console.error('getPrescriptions error:', error);
    throw error;
  }
}

export async function createPrescription(data: Omit<Prescription, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'prescriptions'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`Prescription created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('createPrescription error:', error);
    throw error;
  }
}

// Users
export async function getUsers(role?: string, limitCount: number = 100): Promise<DocumentData[]> {
  const constraints: QueryConstraint[] = [
    limit(limitCount)
  ];

  if (role) {
    constraints.unshift(where('role', '==', role));
  } else {
    constraints.unshift(orderBy('createdAt', 'desc'));
  }

  const q = query(collection(db, 'users'), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt),
  }));
}

export async function getUserById(uid: string): Promise<DocumentData | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: convertTimestamp(data.createdAt)
    };
  } catch (error) {
    console.error('getUserById error:', error);
    throw error;
  }
}

export async function updateUserStatus(uid: string, status: 'active' | 'disabled'): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { status });
}

export async function updateUserProfile(uid: string, data: Partial<DocumentData>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    console.log(`User profile updated for UID: ${uid}`);
  } catch (error) {
    console.error('updateUserProfile error:', error);
    throw error;
  }
}

// Policies
export async function getPolicies(): Promise<Policy[]> {
  const q = query(
    collection(db, 'policies'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt),
    updatedAt: doc.data().updatedAt ? convertTimestamp(doc.data().updatedAt) : undefined,
  })) as Policy[];
}

export async function createPolicy(data: Omit<Policy, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'policies'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updatePolicy(policyId: string, data: Partial<Policy>): Promise<void> {
  await updateDoc(doc(db, 'policies', policyId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePolicy(policyId: string): Promise<void> {
  await deleteDoc(doc(db, 'policies', policyId));
}

// Chats
export async function getOrCreateChat(user1Id: string, user2Id: string): Promise<string> {
  try {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user1Id)
    );

    const snapshot = await getDocs(q);
    const existingChat = snapshot.docs.find(doc => {
      const participants = doc.data().participants as string[];
      return participants.includes(user2Id);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create new chat
    const docRef = await addDoc(collection(db, 'chats'), {
      participants: [user1Id, user2Id],
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error('getOrCreateChat error:', error);
    throw error;
  }
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
  type: 'text' | 'image' | 'audio' | 'file' = 'text',
  fileUrl?: string
): Promise<void> {
  try {
    const messageData: any = {
      senderId,
      text,
      type,
      createdAt: serverTimestamp(),
    };

    if (fileUrl) {
      messageData.fileUrl = fileUrl;
    }

    await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);

    // Update last message timestamp
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('sendMessage error:', error);
    throw error;
  }
}

export async function getChats(userId: string): Promise<Chat[]> {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    lastMessageAt: convertTimestamp(doc.data().lastMessageAt),
  })) as Chat[];
}

export async function getMessages(chatId: string, limitCount: number = 50): Promise<Message[]> {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: convertTimestamp(doc.data().createdAt),
  })) as Message[];
}

// Statistics
export async function getStatistics(): Promise<{
  totalUsers: number;
  usersByRole: Record<string, number>;
  totalAppointments: number;
  totalLabRequests: number;
}> {
  const usersSnapshot = await getDocs(collection(db, 'users'));
  const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
  const labRequestsSnapshot = await getDocs(collection(db, 'labRequests'));

  const usersByRole: Record<string, number> = {};
  usersSnapshot.docs.forEach(doc => {
    const role = doc.data().role;
    usersByRole[role] = (usersByRole[role] || 0) + 1;
  });

  return {
    totalUsers: usersSnapshot.size,
    usersByRole,
    totalAppointments: appointmentsSnapshot.size,
    totalLabRequests: labRequestsSnapshot.size,
  };
}

// Get labs for dropdown
export async function getLabs(): Promise<DocumentData[]> {
  return getUsers('lab');
}

// Get patients for a doctor
export async function getPatientsForDoctor(doctorId: string): Promise<DocumentData[]> {
  // Get unique patient IDs from appointments
  const appointmentsQuery = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctorId)
  );
  const snapshot = await getDocs(appointmentsQuery);
  const appointmentPatientIds = snapshot.docs.map(doc => doc.data().patientId);

  // Get patient IDs from doctor_patients collection
  const doctorPatientsQuery = query(
    collection(db, 'doctor_patients'),
    where('doctorId', '==', doctorId)
  );
  const dpSnapshot = await getDocs(doctorPatientsQuery);
  const explicitPatientIds = dpSnapshot.docs.map(doc => doc.data().patientId);

  // Combine and deduplicate
  const patientIds = [...new Set([...appointmentPatientIds, ...explicitPatientIds])];

  if (patientIds.length === 0) return [];

  // Fetch patient details (batched due to Firestore 'in' limit)
  const patients: DocumentData[] = [];
  for (let i = 0; i < patientIds.length; i += 10) {
    const batch = patientIds.slice(i, i + 10);
    const usersQuery = query(
      collection(db, 'users'),
      where('uid', 'in', batch)
    );
    const usersSnapshot = await getDocs(usersQuery);
    patients.push(...usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    })));
  }

  return patients;
}

export async function searchPatients(searchQuery: string): Promise<DocumentData[]> {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'patient'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];

    // Simple client-side filtering for demo (Firestore doesn't support easy partial string search)
    return results.filter(p =>
      p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  } catch (error) {
    console.error('searchPatients error:', error);
    throw error;
  }
}

export async function addPatientToDoctor(doctorId: string, patientId: string): Promise<void> {
  try {
    const docId = `${doctorId}_${patientId}`;
    await setDoc(doc(db, 'doctor_patients', docId), {
      doctorId,
      patientId,
      addedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('addPatientToDoctor error:', error);
    throw error;
  }
}

export async function createUpload(data: Omit<Upload, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'uploads'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    console.log(`Upload created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('createUpload error:', error);
    throw error;
  }
}

// Video Rooms
export async function getOrCreateVideoRoom(appointmentId: string): Promise<VideoRoom> {
  try {
    const q = query(
      collection(db, 'videoRooms'),
      where('appointmentId', '==', appointmentId),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const docData = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        ...docData,
        createdAt: convertTimestamp(docData.createdAt),
        updatedAt: convertTimestamp(docData.updatedAt),
      } as VideoRoom;
    }

    // Create new room if doesn't exist
    const roomData = {
      appointmentId,
      isActive: true,
      participants: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'videoRooms'), roomData);
    return {
      id: docRef.id,
      ...roomData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as VideoRoom;
  } catch (error) {
    console.error('getOrCreateVideoRoom error:', error);
    throw error;
  }
}

export async function updateVideoRoomStatus(roomId: string, isActive: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'videoRooms', roomId), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('updateVideoRoomStatus error:', error);
    throw error;
  }
}

export async function setRoomParticipant(roomId: string, uid: string, fullName: string): Promise<void> {
  try {
    await setDoc(doc(db, 'videoRooms', roomId, 'participants', uid), {
      uid,
      fullName,
      joinedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('setRoomParticipant error:', error);
  }
}

export async function removeRoomParticipant(roomId: string, uid: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'videoRooms', roomId, 'participants', uid));
  } catch (error) {
    console.error('removeRoomParticipant error:', error);
  }
}
