const criteriaIds = ['c12', 'c13', 'c14', 'c15', 'c23', 'c24', 'c25', 'c34', 'c35', 'c45'];

const alternativeIds = [
  ['a11', 'a12', 'a13', 'a14', 'a15'],
  ['a21', 'a22', 'a23', 'a24', 'a25'],
  ['a31', 'a32', 'a33', 'a34', 'a35'],
  ['a41', 'a42', 'a43', 'a44', 'a45']
];

const positions = [
  [0, 1], [0, 2], [0, 3], [0, 4],
  [1, 2], [1, 3], [1, 4],
  [2, 3], [2, 4],
  [3, 4]
];

const defaultCriteriaValues = {
  c12: 3, c13: 5, c14: 7, c15: 7,
  c23: 3, c24: 5, c25: 5,
  c34: 3, c35: 3,
  c45: 3
};

const defaultAlternativeValues = {
  a11: 8, a12: 7, a13: 6, a14: 8, a15: 4,
  a21: 3, a22: 4, a23: 7, a24: 5, a25: 5,
  a31: 2, a32: 6, a33: 4, a34: 6, a35: 7,
  a41: 5, a42: 5, a43: 8, a44: 7, a45: 6
};

let pairwiseMatrix = [];
let weights = [];
let alternativesMatrix = [];
let isConsistent = true; 

function normalizeMatrix(matrix) {
  const n = matrix.length;
  const colSums = Array(n).fill(0);
  const normalized = Array.from({ length: n }, () => Array(n).fill(0));

  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += matrix[i][j];
    }
  }

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      normalized[i][j] = colSums[j] ? matrix[i][j] / colSums[j] : 0;
    }
  }
  return normalized;
}

function calculateWeights(normalized) {
  const weights = normalized.map(row => row.reduce((sum, val) => sum + val, 0) / normalized.length);
  const weightSum = weights.reduce((sum, val) => sum + val, 0);
  return weights.map(w => weightSum ? w / weightSum : 0);
}

function calculateConsistencyRatio(matrix, weights) {
  const n = matrix.length;
  const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
  let Aw = Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Aw[i] += matrix[i][j] * weights[j];
    }
  }

  const lambdaMax = Aw.reduce((sum, val, i) => sum + (weights[i] ? val / weights[i] : 0), 0) / n;
  const CI = (lambdaMax - n) / (n - 1);
  const CR = RI[n - 1] ? CI / RI[n - 1] : 0;
  return { lambdaMax, CI, CR };
}

function updatePairwiseMatrix() {
  pairwiseMatrix = Array(5).fill().map(() => Array(5).fill(0));
  for (let i = 0; i < 5; i++) pairwiseMatrix[i][i] = 1;

  criteriaIds.forEach((id, k) => {
    const el = document.getElementById(id);
    if (!el) {
      console.error(`Input ${id} not found`);
      throw new Error(`Input ${id} not found`);
    }
    const val = parseFloat(el.value);
    if (isNaN(val) || val < 1 || val > 9) {
      alert(`Ô ${id} phải nhập số từ 1 đến 9!`);
      throw new Error('Invalid input');
    }
    const [i, j] = positions[k];
    pairwiseMatrix[i][j] = val;
    pairwiseMatrix[j][i] = 1 / val;
  });
}

function updateAlternativesMatrix() {
  alternativesMatrix = alternativeIds.map(row => 
    row.map(id => {
      const el = document.getElementById(id);
      if (!el) {
        console.error(`Input ${id} not found`);
        throw new Error(`Input ${id} not found`);
      }
      const val = parseFloat(el.value);
      if (isNaN(val) || val < 1 || val > 10) {
        alert(`Điểm ô ${id} phải từ 1 đến 10!`);
        throw new Error('Invalid input');
      }
      return val;
    })
  );
}

function checkDynamicConsistency() {
  const consistencyWarning = document.getElementById('consistency-warning') || document.createElement('div');
  consistencyWarning.id = 'consistency-warning';
  let warnings = [];

  for (let i = 0; i < 5; i++) {
    const rowSum = pairwiseMatrix[i].reduce((sum, val) => sum + val, 0);
    const expectedSum = 5 * weights[i];
    if (expectedSum && Math.abs(rowSum - expectedSum) / expectedSum > 0.2) {
      warnings.push(`Tiêu chí ${i + 1} có thể không nhất quán.`);
    }
  }

  consistencyWarning.innerHTML = warnings.length ? `
    <div style="color: orange; padding: 10px; margin: 10px 0; border: 1px solid orange;">
      <p><strong>Cảnh báo:</strong></p>
      <ul>${warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      <p>Vui lòng kiểm tra lại các giá trị so sánh!</p>
    </div>` : '';
  
  const consistencyResult = document.getElementById('consistency-result');
  if (consistencyResult) consistencyResult.appendChild(consistencyWarning);
}

