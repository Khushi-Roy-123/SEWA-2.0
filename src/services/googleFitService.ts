
// This service handles integration with the Google Fitness REST API.
// Scopes needed: 
// - https://www.googleapis.com/auth/fitness.activity.read
// - https://www.googleapis.com/auth/fitness.body.read

const GOOGLE_FIT_SCOPES = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.location.read'
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

        // Ensure minimum 1-minute bucket to avoid zero-duration errors
        const durationMillis = Math.max(endTimeMillis - startTimeMillis, 60000);

        const requestBody = {
            aggregateBy: [
                {
                    dataTypeName: 'com.google.step_count.delta',
                    dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
                },
                {
                    dataTypeName: 'com.google.calories.expended'
                },
                {
                    dataTypeName: 'com.google.distance.delta'
                }
            ],
            bucketByTime: { durationMillis },
            startTimeMillis,
            endTimeMillis,
        };

        const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Google Fit API error:', response.status, errorBody);
            throw new Error(`Google Fit API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Google Fit raw response:', JSON.stringify(data, null, 2));

        let steps = 0;
        let calories = 0;
        let distance = 0;

        if (data.bucket && data.bucket.length > 0) {
            data.bucket.forEach((bucket: any) => {
                if (!bucket.dataset) return;
                bucket.dataset.forEach((ds: any) => {
                    if (!ds.point) return;
                    ds.point.forEach((pt: any) => {
                        if (pt.value && pt.value.length > 0) {
                            const val = pt.value[0];
                            if (ds.dataSourceId.includes('step_count')) {
                                steps += val.intVal || 0;
                            } else if (ds.dataSourceId.includes('calories')) {
                                calories += val.fpVal || 0;
                            } else if (ds.dataSourceId.includes('distance')) {
                                distance += val.fpVal || 0;
                            }
                        }
                    });
                });
            });
        }

        console.log('Google Fit parsed data:', { steps, calories: Math.round(calories), distance: Math.round(distance) });

        return {
            steps,
            calories: Math.round(calories),
            distance: Math.round(distance)
        };
    }
};
