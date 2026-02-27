// Pure utility functions for calculating personalized health targets
// Uses the Mifflin-St Jeor equation for BMR and WHO step guidelines

export interface DailyTargets {
    targetSteps: number;
    targetCalories: number;     // kcal to burn through activity
    targetDistanceMeters: number;
    bmr: number;
    bmi: number;
    bmiCategory: string;
}

/**
 * BMR using the Mifflin-St Jeor equation (most accurate for modern adults)
 * Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161 + 166
 * Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
 */
export function calculateBMR(weight: number, height: number, age: number, gender: string = 'Male'): number {
    const base = 10 * weight + 6.25 * height - 5 * age;
    return gender === 'Female' ? base - 161 : base + 5;
}

/**
 * Calculate BMI and return category
 */
export function calculateBMI(weight: number, height: number): { bmi: number; category: string } {
    const bmi = weight / ((height / 100) ** 2);
    let category = 'Normal';
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi >= 25 && bmi < 30) category = 'Overweight';
    else if (bmi >= 30) category = 'Obese';
    return { bmi: parseFloat(bmi.toFixed(1)), category };
}

/**
 * Estimate stride length from height (in cm)
 * Average stride ≈ height × 0.415 (for walking)
 */
function estimateStrideLengthCm(height: number): number {
    return height * 0.415;
}

/**
 * Get personalized daily targets based on user profile
 */
export function getDailyTargets(
    weight: number,
    height: number,
    age: number,
    gender: string = 'Male'
): DailyTargets {
    const bmr = calculateBMR(weight, height, age, gender);
    const { bmi, category } = calculateBMI(weight, height);

    // Target steps based on BMI category (WHO guidelines)
    let targetSteps: number;
    if (bmi < 18.5) {
        targetSteps = 6000;  // Lighter activity for underweight
    } else if (bmi < 25) {
        targetSteps = 8000;  // Maintenance for normal
    } else if (bmi < 30) {
        targetSteps = 10000; // Active for overweight
    } else {
        targetSteps = 12000; // High activity for obese
    }

    // Target calories to burn = TDEE - BMR (activity calories)
    // Using sedentary multiplier (1.2) as baseline, target the activity portion
    const activityFactor = bmi >= 25 ? 0.35 : 0.25; // Higher burn target for overweight
    const targetCalories = Math.round(bmr * activityFactor);

    // Target distance from steps × stride length
    const strideCm = estimateStrideLengthCm(height);
    const targetDistanceMeters = Math.round((targetSteps * strideCm) / 100);

    return {
        targetSteps,
        targetCalories,
        targetDistanceMeters,
        bmr: Math.round(bmr),
        bmi,
        bmiCategory: category,
    };
}

/**
 * Get a motivational message based on progress
 */
export function getProgressMessage(current: number, target: number, metric: string): string {
    const pct = (current / target) * 100;
    const remaining = target - current;

    if (pct >= 100) return `🎉 ${metric} goal crushed!`;
    if (pct >= 75) return `Almost there! ${remaining.toLocaleString()} ${metric} to go`;
    if (pct >= 50) return `Halfway! ${remaining.toLocaleString()} more ${metric}`;
    if (pct >= 25) return `Good start! ${remaining.toLocaleString()} ${metric} remaining`;
    return `Let's get moving! Target: ${target.toLocaleString()} ${metric}`;
}
