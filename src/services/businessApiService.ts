import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    onSnapshot,
    orderBy
} from 'firebase/firestore';

export interface ApiKey {
    id?: string;
    key: string;
    businessName: string;
    contactEmail: string;
    ownerUid: string;
    status: 'active' | 'revoked';
    createdAt: string;
    lastUsed?: string;
    requestCount: number;
}

export interface AggregatedHealthData {
    totalPatients: number;
    bloodGroupDistribution: Record<string, number>;
    ageDemographics: { range: string; count: number }[];
    genderDistribution: Record<string, number>;
    avgHealthScore: number;
    totalClinicVisits: number;
    topConditions: string[];
    dataTimestamp: string;
}

const generateApiKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'sewa_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
};

export const BusinessApiService = {
    // Create a new API key
    async createApiKey(ownerUid: string, businessName: string, contactEmail: string): Promise<string> {
        const apiKeysRef = collection(db, 'api_keys');
        const key = generateApiKey();

        await addDoc(apiKeysRef, {
            key,
            businessName,
            contactEmail,
            ownerUid,
            status: 'active',
            createdAt: new Date().toISOString(),
            requestCount: 0
        });

        return key;
    },

    // Get all API keys owned by a user
    subscribeToApiKeys(ownerUid: string, callback: (keys: ApiKey[]) => void) {
        const apiKeysRef = collection(db, 'api_keys');
        const q = query(apiKeysRef, where('ownerUid', '==', ownerUid));

        return onSnapshot(q, (snapshot) => {
            const keys: ApiKey[] = [];
            snapshot.forEach((doc) => {
                keys.push({ id: doc.id, ...doc.data() } as ApiKey);
            });
            // Sort by creation date, newest first
            keys.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            callback(keys);
        }, (error) => {
            console.error('API Keys subscription error:', error);
        });
    },

    // Revoke an API key
    async revokeApiKey(keyId: string) {
        const keyRef = doc(db, 'api_keys', keyId);
        await updateDoc(keyRef, { status: 'revoked' });
    },

    // Get aggregated anonymized health data
    async getAggregatedData(): Promise<AggregatedHealthData> {
        const usersRef = collection(db, 'users');
        const queueRef = collection(db, 'clinic_queues');

        const [usersSnapshot, queueSnapshot] = await Promise.all([
            getDocs(usersRef),
            getDocs(queueRef)
        ]);

        const bloodGroups: Record<string, number> = {};
        const genders: Record<string, number> = {};
        const ages: number[] = [];
        let totalHealthScore = 0;
        let healthScoreCount = 0;

        usersSnapshot.forEach((doc) => {
            const data = doc.data();

            // Blood group distribution
            if (data.bloodGroup) {
                bloodGroups[data.bloodGroup] = (bloodGroups[data.bloodGroup] || 0) + 1;
            }

            // Gender distribution
            if (data.gender) {
                genders[data.gender] = (genders[data.gender] || 0) + 1;
            }

            // Age data
            if (data.age) {
                ages.push(data.age);
            }

            // Health scores
            if (data.lastHealthReport?.healthScore) {
                totalHealthScore += data.lastHealthReport.healthScore;
                healthScoreCount++;
            }
        });

        // Build age demographics
        const ageRanges = [
            { range: '0-18', min: 0, max: 18 },
            { range: '19-30', min: 19, max: 30 },
            { range: '31-45', min: 31, max: 45 },
            { range: '46-60', min: 46, max: 60 },
            { range: '60+', min: 61, max: 200 },
        ];
        const ageDemographics = ageRanges.map(r => ({
            range: r.range,
            count: ages.filter(a => a >= r.min && a <= r.max).length
        }));

        return {
            totalPatients: usersSnapshot.size,
            bloodGroupDistribution: bloodGroups,
            ageDemographics,
            genderDistribution: genders,
            avgHealthScore: healthScoreCount > 0 ? Math.round(totalHealthScore / healthScoreCount) : 0,
            totalClinicVisits: queueSnapshot.size,
            topConditions: ['General Checkup', 'Fever', 'Respiratory', 'Cardiac', 'Orthopedic'],
            dataTimestamp: new Date().toISOString()
        };
    }
};
