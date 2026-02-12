import { User, Roadmap, Badge } from '../types';
import { auth, db } from './firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';

// --- Auth Services ---

export const subscribeToAuth = (callback: (user: { uid: string } | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            callback({ uid: user.uid });
        } else {
            callback(null);
        }
    });
};

export const registerUser = async (name: string, email: string, password: string): Promise<void> => {
    if (!auth || !db) throw new Error("Firebase not initialized");

    // 1. Create Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update Display Name
    await updateProfile(user, { displayName: name });

    // 3. Create User Document in Firestore
    const newUser: User = {
        id: user.uid,
        name,
        email,
        password: '***', // Don't store actual password in DB
        roadmaps: [],
        points: 0, // Start with 0 points
        level: 1,
        badges: []
    };

    await setDoc(doc(db, 'users', user.uid), newUser);
};

export const loginUser = async (email: string, password: string): Promise<void> => {
    if (!auth) throw new Error("Firebase not initialized");
    await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async (): Promise<void> => {
    if (!auth) throw new Error("Firebase not initialized");
    await signOut(auth);
};

// --- Data Services (Firestore) ---

export const subscribeToUserProfile = (uid: string, callback: (user: User | null) => void) => {
    if (!db) return () => { };

    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as User);
        } else {
            console.warn("User profile not found in Firestore (or permission denied).");
            callback(null);
        }
    }, (error) => {
        console.error("Error subscribing to user profile:", error);
        if (error.code === 'permission-denied') {
            alert("🔥 FIREBASE PERMISSION ERROR: \n\nYou must enable 'Test Mode' in your Firestore Rules.\n\nGo to Firebase Console -> Firestore -> Rules\nChange to: allow read, write: if true;");
        }
        callback(null);
    });

    return unsubscribe;
};

export const subscribeToLeaderboard = (callback: (users: User[]) => void) => {
    if (!db) return () => { };

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('points', 'desc'), limit(10));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const users: User[] = [];
        querySnapshot.forEach((doc) => {
            users.push(doc.data() as User);
        });
        callback(users);
    }, (error) => {
        console.error("Error subscribing to leaderboard:", error);
        // Fallback or empty on error
        callback([]);
    });

    return unsubscribe;
};

// --- Mutations ---

export const updateUser = async (uid: string, data: Partial<User>) => {
    if (!db) throw new Error("Firebase not initialized");
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, data);
};

export const saveRoadmap = async (uid: string, roadmap: Roadmap) => {
    if (!db) throw new Error("Firebase not initialized");

    // We need to get current roadmaps first to update the array
    // Alternatively, we could store roadmaps in a subcollection, but keeping it simple for now
    // to match the User type structure: roadmaps: Roadmap[]

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        let roadmaps = userData.roadmaps || [];

        const idx = roadmaps.findIndex(r => r.id === roadmap.id);
        if (idx >= 0) {
            roadmaps[idx] = roadmap;
        } else {
            roadmaps.push(roadmap);
        }

        await updateDoc(userRef, { roadmaps });
    }
};

export const deleteRoadmap = async (uid: string, roadmapId: string) => {
    if (!db) throw new Error("Firebase not initialized");

    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        const roadmaps = (userData.roadmaps || []).filter(r => r.id !== roadmapId);
        await updateDoc(userRef, { roadmaps });
    }
};

export const addPoints = async (uid: string, currentPoints: number, currentLevel: number, currentBadges: Badge[], amount: number) => {
    // Recalculate everything locally then update - transaction would be safer but keeping it simple
    const newPoints = currentPoints + amount;
    const newLevel = Math.floor(1 + Math.sqrt(newPoints / 100));
    const leveledUp = newLevel > currentLevel;

    const newBadgesList = [...currentBadges];
    const earnedBadges: Badge[] = [];

    const checkBadge = (id: string, name: string, icon: string, desc: string, threshold: number) => {
        if (newPoints >= threshold && !newBadgesList.find(b => b.id === id)) {
            const b: Badge = { id, name, icon, description: desc, unlockedAt: new Date().toISOString() };
            newBadgesList.push(b);
            earnedBadges.push(b);
        }
    };

    checkBadge('novice', 'Novice Explorer', '🧭', 'Earned 100 XP', 100);
    checkBadge('apprentice', 'Apprentice Builder', '🔨', 'Earned 500 XP', 500);
    checkBadge('expert', 'Knowledge Master', '🧠', 'Earned 1000 XP', 1000);
    checkBadge('wizard', 'Skill Wizard', '🧙‍♂️', 'Earned 5000 XP', 5000);

    await updateUser(uid, {
        points: newPoints,
        level: newLevel,
        badges: newBadgesList
    });

    return { leveledUp, newBadges: earnedBadges };
};