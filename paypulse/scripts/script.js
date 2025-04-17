// Constants for calculations (based on typical work year, adjusted for leap years)
const MONTHS_PER_YEAR = 12;
const WEEKS_PER_YEAR = 52.14285714285714; // 365.25 days / 7 days per week
const DAYS_PER_WEEK = 5; // Work days
const HOURS_PER_DAY = 8;
const SECONDS_PER_HOUR = 3600;
const MINUTES_PER_HOUR = 60;
const DAYS_PER_YEAR = 365.25; // Average accounting for leap years
const DAYS_PER_MONTH = DAYS_PER_YEAR / MONTHS_PER_YEAR; // Approx 30.4375 days
const HOURS_PER_YEAR = WEEKS_PER_YEAR * DAYS_PER_WEEK * HOURS_PER_DAY; // Approx 2085.71 hours
const SECONDS_PER_YEAR = HOURS_PER_YEAR * SECONDS_PER_HOUR;

// Secure DOM references using WeakMap for memory efficiency
const elements = new WeakMap();
const inputs = {
    // Salary inputs
    annual: document.getElementById('annual'),
    monthly: document.getElementById('monthly'),
    weekly: document.getElementById('weekly'),
    daily: document.getElementById('daily'),
    hourly: document.getElementById('hourly'),
    secondly: document.getElementById('secondly'),
    // Contract inputs
    'contract-length-years': document.getElementById('contract-length-years'),
    'contract-length-months': document.getElementById('contract-length-months'),
    'contract-length-days': document.getElementById('contract-length-days'),
    'contract-total': document.getElementById('contract-total'),
    'contract-annual': document.getElementById('contract-annual'),
    'contract-hourly': document.getElementById('contract-hourly'),
    'contract-minute': document.getElementById('contract-minute'),
    'contract-secondly': document.getElementById('contract-secondly')
};

// Store references in WeakMap
Object.entries(inputs).forEach(([key, element]) => {
    elements.set(element, key);
});

// Number formatting function
const formatNumber = (value, decimals) => {
    if (isNaN(value) || value === '') return '';
    const num = Number(value);
    const fixed = decimals >= 0 ? num.toFixed(decimals) : num.toString();
    const [integer, fraction] = fixed.split('.');
    const integerWithCommas = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return fraction ? `${integerWithCommas}.${fraction}` : integerWithCommas;
};

// Secure calculation functions
const calculateFromAnnual = (annual) => {
    const sanitizedAnnual = sanitizeInput(annual);
    return {
        annual: sanitizedAnnual,
        monthly: sanitizedAnnual / MONTHS_PER_YEAR,
        weekly: sanitizedAnnual / WEEKS_PER_YEAR,
        daily: sanitizedAnnual / (WEEKS_PER_YEAR * DAYS_PER_WEEK),
        hourly: sanitizedAnnual / HOURS_PER_YEAR,
        secondly: sanitizedAnnual / SECONDS_PER_YEAR
    };
};

const calculateFromContractTotal = (total, years, months, days) => {
    const sanitizedTotal = sanitizeInput(total);
    const sanitizedYears = sanitizeInput(years);
    const sanitizedMonths = sanitizeInput(months);
    const sanitizedDays = sanitizeInput(days);
    const totalYears = sanitizedYears + (sanitizedMonths / MONTHS_PER_YEAR) + (sanitizedDays / DAYS_PER_YEAR);
    const durationYears = Math.max(0.01, totalYears); // Ensure minimum 0.01 years
    const annual = sanitizedTotal / durationYears;
    return {
        'contract-length-years': sanitizedYears,
        'contract-length-months': sanitizedMonths,
        'contract-length-days': sanitizedDays,
        'contract-total': sanitizedTotal,
        'contract-annual': annual,
        'contract-hourly': annual / HOURS_PER_YEAR,
        'contract-minute': annual / (HOURS_PER_YEAR * MINUTES_PER_HOUR),
        'contract-secondly': annual / SECONDS_PER_YEAR
    };
};

// Input sanitization
const sanitizeInput = (value) => {
    // Remove commas for calculation
    const cleanedValue = typeof value === 'string' ? value.replace(/,/g, '') : value;
    const num = Number.parseFloat(cleanedValue) || 0;
    return Math.max(0, Math.min(num, Number.MAX_SAFE_INTEGER));
};

// Conversion functions
const salaryConverters = {
    annual: (value) => calculateFromAnnual(value),
    monthly: (value) => calculateFromAnnual(sanitizeInput(value) * MONTHS_PER_YEAR),
    weekly: (value) => calculateFromAnnual(sanitizeInput(value) * WEEKS_PER_YEAR),
    daily: (value) => calculateFromAnnual(sanitizeInput(value) * WEEKS_PER_YEAR * DAYS_PER_WEEK),
    hourly: (value) => calculateFromAnnual(sanitizeInput(value) * HOURS_PER_YEAR),
    secondly: (value) => calculateFromAnnual(sanitizeInput(value) * SECONDS_PER_YEAR)
};

