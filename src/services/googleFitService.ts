
// This service handles integration with the Google Fitness REST API.
// Scopes needed: 
// - https://www.googleapis.com/auth/fitness.activity.read
// - https://www.googleapis.com/auth/fitness.body.read

const GOOGLE_FIT_SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read'
];

export interface FitData {
    steps: number;
    calories: number;
    distance: number; // in meters
    heartRate?: number;
    weight?: number;
}

export const GoogleFitService = {
    // Construct the OAuth URL for the user to authorize
    getAuthUrl() {
        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const options = {
            redirect_uri: window.location.origin + '/google-fit-callback',
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            response_type: 'token', 
            prompt: 'consent',
            scope: GOOGLE_FIT_SCOPES.join(' '),
            include_granted_scopes: 'true',
        };

        const qs = new URLSearchParams(options);
        return `${rootUrl}?${qs.toString()}`;
    },

    // Fetch step count for today
    async fetchDailyMetrics(accessToken: string): Promise<FitData> {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startTimeMillis = startOfDay.getTime();
        const endTimeMillis = now.getTime();

        const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                aggregateBy: [
                    { dataTypeName: 'com.google.step_count.delta' },
                    { dataTypeName: 'com.google.calories.expended' },
                    { dataTypeName: 'com.google.distance.delta' }
                ],
                bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
                startTimeMillis,
                endTimeMillis,
            }),
        });

        const data = await response.json();
        
        let steps = 0;
        let calories = 0;
        let distance = 0;

        if (data.bucket && data.bucket[0]) {
            data.bucket[0].dataset.forEach((ds: any) => {
                if (ds.point && ds.point[0]) {
                    const value = ds.point[0].value[0];
                    if (ds.dataSourceId.includes('step_count')) steps = value.intVal || 0;
                    if (ds.dataSourceId.includes('calories')) calories = Math.round(value.fpVal || 0);
                    if (ds.dataSourceId.includes('distance')) distance = Math.round(value.fpVal || 0);
                }
            });
        }

        return { steps, calories, distance };
    }
};
