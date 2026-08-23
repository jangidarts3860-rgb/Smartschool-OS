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
  arrayUnion,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import type { Announcement, AnnouncementPriority, AnnouncementTargetRole } from '@/types';
import { MOCK_ANNOUNCEMENTS } from '@/constants';

const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_DEMO_MODE === 'true';
const COLLECTION = 'announcements';

function getAnnouncementsRef(schoolId: string, announcementId?: string) {
  const col = collection(db, 'schools', schoolId, COLLECTION);
  return announcementId ? doc(col, announcementId) : doc(col);
}

export async function createAnnouncement(
  schoolId: string,
  data: {
    title: string;
    message: string;
    priority: AnnouncementPriority;
    visibleTo: AnnouncementTargetRole[];
    targetClasses: string[];
    createdBy: string;
    createdByName: string;
    createdByRole: string;
    isPinned?: boolean;
    expiresAt?: string | null;
    scheduledAt?: string | null;
  }
): Promise<string> {
  const docRef = getAnnouncementsRef(schoolId);
  const now = new Date().toISOString();
  await setDoc(docRef, {
    ...data,
    isPinned: data.isPinned || false,
    isArchived: false,
    readBy: [],
    createdAt: now,
    updatedAt: now,
    schoolId,
  });
  return docRef.id;
}

export async function updateAnnouncement(
  schoolId: string,
  announcementId: string,
  data: Partial<Announcement>
): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
}

export async function archiveAnnouncement(schoolId: string, announcementId: string): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { isArchived: true, isPinned: false, updatedAt: new Date().toISOString() });
}

export async function restoreAnnouncement(schoolId: string, announcementId: string): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { isArchived: false, updatedAt: new Date().toISOString() });
}

export async function deleteAnnouncement(schoolId: string, announcementId: string): Promise<void> {
  await deleteDoc(getAnnouncementsRef(schoolId, announcementId));
}

export async function pinAnnouncement(schoolId: string, announcementId: string, pinned: boolean): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { isPinned: pinned, updatedAt: new Date().toISOString() });
}

export async function markAsRead(schoolId: string, announcementId: string, userId: string): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { readBy: arrayUnion(userId) });
}

export function onActiveAnnouncements(
  schoolId: string,
  callback: (announcements: Announcement[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_ANNOUNCEMENTS); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, COLLECTION),
    where('isArchived', '==', false),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Announcement[]);
  }, () => {
    callback([]);
  });
}

export function onArchivedAnnouncements(
  schoolId: string,
  callback: (announcements: Announcement[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, COLLECTION),
    where('isArchived', '==', true),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Announcement[]);
  });
}

export function onAnnouncementsByRole(
  schoolId: string,
  role: AnnouncementTargetRole,
  callback: (announcements: Announcement[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_ANNOUNCEMENTS.filter(a => a.visibleTo?.includes(role))); return () => {}; }
  const q = query(
    collection(db, 'schools', schoolId, COLLECTION),
    where('isArchived', '==', false),
    orderBy('isPinned', 'desc'),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(q, (snap) => {
    const filtered = snap.docs
      .map((d: any) => ({ id: d.id, ...d.data() }) as Announcement)
      .filter((a: any) => a.visibleTo.includes(role));
    callback(filtered);
  });
}

/**
 * Single combined listener for active + archived announcements visible to a role.
 * Avoids the race condition of two separate listeners (active / archived) firing
 * concurrently and stomping on each other in component state.
 *
 * Required composite index: collectionId=announcements, fields=(visibleTo array-contains, isArchived in, createdAt desc)
 */
export function onAllAnnouncementsByRole(
  schoolId: string,
  role: AnnouncementTargetRole,
  callback: (announcements: Announcement[]) => void
): Unsubscribe {
  if (IS_MOCK) { callback(MOCK_ANNOUNCEMENTS.filter(a => a.visibleTo?.includes(role))); return () => {}; }
  try {
    const q = query(
      collection(db, 'schools', schoolId, COLLECTION),
      where('visibleTo', 'array-contains', role),
      where('isArchived', 'in', [true, false]),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const all = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }) as Announcement);
      callback(all);
    }, (err) => {
      console.warn('onAllAnnouncementsByRole error (composite index missing?):', err.message);
      // Fallback: subscribe to collection and filter client-side
      try {
        const fallback = query(collection(db, 'schools', schoolId, COLLECTION));
        return onSnapshot(fallback, (s) => {
          const filtered = s.docs
            .map((d: any) => ({ id: d.id, ...d.data() }) as Announcement)
            .filter((a: any) => Array.isArray(a.visibleTo) && a.visibleTo.includes(role));
          callback(filtered);
        }, () => {
          callback([]);
        });
      } catch {
        callback([]);
      }
    });
  } catch {
    callback([]);
    return () => {};
  }
}

export async function getAnnouncementById(schoolId: string, announcementId: string): Promise<Announcement | null> {
  const snap = await getDoc(getAnnouncementsRef(schoolId, announcementId));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Announcement) : null;
}

export async function getUnreadCount(
  schoolId: string,
  userId: string,
  role: AnnouncementTargetRole
): Promise<number> {
  const q = query(
    collection(db, 'schools', schoolId, COLLECTION),
    where('isArchived', '==', false)
  );
  const snap = await getDocs(q);
  return snap.docs.filter((d: any) => {
    const data = d.data() as Announcement;
    return data.visibleTo.includes(role) && !data.readBy.includes(userId);
  }).length;
}

export async function getReadStats(schoolId: string, announcementId: string, totalUsers: number): Promise<{ readCount: number; totalCount: number; percentage: number }> {
  const snap = await getDoc(getAnnouncementsRef(schoolId, announcementId));
  if (!snap.exists()) return { readCount: 0, totalCount: totalUsers, percentage: 0 };
  const data = snap.data() as Announcement;
  const readCount = data.readBy?.length || 0;
  return { readCount, totalCount: totalUsers, percentage: totalUsers > 0 ? Math.round((readCount / totalUsers) * 100) : 0 };
}

export async function scheduleAnnouncement(
  schoolId: string,
  announcementId: string,
  scheduledAt: string
): Promise<void> {
  const docRef = getAnnouncementsRef(schoolId, announcementId);
  await updateDoc(docRef, { scheduledAt, isArchived: false, updatedAt: new Date().toISOString() });
}

export function shareNoticeWhatsApp(announcement: Announcement): void {
  const priorityLabel = announcement.priority === 'critical' ? 'Important' : announcement.priority === 'urgent' ? 'Urgent' : 'Notice';
  const text = `*📌 SCHOOL ${priorityLabel.toUpperCase()}: ${announcement.title}*\n\n${announcement.message}\n\n— ${announcement.createdByName}`;
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}

export function broadcastNoticeWhatsApp(announcement: Announcement, phoneNumbers: string[]): void {
  const priorityLabel = announcement.priority === 'critical' ? 'Important' : announcement.priority === 'urgent' ? 'Urgent' : 'Notice';
  const text = `*📌 SCHOOL ${priorityLabel.toUpperCase()}: ${announcement.title}*\n\n${announcement.message}\n\n— ${announcement.createdByName}`;
  const encoded = encodeURIComponent(text);
  phoneNumbers.forEach((phone, i) => {
    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    setTimeout(() => {
      window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    }, i * 1000);
  });
}
