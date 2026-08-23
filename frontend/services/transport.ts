import { db } from '@/services/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  where,
  orderBy,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';
import type {
  TransportRoute,
  TransportAssignment,
  Bus,
  BusLocation,
  Driver
} from '@/types';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';

// ─── Collection Paths (Unified) ─────────────────────────────────────────────
const ROUTES_COL = 'transport/routes/list';
const ASSIGNMENTS_COL = 'transport/assignments/list';
const BUSES_COL = 'buses';

function routesRef(schoolId: string, routeId?: string) {
  const col = collection(db, 'schools', schoolId, ROUTES_COL);
  return routeId ? doc(col, routeId) : doc(col);
}

function assignmentsRef(schoolId: string, assignId?: string) {
  const col = collection(db, 'schools', schoolId, ASSIGNMENTS_COL);
  return assignId ? doc(col, assignId) : doc(col);
}

function busesRef(schoolId: string, busId?: string) {
  const col = collection(db, 'schools', schoolId, BUSES_COL);
  return busId ? doc(col, busId) : doc(col);
}

function busLocationsRef(schoolId: string, busId: string) {
  return collection(db, 'schools', schoolId, BUSES_COL, busId, 'location');
}

// ─── Routes ──────────────────────────────────────────────────────────────────
export function onRoutes(
  schoolId: string,
  callback: (routes: TransportRoute[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, ROUTES_COL),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as TransportRoute[]);
  });
}

export function onRoute(
  schoolId: string,
  routeId: string,
  callback: (route: TransportRoute | null) => void
): Unsubscribe {
  if (IS_MOCK) { callback(null); return () => {}; }
  return onSnapshot(doc(db, 'schools', schoolId, ROUTES_COL, routeId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() }) as TransportRoute : null);
  });
}

export async function createRoute(schoolId: string, data: Omit<TransportRoute, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const docRef = routesRef(schoolId);
  const now = new Date().toISOString();
  await setDoc(docRef, { ...data, createdAt: now, updatedAt: now });
  return docRef.id;
}

export async function updateRoute(schoolId: string, routeId: string, data: Partial<TransportRoute>): Promise<void> {
  await updateDoc(routesRef(schoolId, routeId), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteRoute(schoolId: string, routeId: string): Promise<void> {
  await deleteDoc(routesRef(schoolId, routeId));
}

// ─── Assignments ─────────────────────────────────────────────────────────────
export function onAssignments(
  schoolId: string,
  callback: (assignments: TransportAssignment[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, ASSIGNMENTS_COL),
    orderBy('assignedAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as TransportAssignment[]);
  });
}

export function onStudentAssignment(
  schoolId: string,
  studentId: string,
  callback: (assignment: TransportAssignment | null) => void
): Unsubscribe {
  if (IS_MOCK) { callback(null); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, ASSIGNMENTS_COL),
    where('studentId', '==', studentId)
  );
  return onSnapshot(q, (snap) => {
    const assign = snap.docs[0];
    callback(assign ? ({ id: assign.id, ...assign.data() }) as TransportAssignment : null);
  });
}

export function onAssignmentsByClass(
  schoolId: string,
  classId: string,
  callback: (assignments: TransportAssignment[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, ASSIGNMENTS_COL),
    where('classId', '==', classId)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as TransportAssignment[]);
  });
}

export async function assignStudent(schoolId: string, data: Omit<TransportAssignment, 'id' | 'assignedAt'>): Promise<string> {
  const docRef = assignmentsRef(schoolId);
  await setDoc(docRef, { ...data, assignedAt: new Date().toISOString() });
  return docRef.id;
}

export async function removeAssignment(schoolId: string, assignmentId: string): Promise<void> {
  await deleteDoc(assignmentsRef(schoolId, assignmentId));
}

export async function getAssignmentsByRoute(schoolId: string, routeId: string): Promise<TransportAssignment[]> {
  const q = query(
    collection(db, 'schools', schoolId, ASSIGNMENTS_COL),
    where('routeId', '==', routeId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as TransportAssignment);
}

// ─── Bus Location ────────────────────────────────────────────────────────────
export function onBusLocation(
  schoolId: string,
  busId: string,
  callback: (bus: Bus | null) => void
): Unsubscribe {
  if (IS_MOCK) { callback(null); return () => {}; }
  return onSnapshot(busesRef(schoolId, busId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...snap.data() }) as Bus : null);
  });
}

export function onAllBusLocations(
  schoolId: string,
  callback: (buses: Bus[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  return onSnapshot(collection(db, 'schools', schoolId, BUSES_COL), (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Bus[]);
  });
}

export async function updateBusLocation(
  schoolId: string,
  busId: string,
  location: { lat: number; lng: number; speed: number; heading: number; status: Bus['status'] }
): Promise<void> {
  const now = new Date().toISOString();
  const busDoc = busesRef(schoolId, busId);
  await updateDoc(busDoc, {
    ...location,
    lastUpdate: now,
  });

  // Write to location history subcollection
  const locationDoc = doc(busLocationsRef(schoolId, busId), now.replace(/[:.]/g, ''));
  await setDoc(locationDoc, {
    busId,
    ...location,
    timestamp: now,
  });
}

export async function createBus(schoolId: string, data: Omit<Bus, 'id'>): Promise<string> {
  const docRef = busesRef(schoolId);
  await setDoc(docRef, { ...data, lastUpdate: new Date().toISOString() });
  return docRef.id;
}

export async function updateBus(schoolId: string, busId: string, data: Partial<Bus>): Promise<void> {
  await updateDoc(busesRef(schoolId, busId), { ...data, lastUpdate: new Date().toISOString() });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Normalize a phone number to E.164-ish format (`+CC-PHONE`).
 * Strips everything except digits, preserves a single leading `+` if the
 * input was already international. Validates that the result has between
 * 7 and 15 digits (ITU-T E.164 limits). Returns an empty string on invalid
 * input so callers can detect and reject.
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return `${hasPlus ? '+' : ''}${digits}`;
}

export function getRouteETA(
  currentLat: number,
  currentLng: number,
  stopLat: number,
  stopLng: number,
  averageSpeedKmh: number = 30
): number {
  const R = 6371;
  const dLat = ((stopLat - currentLat) * Math.PI) / 180;
  const dLng = ((stopLng - currentLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((currentLat * Math.PI) / 180) *
      Math.cos((stopLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const hours = distanceKm / averageSpeedKmh;
  return Math.round(hours * 60);
}

export function formatETA(minutes: number): string {
  if (minutes < 1) return 'Arriving now';
  if (minutes < 60) return `${minutes} min away`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m away`;
}
