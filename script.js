/*
  Dashboard de notas escolares
  - JavaScript puro (sem dependencias)
  - Media ponderada, projecoes e salvamento local
*/

const STORAGE_KEY = "student-grade-system-js:v2";

const DEFAULT_GRADES = [
  { label: "Prova 1", score: 8.5, weight: 1 },
  { label: "Trabalho em grupo", score: 7.2, weight: 1.2 },
  { label: "Prova 2", score: 9.1, weight: 1 },
];

const DEFAULT_STATE = {
  student: {
    name: "Ana Luiza Ribeiro",
    age: 16,
  },
  settings: {
    maxScore: 10,
    passThreshold: 7,
  },
  grades: DEFAULT_GRADES,
};

const createId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `grade-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const cloneDefaultState = () => ({
  student: { ...DEFAULT_STATE.student },
  settings: { ...DEFAULT_STATE.settings },
  grades: DEFAULT_GRADES.map((grade) => ({ ...grade, id: createId() })),
});

const sanitizeState = (raw) => {
  if (!raw || typeof raw !== "object") {
    return cloneDefaultState();
  }

  const settings = raw.settings ?? {};
  const safeSettings = {
    maxScore: clamp(toNumber(settings.maxScore, DEFAULT_STATE.settings.maxScore), 1, 100),
    passThreshold: toNumber(settings.passThreshold, DEFAULT_STATE.settings.passThreshold),
  };

  safeSettings.passThreshold = clamp(
    safeSettings.passThreshold,
    0,
    safeSettings.maxScore
  );

  const student = raw.student ?? {};
  const safeStudent = {
    name:
      typeof student.name === "string" && student.name.trim()
        ? student.name.trim()
        : DEFAULT_STATE.student.name,
    age: clamp(Math.round(toNumber(student.age, DEFAULT_STATE.student.age)), 5, 120),
  };

  const hasGradesArray = Array.isArray(raw.grades);
  const grades = hasGradesArray ? raw.grades : [];
  const safeGrades = grades.map((grade, index) => ({
    id: typeof grade.id === "string" ? grade.id : createId(),
    label:
      typeof grade.label === "string" && grade.label.trim()
        ? grade.label.trim()
        : `Avaliacao ${index + 1}`,
    score: clamp(toNumber(grade.score, 0), 0, safeSettings.maxScore),
    weight: clamp(toNumber(grade.weight, 1), 0.1, 10),
  }));

  return {
    student: safeStudent,
    settings: safeSettings,
    grades: hasGradesArray ? safeGrades : cloneDefaultState().grades,
  };
};

const loadState = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return cloneDefaultState();
  }
  try {
    return sanitizeState(JSON.parse(raw));
  } catch (error) {
    return cloneDefaultState();
  }
};

const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

let state = loadState();

const elements = {
  year: document.querySelector("[data-year]"),
  studentName: document.querySelector("[data-student-name]"),
  studentAge: document.querySelector("[data-student-age]"),
  maxScore: document.querySelector("[data-max-score]"),
  passThreshold: document.querySelector("[data-pass-threshold]"),
  resetButton: document.querySelector("[data-reset]"),
  clearGrades: document.querySelector("[data-clear-grades]"),
  gradeForm: document.querySelector("[data-grade-form]"),
  gradeLabel: document.querySelector("[data-grade-label]"),
  gradeScore: document.querySelector("[data-grade-score]"),
  gradeWeight: document.querySelector("[data-grade-weight]"),
  gradeList: document.querySelector("[data-grade-list]"),
  emptyState: document.querySelector("[data-empty]"),
  average: document.querySelector("[data-average]"),
  averageBar: document.querySelector("[data-average-bar]"),
  status: document.querySelector("[data-status]"),
  message: document.querySelector("[data-message]"),
  count: document.querySelector("[data-count]"),
  min: document.querySelector("[data-min]"),
  max: document.querySelector("[data-max]"),
  margin: document.querySelector("[data-margin]"),
  required: document.querySelector("[data-required]"),
};

const formatScore = (value, decimals = 1) => {
  if (!Number.isFinite(value)) {
    return "--";
  }
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const getStats = (grades) => {
  if (!grades.length) {
    return {
      count: 0,
      min: 0,
      max: 0,
      average: 0,
      totalWeight: 0,
      sumWeighted: 0,
    };
  }

  const initial = {
    sumWeighted: 0,
    totalWeight: 0,
    min: Number.POSITIVE_INFINITY,
    max: 0,
  };

  const totals = grades.reduce((acc, grade) => {
    acc.sumWeighted += grade.score * grade.weight;
    acc.totalWeight += grade.weight;
    acc.min = Math.min(acc.min, grade.score);
    acc.max = Math.max(acc.max, grade.score);
    return acc;
  }, initial);

  const average = totals.totalWeight ? totals.sumWeighted / totals.totalWeight : 0;

  return {
    count: grades.length,
    min: totals.min,
    max: totals.max,
    average,
    totalWeight: totals.totalWeight,
    sumWeighted: totals.sumWeighted,
  };
};

const getStatus = (stats, settings) => {
  if (stats.count === 0) {
    return {
      label: "Sem notas",
      className: "status--neutral",
      message: "Adicione avaliacoes para calcular a media e as projecoes.",
    };
  }

  if (stats.average >= settings.passThreshold) {
    return {
      label: "Aprovado",
      className: "status--approved",
      message: `Otimo trabalho! Voce esta ${formatScore(
        stats.average - settings.passThreshold,
        1
      )} ponto(s) acima da media de aprovacao.`,
    };
  }

  return {
    label: "Em recuperacao",
    className: "status--warning",
    message: `Faltam ${formatScore(
      settings.passThreshold - stats.average,
      1
    )} ponto(s) para atingir a media de aprovacao.`,
  };
};

const getRequiredNextScore = (stats, settings) => {
  if (stats.count === 0) {
    return settings.passThreshold;
  }
  return settings.passThreshold * (stats.totalWeight + 1) - stats.sumWeighted;
};

const updateYear = () => {
  if (elements.year) {
    elements.year.textContent = `Atualizado ${new Date().getFullYear()}`;
  }
};

const syncInputs = () => {
  if (elements.studentName) {
    elements.studentName.value = state.student.name;
  }
  if (elements.studentAge) {
    elements.studentAge.value = state.student.age;
  }
  if (elements.maxScore) {
    elements.maxScore.value = state.settings.maxScore;
  }
  if (elements.passThreshold) {
    elements.passThreshold.value = state.settings.passThreshold;
    elements.passThreshold.max = state.settings.maxScore;
  }
  if (elements.gradeScore) {
    elements.gradeScore.max = state.settings.maxScore;
  }
  if (elements.gradeWeight && !elements.gradeWeight.value) {
    elements.gradeWeight.value = "1";
  }
};

const renderGrades = () => {
  if (!elements.gradeList || !elements.emptyState) {
    return;
  }

  elements.gradeList.innerHTML = "";

  if (!state.grades.length) {
    elements.emptyState.hidden = false;
    return;
  }

  elements.emptyState.hidden = true;

  state.grades.forEach((grade) => {
    const item = document.createElement("li");
    item.className = "grade-item";
    item.dataset.gradeId = grade.id;

    const info = document.createElement("div");
    info.className = "grade-item__info";

    const title = document.createElement("strong");
    title.textContent = grade.label;

    const meta = document.createElement("span");
    meta.textContent = `Nota ${formatScore(grade.score, 1)} · Peso ${formatScore(
      grade.weight,
      1
    )}`;

    info.append(title, meta);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.dataset.remove = "true";
    button.setAttribute("aria-label", `Remover ${grade.label}`);
    button.textContent = "Remover";

    item.append(info, button);
    elements.gradeList.appendChild(item);
  });
};

const renderSummary = () => {
  const stats = getStats(state.grades);
  const status = getStatus(stats, state.settings);

  if (elements.average) {
    elements.average.textContent =
      stats.count === 0 ? "--" : formatScore(stats.average, 2);
  }

  if (elements.averageBar) {
    const progress = stats.count
      ? Math.min((stats.average / state.settings.maxScore) * 100, 100)
      : 0;
    elements.averageBar.style.width = `${progress}%`;
  }

  if (elements.status) {
    elements.status.textContent = status.label;
    elements.status.className = `status ${status.className}`;
  }

  if (elements.message) {
    elements.message.textContent = status.message;
  }

  if (elements.count) {
    elements.count.textContent = stats.count.toString();
  }

  if (elements.min) {
    elements.min.textContent = stats.count ? formatScore(stats.min, 1) : "--";
  }

  if (elements.max) {
    elements.max.textContent = stats.count ? formatScore(stats.max, 1) : "--";
  }

  if (elements.margin) {
    if (stats.count === 0) {
      elements.margin.textContent = "--";
    } else {
      const margin = stats.average - state.settings.passThreshold;
      const marginText =
        margin >= 0
          ? `+${formatScore(margin, 1)} acima`
          : `${formatScore(Math.abs(margin), 1)} abaixo`;
      elements.margin.textContent = marginText;
    }
  }

  if (elements.required) {
    if (stats.count === 0) {
      elements.required.textContent = formatScore(state.settings.passThreshold, 1);
    } else {
      const required = getRequiredNextScore(stats, state.settings);
      if (required <= 0) {
        elements.required.textContent = "Qualquer nota";
      } else if (required > state.settings.maxScore) {
        elements.required.textContent = "Acima da nota maxima";
      } else {
        elements.required.textContent = formatScore(required, 1);
      }
    }
  }
};

const render = () => {
  updateYear();
  renderGrades();
  renderSummary();
};

const handleStudentInputs = () => {
  if (elements.studentName) {
    elements.studentName.addEventListener("input", (event) => {
      state.student.name = event.target.value.trim();
      saveState(state);
    });
  }

  if (elements.studentAge) {
    elements.studentAge.addEventListener("input", (event) => {
      const value = clamp(toNumber(event.target.value, state.student.age), 5, 120);
      state.student.age = value;
      event.target.value = value;
      saveState(state);
    });
  }
};

const handleSettingsInputs = () => {
  if (elements.maxScore) {
    elements.maxScore.addEventListener("input", (event) => {
      const value = clamp(toNumber(event.target.value, state.settings.maxScore), 1, 100);
      state.settings.maxScore = value;
      if (state.settings.passThreshold > value) {
        state.settings.passThreshold = value;
      }
      state.grades = state.grades.map((grade) => ({
        ...grade,
        score: clamp(grade.score, 0, value),
      }));
      event.target.value = value;
      if (elements.passThreshold) {
        elements.passThreshold.max = value;
        elements.passThreshold.value = state.settings.passThreshold;
      }
      if (elements.gradeScore) {
        elements.gradeScore.max = value;
      }
      saveState(state);
      renderSummary();
      renderGrades();
    });
  }

  if (elements.passThreshold) {
    elements.passThreshold.addEventListener("input", (event) => {
      const value = clamp(toNumber(event.target.value, state.settings.passThreshold), 0, state.settings.maxScore);
      state.settings.passThreshold = value;
      event.target.value = value;
      saveState(state);
      renderSummary();
    });
  }
};

const handleGradeForm = () => {
  if (!elements.gradeForm) {
    return;
  }

  elements.gradeForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const label = elements.gradeLabel?.value.trim();
    const scoreValue = toNumber(elements.gradeScore?.value, NaN);
    const weightValue = toNumber(elements.gradeWeight?.value, 1);

    if (!Number.isFinite(scoreValue)) {
      elements.gradeScore?.focus();
      return;
    }

    const newGrade = {
      id: createId(),
      label: label || `Avaliacao ${state.grades.length + 1}`,
      score: clamp(scoreValue, 0, state.settings.maxScore),
      weight: clamp(weightValue, 0.1, 10),
    };

    state.grades = [...state.grades, newGrade];
    saveState(state);

    if (elements.gradeLabel) {
      elements.gradeLabel.value = "";
    }
    if (elements.gradeScore) {
      elements.gradeScore.value = "";
    }
    if (elements.gradeWeight) {
      elements.gradeWeight.value = "1";
    }

    renderGrades();
    renderSummary();
  });
};

const handleGradeRemoval = () => {
  if (!elements.gradeList) {
    return;
  }

  elements.gradeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) {
      return;
    }

    const item = button.closest("[data-grade-id]");
    const gradeId = item?.dataset.gradeId;
    if (!gradeId) {
      return;
    }

    state.grades = state.grades.filter((grade) => grade.id !== gradeId);
    saveState(state);
    renderGrades();
    renderSummary();
  });
};

const handleReset = () => {
  if (!elements.resetButton) {
    return;
  }

  elements.resetButton.addEventListener("click", () => {
    const confirmed = window.confirm("Deseja restaurar os dados iniciais?");
    if (!confirmed) {
      return;
    }

    state = cloneDefaultState();
    saveState(state);
    syncInputs();
    render();
  });
};

const handleClearGrades = () => {
  if (!elements.clearGrades) {
    return;
  }

  elements.clearGrades.addEventListener("click", () => {
    const confirmed = window.confirm("Deseja remover todas as avaliacoes?");
    if (!confirmed) {
      return;
    }

    state = { ...state, grades: [] };
    saveState(state);
    renderGrades();
    renderSummary();
  });
};

const init = () => {
  syncInputs();
  render();
  handleStudentInputs();
  handleSettingsInputs();
  handleGradeForm();
  handleGradeRemoval();
  handleReset();
  handleClearGrades();
};

init();
