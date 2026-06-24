document.addEventListener('DOMContentLoaded', () => {
  const submitBtn = document.getElementById('submitBtn');
  const apiUrlInput = document.getElementById('apiUrl');
  const nodeInput = document.getElementById('nodeInput');
  const errorBox = document.getElementById('errorBox');
  const resultsContainer = document.getElementById('resultsContainer');

  submitBtn.addEventListener('click', async () => {
    errorBox.style.display = 'none';
    resultsContainer.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(nodeInput.value);
        if (!Array.isArray(parsedData)) {
          throw new Error("Input must be a JSON array of strings.");
        }
      } catch (err) {
        throw new Error("Invalid JSON: " + err.message);
      }

      const apiUrl = apiUrlInput.value.trim();
      if (!apiUrl) throw new Error("API URL is required.");

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'API call failed');
      }

      renderResults(data);
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Process Nodes';
    }
  });

  function renderTree(treeObj) {
    const keys = Object.keys(treeObj);
    if (keys.length === 0) return '';

    let html = '<ul class="tree-ul">';
    for (const key of keys) {
      html += `
        <li class="tree-li">
          <span class="node-label">${key}</span>
          ${renderTree(treeObj[key])}
        </li>
      `;
    }
    html += '</ul>';
    return html;
  }

  function renderResults(data) {
    const summary = data.summary;
    const hierarchies = data.hierarchies;
    
    let html = `
      <div class="grid-2">
        <div class="card">
          <h3>Summary</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <div class="stat-value">${summary.total_trees}</div>
              <div style="color: var(--text-secondary)">Total Trees</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <div>
                <div style="font-size: 1.2rem; font-weight: bold;">${summary.total_cycles}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary)">Cycles</div>
              </div>
              <div>
                <div style="font-size: 1.2rem; font-weight: bold;">${summary.largest_tree_root || 'N/A'}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary)">Largest Root</div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3>Edges Status</h3>
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Duplicates</div>
            ${data.duplicate_edges.length > 0 ? `
              <div class="tag-list">
                ${data.duplicate_edges.map(e => `<span class="tag">${e}</span>`).join('')}
              </div>
            ` : '<span style="font-size: 0.85rem">None</span>'}
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Invalid Entries</div>
            ${data.invalid_entries.length > 0 ? `
              <div class="tag-list">
                ${data.invalid_entries.map(e => `<span class="tag error">${e}</span>`).join('')}
              </div>
            ` : '<span style="font-size: 0.85rem">None</span>'}
          </div>
        </div>
      </div>

      <h3 style="margin-bottom: 1rem;">Hierarchies</h3>
    `;

    if (hierarchies.length > 0) {
      html += '<div class="hierarchy-list">';
      for (const h of hierarchies) {
        html += `
          <div class="hierarchy-card">
            <div class="hierarchy-header">
              <div>
                <span style="margin-right: 1rem; color: var(--text-secondary)">Root:</span>
                <span class="root-badge">${h.root}</span>
              </div>
              ${h.has_cycle 
                ? '<span class="badge-cycle">Cycle Detected</span>'
                : `<span class="badge-depth">Depth: ${h.depth}</span>`
              }
            </div>
        `;
        
        if (!h.has_cycle) {
          html += `
            <div class="tree-container">
              <span class="node-label">${h.root}</span>
              ${renderTree(h.tree[h.root] || {})}
            </div>
          `;
        }
        
        html += '</div>'; // End hierarchy-card
      }
      html += '</div>'; // End hierarchy-list
    } else {
      html += '<div class="card">No valid hierarchies found.</div>';
    }

    html += `
      <div style="margin-top: 2rem; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
        User ID: ${data.user_id} | Email: ${data.email_id} | Roll: ${data.college_roll_number}
      </div>
    `;

    resultsContainer.innerHTML = html;
    resultsContainer.style.display = 'block';
  }
});