function lockAlternativesTable() {
  alternativeIds.flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  const statusEl = document.getElementById('alternatives-status');
  if (statusEl) {
    statusEl.innerHTML = `
      <p style="color: red;">Ma trận không nhất quán (CR > 0.1). Vui lòng điều chỉnh bảng so sánh cặp tiêu chí!</p>
    `;
  }
}

function unlockAlternativesTable() {
  alternativeIds.flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = false;
  });
  const statusEl = document.getElementById('alternatives-status');
  if (statusEl) {
    statusEl.innerHTML = `
      <p style="color: green;">Ma trận hợp lệ (CR ≤ 0.1). Bạn có thể nhập điểm đánh giá phương tiện.</p>
    `;
  }
}

function clearResults() {
  const rankingTableBody = document.querySelector('#ranking-table tbody');
  if (rankingTableBody) rankingTableBody.innerHTML = '';
  const bestOption = document.getElementById('best-option');
  if (bestOption) bestOption.innerHTML = '';
}

function calculateAHP() {
  console.log('calculateAHP called');
  try {
    updatePairwiseMatrix();
    console.log('Pairwise Matrix:', pairwiseMatrix);
    const normalized = normalizeMatrix(pairwiseMatrix);
    console.log('Normalized Matrix:', normalized);
    weights = calculateWeights(normalized);
    console.log('Weights:', weights);
    const consistency = calculateConsistencyRatio(pairwiseMatrix, weights);
    console.log('Consistency:', consistency);

    weights.forEach((weight, i) => {
      const weightEl = document.getElementById(`weight${i + 1}`);
      if (weightEl) {
        weightEl.textContent = weight.toFixed(3);
        console.log(`Updated weight${i + 1}: ${weight.toFixed(3)}`);
      } else {
        console.error(`Element weight${i + 1} not found`);
      }
    });
    const weightSumEl = document.getElementById('weight-sum');
    if (weightSumEl) {
      const sum = weights.reduce((sum, val) => sum + val, 0);
      weightSumEl.textContent = sum.toFixed(3);
      console.log(`Updated weight-sum: ${sum.toFixed(3)}`);
    } else {
      console.error('Element weight-sum not found');
    }

    const consistencyResult = document.getElementById('consistency-result');
    if (consistencyResult) {
      consistencyResult.innerHTML = consistency.CR <= 0.1 ? `
        <p style="color: green;">
          CR: <span id="cr-value">${consistency.CR.toFixed(3)}</span> ≤ 0.1 - Ma trận hợp lệ ✅
        </p>` : `
        <p style="color: red;">
          CR: <span id="cr-value">${consistency.CR.toFixed(3)}</span> > 0.1 - Ma trận không hợp lệ ❌
          <br>Vui lòng điều chỉnh giá trị!
        </p>`;
      console.log(`Updated consistency result: CR = ${consistency.CR.toFixed(3)}`);
    } else {
      console.error('Element consistency-result not found');
    }

    isConsistent = consistency.CR <= 0.1;
    if (isConsistent) {
      unlockAlternativesTable();
      calculateSAW();
    } else {
      lockAlternativesTable();
      clearResults();
    }

    checkDynamicConsistency();
  } catch (e) {
    console.error('Lỗi trong calculateAHP:', e);
  }
}

function normalizeAlternativesMatrix(matrix) {
  const m = matrix.length;
  const n = matrix[0].length;
  const normalized = Array(m).fill().map(() => Array(n).fill(0));

  for (let j = 0; j < n; j++) {
    const values = matrix.map(row => row[j]);
    if (j === 0 || j === 1) {
      const minVal = Math.min(...values);
      for (let i = 0; i < m; i++) {
        normalized[i][j] = minVal / matrix[i][j];
      }
    } else {
      const maxVal = Math.max(...values);
      for (let i = 0; i < m; i++) {
        normalized[i][j] = maxVal ? matrix[i][j] / maxVal : 0;
      }
    }
  }
  return normalized;
}

function calculateWeightedSum(normMatrix, weights) {
  return normMatrix.map(row => 
    row.reduce((sum, val, j) => sum + val * weights[j], 0)
  );
}

