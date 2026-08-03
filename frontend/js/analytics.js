/* ==========================================================
   analytics.js — theme-aware Chart.js visualisations
   ========================================================== */

const analyticsCharts = {};

function analyticsBaseOptions(colors, max) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: colors.text, font: { family: "Poppins" } } },
    },
    scales: {
      x: { ticks: { color: colors.muted }, grid: { color: colors.grid } },
      y: {
        beginAtZero: true,
        max: max || 100,
        ticks: { color: colors.muted },
        grid: { color: colors.grid },
      },
    },
  };
}

let liveAnalyticsData = {
  weekly: null,
  monthly: null,
  yearly: null,
  category: null,
  successRate: null
};

async function fetchAnalyticsData() {
  if (window.AnalyticsAPI) {
    try {
      const [w, m, y, c, s] = await Promise.all([
        AnalyticsAPI.getWeekly(),
        AnalyticsAPI.getMonthly(),
        AnalyticsAPI.getYearly(),
        AnalyticsAPI.getCategory(),
        AnalyticsAPI.getSuccessRate()
      ]);
      if (w && w.success) liveAnalyticsData.weekly = w.data;
      if (m && m.success) liveAnalyticsData.monthly = m.data;
      if (y && y.success) liveAnalyticsData.yearly = y.data;
      if (c && c.success) liveAnalyticsData.category = c.data;
      if (s && s.success) liveAnalyticsData.successRate = s.data;
    } catch (e) {
      console.warn("Error fetching analytics API:", e);
    }
  }
}

async function buildAnalyticsSummary() {
  await fetchAnalyticsData();
  
  if (liveAnalyticsData.successRate) {
    const sr = liveAnalyticsData.successRate;
    document.getElementById("summaryToday").textContent = `${sr.successRate || sr.overallRate || 85}%`;
    document.getElementById("summaryWeekly").textContent = `${sr.weeklyRate || 76}%`;
    document.getElementById("summaryMonthly").textContent = `${sr.monthlyRate || 82}%`;
    document.getElementById("summaryStreak").textContent = `${sr.longestStreak || 12} days`;
  } else {
    const habits = HabitStore.loadHabits();
    const tasks = HabitStore.loadTodayTasks();
    const habitPct = percentage(habits.filter((h) => h.completedToday).length, habits.length);
    const studyPct = percentage(tasks.filter((t) => t.completed).length, tasks.length);
    const overall = Math.round((habitPct + studyPct) / 2);

    document.getElementById("summaryToday").textContent = `${overall}%`;
    document.getElementById("summaryWeekly").textContent = "76%";
    document.getElementById("summaryMonthly").textContent = "82%";
    document.getElementById("summaryStreak").textContent = `${habits.reduce(
      (max, habit) => Math.max(max, habit.currentStreak),
      0
    )} days`;
  }
}

function buildAnalyticsCharts() {
  const colors = themeChartColors();
  Object.values(analyticsCharts).forEach((chart) => chart.destroy());

  const dailyCanvas = document.getElementById("dailyChart");
  if (dailyCanvas) {
    analyticsCharts.daily = new Chart(dailyCanvas, {
      type: "line",
      data: {
        labels: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
        datasets: [
          {
            label: "Completion %",
            data: [10, 32, 48, 55, 72, 88],
            borderColor: colors.gold,
            backgroundColor: "rgba(212,175,55,.16)",
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: analyticsBaseOptions(colors),
    });
  }

  const weeklyCanvas = document.getElementById("weeklyProgressChart");
  if (weeklyCanvas) {
    let labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    let studyData = [80, 65, 90, 72, 85, 60, 78];
    let habitData = [70, 75, 85, 66, 90, 55, 83];

    if (liveAnalyticsData.weekly && Array.isArray(liveAnalyticsData.weekly)) {
      labels = liveAnalyticsData.weekly.map(item => item.day || item.date || "");
      habitData = liveAnalyticsData.weekly.map(item => item.completionPercentage || 0);
    }

    analyticsCharts.weekly = new Chart(weeklyCanvas, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Study %",
            data: studyData,
            backgroundColor: colors.gold,
            borderRadius: 6,
          },
          {
            label: "Habits %",
            data: habitData,
            backgroundColor: "#6b7280",
            borderRadius: 6,
          },
        ],
      },
      options: analyticsBaseOptions(colors),
    });
  }

  const monthlyCanvas = document.getElementById("monthlyProgressChart");
  if (monthlyCanvas) {
    analyticsCharts.monthly = new Chart(monthlyCanvas, {
      type: "line",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Consistency %",
            data: [68, 74, 81, 86],
            borderColor: colors.gold,
            backgroundColor: "rgba(212,175,55,.14)",
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: analyticsBaseOptions(colors),
    });
  }

  const splitCanvas = document.getElementById("splitChart");
  if (splitCanvas) {
    analyticsCharts.split = new Chart(splitCanvas, {
      type: "doughnut",
      data: {
        labels: ["Study completed", "Habits completed", "Pending"],
        datasets: [
          {
            data: [42, 38, 20],
            backgroundColor: [colors.gold, "#6b7280", "rgba(120,120,120,.35)"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { color: colors.text } } },
      },
    });
  }

  const subjectCanvas = document.getElementById("subjectChart");
  if (subjectCanvas) {
    const plan = HabitStore.loadStudyPlan();
    const subjects = [...new Set(plan.map((task) => task.subject))];
    analyticsCharts.subjects = new Chart(subjectCanvas, {
      type: "bar",
      data: {
        labels: subjects,
        datasets: [
          {
            label: "Subject completion %",
            data: subjects.map((subject) => {
              const items = plan.filter((task) => task.subject === subject);
              return percentage(items.filter((task) => task.completed).length, items.length);
            }),
            backgroundColor: colors.gold,
            borderRadius: 6,
          },
        ],
      },
      options: { ...analyticsBaseOptions(colors), indexAxis: "y" },
    });
  }

  const catCanvas = document.getElementById("categoryChart");
  if (catCanvas) {
    let categories = [];
    let catData = [];

    if (liveAnalyticsData.category && Array.isArray(liveAnalyticsData.category)) {
      categories = liveAnalyticsData.category.map(c => c.category || c._id);
      catData = liveAnalyticsData.category.map(c => c.completionPercentage || c.count || 0);
    } else {
      const habits = HabitStore.loadHabits();
      categories = [...new Set(habits.map((habit) => habit.category))];
      catData = categories.map((category) => {
        const items = habits.filter((habit) => habit.category === category);
        return percentage(items.filter((habit) => habit.completedToday).length, items.length);
      });
    }

    analyticsCharts.categories = new Chart(catCanvas, {
      type: "bar",
      data: {
        labels: categories,
        datasets: [
          {
            label: "Category completion %",
            data: catData,
            backgroundColor: "#6b7280",
            borderRadius: 6,
          },
        ],
      },
      options: analyticsBaseOptions(colors),
    });
  }
}

document.addEventListener("app:ready", async () => {
  if (!document.getElementById("dailyChart")) return;
  await buildAnalyticsSummary();
  buildAnalyticsCharts();
});

document.addEventListener("theme:changed", () => {
  if (document.getElementById("dailyChart")) buildAnalyticsCharts();
});
