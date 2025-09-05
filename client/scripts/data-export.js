function safeLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return {
            getItem: (key) => localStorage.getItem(key),
            setItem: (key, value) => localStorage.setItem(key, value),
            removeItem: (key) => localStorage.removeItem(key)
        };
    } catch (e) {
        const memoryStorage = {};
        return {
            getItem: (key) => memoryStorage[key] || null,
            setItem: (key, value) => { memoryStorage[key] = value; },
            removeItem: (key) => { delete memoryStorage[key]; }
        };
    }
}

const storage = safeLocalStorage();

function showLatestSummary() {
    const summary = storage.getItem('voss_latest_summary');
    const dataDisplay = document.getElementById('dataDisplay');
    const dataContent = document.getElementById('dataContent');

    if (summary) {
        dataContent.textContent = summary;
        dataDisplay.style.display = 'block';
    } else {
        dataContent.textContent = 'No assessment data found. Please complete an assessment first.';
        dataDisplay.style.display = 'block';
    }
}

function exportAllData() {
    const userData = storage.getItem('voss_user');
    const scores = storage.getItem('voss_scores');
    const answers = storage.getItem('voss_answers');
    const results = storage.getItem('voss_assessment_results');
    const userBackup = storage.getItem('voss_user_backup');

    const allData = {
        timestamp: new Date().toISOString(),
        userData: userData ? JSON.parse(userData) : null,
        scores: scores ? JSON.parse(scores) : null,
        answers: answers ? JSON.parse(answers) : null,
        results: results ? JSON.parse(results) : null,
        userBackup: userBackup ? JSON.parse(userBackup) : null
    };

    // Display in UI
    const dataDisplay = document.getElementById('dataDisplay');
    const dataContent = document.getElementById('dataContent');
    dataContent.textContent = JSON.stringify(allData, null, 2);
    dataDisplay.style.display = 'block';

    // Create download link
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.getElementById('downloadAnchor');
    downloadAnchor.href = url;
    downloadAnchor.download = `voss-ai-assessment-${new Date().toISOString().split('T')[0]}.json`;
    document.getElementById('downloadLink').style.display = 'block';
}

function clearData() {
    if (confirm('Are you sure you want to clear all local assessment data? This cannot be undone.')) {
        const keys = ['voss_user', 'voss_scores', 'voss_answers', 'voss_assessment_results', 'voss_user_backup', 'voss_latest_summary'];
        keys.forEach(key => storage.removeItem(key));
        alert('All local assessment data has been cleared.');
        document.getElementById('dataDisplay').style.display = 'none';
        document.getElementById('downloadLink').style.display = 'none';
    }
}

// Global functions for console access
window.showDataSummary = () => {
    const summary = storage.getItem('voss_latest_summary');
    console.log('Latest assessment summary:', summary);
    return summary;
};

window.getAllStoredData = () => {
    const userData = storage.getItem('voss_user');
    const scores = storage.getItem('voss_scores');
    const answers = storage.getItem('voss_answers');
    const results = storage.getItem('voss_assessment_results');

    const data = {
        userData: userData ? JSON.parse(userData) : null,
        scores: scores ? JSON.parse(scores) : null,
        answers: answers ? JSON.parse(answers) : null,
        results: results ? JSON.parse(results) : null
    };

    console.log('All stored data:', data);
    return data;
};