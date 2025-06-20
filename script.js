const hyperfocus = {
    timer: null,
    startTime: null,
    sessionName: '',
    sessions: JSON.parse(localStorage.getItem('hyperfocusSessions')) || [],
    chart: null,

    start() {
        this.sessionName = prompt("Please add your session name for initiating your hyperfocus session:");
        if (!this.sessionName) {
            alert("Session name is required to start the timer.");
            return;
        }
        alert(`Your session for this hyperfocus has started.`);
        this.startTime = Date.now();
        this.timer = setInterval(() => {
            this.updateTimerDisplay();
        }, 10);
        document.getElementById('timerDisplay').classList.add('active');
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
    },

    stop() {
        clearInterval(this.timer);
        const duration = (Date.now() - this.startTime) / 1000;
        const focusRating = prompt("Rate your focus (1-10):");
        const rating = parseInt(focusRating) || 5;
        this.sessions.push({ sessionName: this.sessionName, duration, timestamp: new Date().toISOString(), focusRating: rating });
        localStorage.setItem('hyperfocusSessions', JSON.stringify(this.sessions));
        this.updateTimerDisplay(0);
        document.getElementById('timerDisplay').classList.remove('active');
        document.getElementById('startButton').disabled = false;
        document.getElementById('stopButton').disabled = true;

        // Provide session analysis
        const avgDuration = this.sessions.reduce((sum, session) => sum + session.duration, 0) / this.sessions.length;
        const estimatedNextDuration = avgDuration * 0.9; // Estimate 10% less time for the next session
        alert(`Here's the analysis for the session "${this.sessionName}":
- You have taken ${(duration / 60).toFixed(2)} minutes to complete the session.
- Next estimated session duration to lower the time: ${(estimatedNextDuration / 60).toFixed(2)} minutes.`);

        this.renderAnalytics();
        this.renderSessionHistory();
    },

    updateTimerDisplay(time = Date.now() - this.startTime) {
        const ms = Math.floor(time % 1000);
        const sec = Math.floor((time / 1000) % 60);
        const min = Math.floor((time / (1000 * 60)) % 60);
        const hr = Math.floor(time / (1000 * 60 * 60));
        document.getElementById('timerDisplay').innerText = `${hr.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${ms.toString().padStart(3, '0')}`;
    },

    getAnalyticsSummary() {
        const totalSessions = this.sessions.length;
        const avgDuration = this.sessions.reduce((sum, session) => sum + session.duration, 0) / 60 / totalSessions || 0;
        const avgFocus = this.sessions.reduce((sum, session) => sum + session.focusRating, 0) / totalSessions || 0;
        return { totalSessions, avgDuration, avgFocus };
    },

    renderAnalytics() {
        const { totalSessions, avgDuration, avgFocus } = this.getAnalyticsSummary();
        document.getElementById('totalSessions').innerText = totalSessions;
        document.getElementById('avgDuration').innerText = avgDuration.toFixed(2);
        document.getElementById('avgFocus').innerText = avgFocus.toFixed(2);

        this.renderChart();
    },

    renderChart() {
        const ctx = document.getElementById('analyticsChart').getContext('2d');

        if (this.chart) {
            this.chart.destroy();
        }

        const durations = this.sessions.slice(-10).map(session => session.duration / 60);
        const ratings = this.sessions.slice(-10).map(session => session.focusRating);
        const labels = this.sessions.slice(-10).map(session => session.sessionName);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Duration (minutes)',
                        data: durations,
                        backgroundColor: 'rgba(0, 0, 255, 0.5)',
                        borderColor: 'rgba(0, 0, 255, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Focus Rating',
                        data: ratings,
                        type: 'line',
                        backgroundColor: 'rgba(0, 255, 0, 0.5)',
                        borderColor: 'rgba(0, 255, 0, 1)',
                        borderWidth: 2,
                        fill: false,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Duration (minutes)'
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Focus Rating'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    },

    renderSessionHistory() {
        const sessionList = document.getElementById('sessionList');
        sessionList.innerHTML = '';
        this.sessions.forEach((session, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                ${session.sessionName} - ${(session.duration / 60).toFixed(2)} minutes - Focus: ${session.focusRating}
                <button onclick="hyperfocus.updateSession(${index})">Update</button>
            `;
            sessionList.appendChild(listItem);
        });
    },

    updateSession(index) {
        const session = this.sessions[index];
        const newDuration = prompt(`Enter new duration for "${session.sessionName}" (in seconds):`, session.duration);
        const newFocusRating = prompt(`Enter new focus rating for "${session.sessionName}" (1-10):`, session.focusRating);

        if (newDuration !== null && newFocusRating !== null) {
            session.duration = parseFloat(newDuration) || session.duration;
            session.focusRating = parseInt(newFocusRating) || session.focusRating;
            localStorage.setItem('hyperfocusSessions', JSON.stringify(this.sessions));
            this.renderAnalytics();
            this.renderSessionHistory();
        }
    }
};

document.getElementById('startButton').addEventListener('click', () => hyperfocus.start());
document.getElementById('stopButton').addEventListener('click', () => hyperfocus.stop());
document.getElementById('toggleAnalyticsButton').addEventListener('click', () => {
    const analyticsSection = document.getElementById('analyticsSection');
    analyticsSection.classList.toggle('active');
    if (analyticsSection.classList.contains('active')) {
        hyperfocus.renderAnalytics();
        hyperfocus.renderSessionHistory();
    }
});

window.onload = () => {
    hyperfocus.renderAnalytics();
    hyperfocus.renderSessionHistory();
};