function calculateSAW() {
  console.log('calculateSAW called');
  if (!isConsistent) {
    console.log('SAW skipped: Matrix is not consistent');
    return;
  }
  try {
    updateAlternativesMatrix();
    const normMatrix = normalizeAlternativesMatrix(alternativesMatrix);
    const scores = calculateWeightedSum(normMatrix, weights);

    const vehicles = [
      { name: "Ô tô", score: scores[0], icon: "car" },
      { name: "Xe máy", score: scores[1], icon: "motorcycle" },
      { name: "Xe bus, Metro", score: scores[2], icon: "bus" },
      { name: "Xe công nghệ", score: scores[3], icon: "taxi" }
    ].sort((a, b) => b.score - a.score);

    const rankingTableBody = document.querySelector('#ranking-table tbody');
    if (rankingTableBody) {
      rankingTableBody.innerHTML = vehicles.map((v, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${v.name}</td>
          <td>${v.score.toFixed(3)}</td>
        </tr>
      `).join('');
    }

    const bestOption = document.getElementById('best-option');
    if (bestOption) {
      const best = vehicles[0];
      bestOption.innerHTML = `
        <h3>Lựa chọn tốt nhất:</h3>
        <div class="vehicle-card">
          <div class="vehicle-icon"><i class="fas fa-${best.icon}"></i></div>
          <div class="vehicle-details">
            <h4>${best.name}</h4>
            <p>Phù hợp nhất với các tiêu chí đã đánh giá</p>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${best.score * 100}%;"></div>
            </div>
            <p>Điểm: ${best.score.toFixed(3)}</p>
          </div>
        </div>
      `;
    }
  } catch (e) {
    console.error('Lỗi trong calculateSAW:', e);
  }
}

function updateDistance() {
  const distanceEl = document.getElementById('distance');
  const recommend = document.getElementById('distance-recommendation');
  if (distanceEl && recommend) {
    const distance = distanceEl.value;
    recommend.innerHTML = distance === 'short' ? 
      "<p>Với quãng đường ngắn (< 5km): Xe công nghệ hoặc xe máy được ưu tiên nhờ chi phí thấp và tiện lợi.</p>" :
      distance === 'medium' ? 
      "<p>Với quãng đường trung bình (5-15km): Xe máy và xe bus cân bằng giữa chi phí và thời gian.</p>" :
      "<p>Với quãng đường dài (> 15km): Ô tô hoặc xe công nghệ phù hợp nhờ an toàn và thoải mái.</p>";
  }
}

function resetInputs() {
  console.log('resetInputs called');
  criteriaIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = defaultCriteriaValues[id];
  });
  alternativeIds.flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = defaultAlternativeValues[id];
  });
  const distanceEl = document.getElementById('distance');
  if (distanceEl) distanceEl.value = 'short';
  calculateAHP();
}

function showGuide() {
  alert(`
    Hướng dẫn sử dụng:
    1. Chọn khoảng cách di chuyển (ngắn, trung bình, dài).
    2. Nhập mức độ ưu tiên (1-9) cho các tiêu chí trong bảng So sánh cặp.
    3. Đảm bảo ma trận hợp lệ (CR ≤ 0.1) để mở khóa bảng đánh giá phương tiện.
    4. Nhập điểm (1-10) cho các phương tiện theo 5 tiêu chí.
    5. Nhấn "So sánh & Xếp hạng" hoặc "Tính toán lại" để xem kết quả.
    6. Sử dụng "Đặt lại dữ liệu" để trở về giá trị mặc định.
  `);
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

function addListeners() {
  console.log('addListeners called');
  criteriaIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        console.log(`Input ${id} changed to ${el.value}`);
        calculateAHP();
      });
    } else {
      console.error(`Input ${id} not found`);
    }
  });

  alternativeIds.flat().forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        console.log(`Input ${id} changed to ${el.value}`);
        calculateSAW();
      });
    } else {
      console.error(`Input ${id} not found`);
    }
  });

  const distanceEl = document.getElementById('distance');
  if (distanceEl) {
    distanceEl.addEventListener('change', () => {
      console.log(`Distance changed to ${distanceEl.value}`);
      updateDistance();
      calculateSAW();
    });
  } else {
    console.error('Element distance not found');
  }

  const btnRank = document.getElementById('btn-rank');
  if (btnRank) {
    btnRank.addEventListener('click', () => {
      console.log('Button btn-rank clicked');
      calculateSAW();
    });
  } else {
    console.error('Element btn-rank not found');
  }

  const btnRecalculate = document.getElementById('btn-recalculate');
  if (btnRecalculate) {
    btnRecalculate.addEventListener('click', () => {
      console.log('Button btn-recalculate clicked');
      calculateAHP();
    });
  } else {
    console.error('Element btn-recalculate not found');
  }

  const btnReset = document.getElementById('btn-reset');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      console.log('Button btn-reset clicked');
      resetInputs();
    });
  } else {
    console.error('Element btn-reset not found');
  }

  const btnGuide = document.getElementById('btn-guide');
  if (btnGuide) {
    btnGuide.addEventListener('click', () => {
      console.log('Button btn-guide clicked');
      showGuide();
    });
  } else {
    console.error('Element btn-guide not found');
  }

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      console.log('Sidebar toggle clicked');
      toggleSidebar();
    });
  } else {
    console.error('Element sidebar-toggle not found');
  }
}

window.onload = () => {
  console.log('window.onload called');
  addListeners();
  updateDistance();
  calculateAHP();
};