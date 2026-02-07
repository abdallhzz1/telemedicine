import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'patient' | 'doctor' | 'lab' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: 'active' | 'disabled';
  createdAt: Date;
  phone?: string;
  specialization?: string; // for doctors
  labName?: string; // for labs
  avatar?: string;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signupWithEmail(
  email: string, 
  password: string, 
  fullName: string,
  role: UserRole = 'patient'
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  
  // Create user profile in Firestore
  await setDoc(doc(db, 'users', result.user.uid), {
    uid: result.user.uid,
    fullName,
    email,
    role,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  
  return result.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  
  // Check if user profile exists, if not create one
  const userDoc = await getDoc(doc(db, 'users', result.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', result.user.uid), {
      uid: result.user.uid,
      fullName: result.user.displayName || 'User',
      email: result.user.email,
      role: 'patient',
      status: 'active',
      createdAt: serverTimestamp(),
    });
  }
  
  return result.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) return null;
  
  const data = userDoc.data();
  return {
    uid: data.uid,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    status: data.status,
    createdAt: data.createdAt?.toDate() || new Date(),
    phone: data.phone,
    specialization: data.specialization,
    labName: data.labName,
    avatar: data.avatar,
  };
}

export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case 'doctor':
      return '/doctor';
    case 'lab':
      return '/lab';
    case 'admin':
      return '/admin';
    case 'patient':
      return '/patient';
    default:
      return '/';
  }
}
