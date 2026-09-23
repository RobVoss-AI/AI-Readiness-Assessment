// roi-calculator.js - Time-savings & ROI model shared by the results page and the server.
// Loaded in the browser as window.RoiCalculator and on the server via require().
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.RoiCalculator = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    // Midpoints for the org-size ranges offered on user-info.html
    const ORG_SIZE_HEADCOUNT = {
        '1-10': 6,
        '11-50': 30,
        '51-200': 125,
        '201-1000': 500,
        '1001-5000': 2500,
        '5000+': 7500
    };

    const WORK_WEEKS_PER_YEAR = 48;
    const HOURS_PER_FTE_YEAR = 1880;
    const TARGET_READINESS = 80;

    const DEFAULT_INPUTS = {
        hourlyCost: 45,            // fully loaded $/hour
        repetitiveHoursPerWeek: 6, // per employee, on routine/repetitive tasks
        adoptionRate: 0.6          // share of staff actually using the tools in year one
    };

    function clamp(value, min, max, fallback) {
        const n = Number(value);
        if (!Number.isFinite(n)) return fallback;
        return Math.min(max, Math.max(min, n));
    }

    // Share of repetitive hours an organization can realistically capture in year one.
    // Scales from 15% (not ready) to 50% (fully ready).
    function captureRate(readiness) {
        return 0.15 + 0.35 * (clamp(readiness, 0, 100, 0) / 100);
    }

    function headcountFor(orgSize) {
        return ORG_SIZE_HEADCOUNT[orgSize] || 30;
    }

    function project(inputs, readiness) {
        const weeklyHours = inputs.employees * inputs.repetitiveHoursPerWeek *
            captureRate(readiness) * inputs.adoptionRate;
        const annualHours = weeklyHours * WORK_WEEKS_PER_YEAR;
        return {
            weeklyHours: Math.round(weeklyHours),
            annualHours: Math.round(annualHours),
            annualValue: Math.round(annualHours * inputs.hourlyCost),
            fteEquivalent: Math.round((annualHours / HOURS_PER_FTE_YEAR) * 10) / 10
        };
    }

    /**
     * @param {object} params
     * @param {number} params.readiness     Overall readiness score 0-100
     * @param {string} [params.orgSize]     Org-size range from the user form
     * @param {number} [params.employees]   Overrides orgSize headcount
     * @param {number} [params.hourlyCost]
     * @param {number} [params.repetitiveHoursPerWeek]
     * @param {number} [params.adoptionRate] 0-1
     */
    function calculate(params) {
        const readiness = clamp(params.readiness, 0, 100, 0);
        const inputs = {
            employees: Math.round(clamp(params.employees, 1, 1000000, headcountFor(params.orgSize))),
            hourlyCost: clamp(params.hourlyCost, 1, 1000, DEFAULT_INPUTS.hourlyCost),
            repetitiveHoursPerWeek: clamp(params.repetitiveHoursPerWeek, 0, 40, DEFAULT_INPUTS.repetitiveHoursPerWeek),
            adoptionRate: clamp(params.adoptionRate, 0.05, 1, DEFAULT_INPUTS.adoptionRate)
        };

        const current = project(inputs, readiness);
        const target = project(inputs, Math.max(readiness, TARGET_READINESS));

        return {
            inputs,
            readiness,
            current,
            atTargetReadiness: target,
            targetReadiness: Math.max(readiness, TARGET_READINESS),
            // Value left on the table until readiness gaps are closed
            unlockableValue: Math.max(0, target.annualValue - current.annualValue),
            assumptions: [
                `${inputs.repetitiveHoursPerWeek} hours/week per employee on routine, repetitive work`,
                `${Math.round(captureRate(readiness) * 100)}% of those hours captured at your current readiness (15% at 0 → 50% at 100)`,
                `${Math.round(inputs.adoptionRate * 100)}% of staff actively using AI tools in year one`,
                `$${inputs.hourlyCost}/hour fully loaded labor cost, ${WORK_WEEKS_PER_YEAR} working weeks/year`
            ]
        };
    }

    return { calculate, headcountFor, captureRate, DEFAULT_INPUTS, ORG_SIZE_HEADCOUNT };
});
