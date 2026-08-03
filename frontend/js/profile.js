/* ==========================================================
   profile.js — profile summary, edit form, password form UI
   ========================================================== */

async function renderProfile() {
  let profile = window.currentUser || HabitStore.loadProfile();

  if (window.ProfileAPI) {
    const res = await ProfileAPI.getProfile();
    if (res && res.success && res.data) {
      profile = res.data;
      window.currentUser = profile;
    }
  }

  const name = profile.name || "Student";
  const email = profile.email || "";
  const semester = profile.semester || "7th Semester";
  const branch = profile.branch || "Computer Science & Engineering";
  const joined = profile.createdAt ? formatDate(profile.createdAt) : profile.joined || "Recently";

  document.getElementById("profileName").textContent = name;
  document.getElementById("profileEmail").textContent = email;
  document.getElementById("profileSemester").textContent = semester;
  document.getElementById("profileBranch").textContent = branch;
  document.getElementById("profileJoined").textContent = `Joined ${joined}`;
  document.getElementById("profileAvatar").textContent = initials(name);

  document.getElementById("editName").value = name;
  document.getElementById("editEmail").value = email;
  document.getElementById("editSemester").value = semester;
  document.getElementById("editBranch").value = branch;
  document.getElementById("editGoal").value = profile.dailyGoal || 4;

  const habits = HabitStore.loadHabits();
  const plan = HabitStore.loadStudyPlan();
  const completedHabits = habits.filter((habit) => habit.completedToday).length;
  const completedTasks = plan.filter((task) => task.completed).length;

  document.getElementById("profileStreak").textContent = `${habits.reduce(
    (max, habit) => Math.max(max, habit.currentStreak),
    0
  )} days`;
  document.getElementById("profileHabitsDone").textContent = completedHabits;
  document.getElementById("profileTasksDone").textContent = completedTasks;
  document.getElementById("profileAverage").textContent = `${Math.round(
    (percentage(completedHabits, habits.length) + percentage(completedTasks, plan.length)) / 2
  )}%`;
  document.getElementById("profileBadges").textContent = "2";
}

function initProfileForms() {
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = document.getElementById("editName");
      const email = document.getElementById("editEmail");
      const goal = document.getElementById("editGoal");
      let valid = true;

      const nameError = document.getElementById("editNameError");
      if (name.value.trim().length < 2) {
        nameError.classList.add("show");
        valid = false;
      } else nameError.classList.remove("show");

      const emailError = document.getElementById("editEmailError");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        emailError.classList.add("show");
        valid = false;
      } else emailError.classList.remove("show");

      const goalError = document.getElementById("editGoalError");
      if (!goal.value || Number(goal.value) <= 0 || Number(goal.value) > 16) {
        goalError.classList.add("show");
        valid = false;
      } else goalError.classList.remove("show");

      if (!valid) {
        showToast("Please correct the highlighted fields.", "danger");
        return;
      }

      const payload = {
        name: name.value.trim(),
        bio: document.getElementById("editBranch").value.trim(),
      };

      if (window.ProfileAPI) {
        const res = await ProfileAPI.updateProfile(payload);
        if (res && res.success) {
          window.currentUser = res.data;
          showToast("Profile updated successfully.", "success");
        } else {
          showToast(res ? res.message : "Failed to update profile", "danger");
        }
      } else {
        HabitStore.saveProfile({
          ...HabitStore.loadProfile(),
          name: name.value.trim(),
          email: email.value.trim(),
          semester: document.getElementById("editSemester").value,
          branch: document.getElementById("editBranch").value.trim(),
          dailyGoal: Number(goal.value),
        });
        showToast("Profile updated.", "success");
      }

      await renderProfile();
      renderSidebar();
    });
  }

  const pwdForm = document.getElementById("passwordForm");
  if (pwdForm) {
    pwdForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const current = document.getElementById("currentPassword");
      const next = document.getElementById("newPassword");
      const confirm = document.getElementById("confirmPassword");
      let valid = true;

      const currentError = document.getElementById("currentPasswordError");
      if (!current.value) {
        currentError.classList.add("show");
        valid = false;
      } else currentError.classList.remove("show");

      const nextError = document.getElementById("newPasswordError");
      if (next.value.length < 6) {
        nextError.classList.add("show");
        valid = false;
      } else nextError.classList.remove("show");

      const confirmError = document.getElementById("confirmPasswordError");
      if (!confirm.value || confirm.value !== next.value) {
        confirmError.classList.add("show");
        valid = false;
      } else confirmError.classList.remove("show");

      if (!valid) return;

      if (window.AuthAPI) {
        const res = await AuthAPI.changePassword(current.value, next.value);
        if (res && res.success) {
          showToast("Password changed successfully.", "success");
          pwdForm.reset();
        } else {
          showToast(res ? res.message : "Password change failed.", "danger");
        }
      } else {
        pwdForm.reset();
        showToast("Password updated.", "success");
      }
    });
  }
}

document.addEventListener("app:ready", async () => {
  if (!document.getElementById("profileForm")) return;
  await renderProfile();
  initProfileForms();
});