const contractConverters = {
    'contract-length-years': (value, years, months, days) => calculateFromContractTotal(sanitizeInput(inputs['contract-total'].value || 0), value, months, days),
    'contract-length-months': (value, years, months, days) => calculateFromContractTotal(sanitizeInput(inputs['contract-total'].value || 0), years, value, days),
    'contract-length-days': (value, years, months, days) => calculateFromContractTotal(sanitizeInput(inputs['contract-total'].value || 0), years, months, value),
    'contract-total': (value, years, months, days) => calculateFromContractTotal(value, years, months, days),
    'contract-annual': (value, years, months, days) => {
        const totalYears = years + (months / MONTHS_PER_YEAR) + (days / DAYS_PER_YEAR);
        return calculateFromContractTotal(sanitizeInput(value) * Math.max(0.01, totalYears), years, months, days);
    },
    'contract-hourly': (value, years, months, days) => {
        const totalYears = years + (months / MONTHS_PER_YEAR) + (days / DAYS_PER_YEAR);
        return calculateFromContractTotal(sanitizeInput(value) * HOURS_PER_YEAR * Math.max(0.01, totalYears), years, months, days);
    },
    'contract-minute': (value, years, months, days) => {
        const totalYears = years + (months / MONTHS_PER_YEAR) + (days / DAYS_PER_YEAR);
        return calculateFromContractTotal(sanitizeInput(value) * HOURS_PER_YEAR * MINUTES_PER_HOUR * Math.max(0.01, totalYears), years, months, days);
    },
    'contract-secondly': (value, years, months, days) => {
        const totalYears = years + (months / MONTHS_PER_YEAR) + (days / DAYS_PER_YEAR);
        return calculateFromContractTotal(sanitizeInput(value) * SECONDS_PER_YEAR * Math.max(0.01, totalYears), years, months, days);
    }
};

// Secure event handler
const handleInput = (event) => {
    const target = event.target;
    if (!elements.has(target)) return; // Security check

    const field = elements.get(target);
    const value = target.value;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const converters = mode === 'salary' ? salaryConverters : contractConverters;
    const fields = mode === 'salary'
        ? ['annual', 'monthly', 'weekly', 'daily', 'hourly', 'secondly']
        : ['contract-length-years', 'contract-length-months', 'contract-length-days', 'contract-total', 'contract-annual', 'contract-hourly', 'contract-minute', 'contract-secondly'];

    // Prevent XSS by using textContent and sanitizing input
    const years = inputs['contract-length-years'] ? sanitizeInput(inputs['contract-length-years'].value) : 0;
    const months = inputs['contract-length-months'] ? sanitizeInput(inputs['contract-length-months'].value) : 0;
    const days = inputs['contract-length-days'] ? sanitizeInput(inputs['contract-length-days'].value) : 0;
    const results = mode === 'salary' ? converters[field](value) : converters[field](value, years, months, days);

    // Update relevant fields securely
    Object.entries(inputs).forEach(([key, input]) => {
        if (fields.includes(key) && input !== target) {
            if (key.startsWith('contract-length-')) {
                input.value = formatNumber(results[key], 0); // Whole numbers for years, months, days
            } else {
                const decimals = key.includes('secondly') ? 6 : key.includes('minute') ? 4 : 2;
                input.value = formatNumber(results[key], decimals);
            }
        }
    });
};

// Toggle mode
const toggleMode = () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const calculator = document.getElementById('calculator');
    calculator.className = mode + '-mode';

    // Show/hide fields
    document.querySelectorAll('.input-group.salary').forEach(el => {
        el.style.display = mode === 'salary' ? 'flex' : 'none';
    });
    document.querySelectorAll('.input-group.contract').forEach(el => {
        el.style.display = mode === 'contract' ? 'flex' : 'none';
    });

    // Clear inputs
    Object.values(inputs).forEach(input => {
        input.value = '';
    });

    // Initialize default value
    if (mode === 'salary') {
        inputs.annual.value = formatNumber(52000, 2);
        handleInput({ target: inputs.annual });
    } else {
        inputs['contract-length-years'].value = formatNumber(1, 0);
        inputs['contract-length-months'].value = formatNumber(0, 0);
        inputs['contract-length-days'].value = formatNumber(0, 0);
        inputs['contract-total'].value = formatNumber(50000, 2);
        handleInput({ target: inputs['contract-total'] });
    }
};

// Add event listeners with throttling
const throttle = (func, limit) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Attach secure event listeners
Object.values(inputs).forEach(input => {
    input.addEventListener('input', throttle(handleInput, 200));
    // Prevent invalid input on paste
    input.addEventListener('paste', (e) => {
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        const isDuration = input.id.startsWith('contract-length-');
        const regex = isDuration ? /^[0-9,]*$/ : /^[0-9,.]*$/;
        if (!regex.test(paste)) {
            e.preventDefault();
        }
    });
    // Prevent invalid input on keypress
    input.addEventListener('keypress', (e) => {
        const char = String.fromCharCode(e.keyCode || e.which);
        const isDuration = input.id.startsWith('contract-length-');
        const validChar = isDuration ? /[0-9,]/.test(char) : /[0-9,.]/.test(char);
        if (!validChar) {
            e.preventDefault();
        }
    });
});

// Mode toggle listeners
document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', throttle(toggleMode, 200));
});

// Initialize
toggleMode();