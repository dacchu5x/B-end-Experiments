const $ = id => document.getElementById(id);
const rows = $('rows');
const json = $('json');
const total = $('total');
const statusEl = $('status');
let allRecords = [];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));
}
function statusClass(status) {
  return ({Active:'active', Inactive:'inactive', 'On Hold':'hold'})[status] || 'active';
}
function getBooksCount(student) {
  return (student.booksPurchased || []).reduce((sum, book) => sum + Number(book.quantity || 0), 0);
}
function renderSummary(records) {
  $('total').textContent = records.length;
  $('active').textContent = records.filter(s => (s.status || 'Active') === 'Active').length;
  $('onHold').textContent = records.filter(s => s.status === 'On Hold').length;
  $('inactive').textContent = records.filter(s => s.status === 'Inactive').length;
}
function renderRows() {
  const term = $('search').value.trim().toLowerCase();
  const filter = $('statusFilter').value;
  const filtered = allRecords.filter(student => {
    const matchesTerm = `${student.usn} ${student.studentName} ${student.department}`.toLowerCase().includes(term);
    const matchesStatus = filter === 'All' || (student.status || 'Active') === filter;
    return matchesTerm && matchesStatus;
  });

  $('resultCount').textContent = `${filtered.length} of ${allRecords.length} records`;
  if (!filtered.length) {
    rows.innerHTML = `<tr><td colspan="6" class="empty">${allRecords.length ? 'No students match your search or status filter.' : 'No student records yet. Add the first student in Experiment 4.'}</td></tr>`;
    return;
  }

  rows.innerHTML = filtered.map(student => {
    const shelf = student.bookshelf || {};
    const status = student.status || 'Active';
    return `<tr>
      <td class="usn-cell">${escapeHtml(student.usn)}</td>
      <td><div class="student-cell"><span class="avatar">${escapeHtml((student.studentName || '?').trim().charAt(0).toUpperCase())}</span><span><b>${escapeHtml(student.studentName)}</b><small>${escapeHtml(student.phone || 'No phone number')}</small></span></div></td>
      <td>${escapeHtml(student.department)} <small class="semester">SEM ${escapeHtml(student.semester)}</small></td>
      <td><b>${escapeHtml(shelf.racks ?? 0)} racks · ${escapeHtml(shelf.shelves ?? 0)} shelves</b><small class="opening">${escapeHtml(shelf.openingStyle || '—')}</small></td>
      <td><label class="status-control"><span class="status-dot ${statusClass(status)}"></span><select class="status-select ${statusClass(status)}" data-usn="${escapeHtml(student.usn)}" aria-label="Status for ${escapeHtml(student.studentName)}"><option ${status==='Active'?'selected':''}>Active</option><option ${status==='On Hold'?'selected':''}>On Hold</option><option ${status==='Inactive'?'selected':''}>Inactive</option></select></label></td>
      <td><button class="edit-button" type="button" data-edit="${escapeHtml(student.usn)}">✎ Edit</button></td>
    </tr>`;
  }).join('');
}
async function loadRecords() {
  statusEl.textContent = 'Syncing records…';
  statusEl.classList.remove('error');
  try {
    const response = await fetch('/api/students');
    if (!response.ok) throw new Error('Unable to read student records.');
    allRecords = await response.json();
    allRecords = allRecords.map(student => ({...student, status:student.status || 'Active'}));
    renderSummary(allRecords);
    renderRows();
    json.textContent = JSON.stringify(allRecords, null, 2);
    statusEl.textContent = 'Connected · Live JSON';
  } catch (error) {
    statusEl.textContent = error.message;
    statusEl.classList.add('error');
    rows.innerHTML = `<tr><td colspan="6" class="empty">${escapeHtml(error.message)}</td></tr>`;
    json.textContent = '[]';
  }
}
function openEdit(usn) {
  const student = allRecords.find(item => String(item.usn).toUpperCase() === String(usn).toUpperCase());
  if (!student) return;
  const shelf = student.bookshelf || {};
  $('editUsn').value = student.usn;
  $('editName').value = student.studentName || '';
  $('editPhone').value = student.phone || '';
  $('editDepartment').value = student.department || 'CSE';
  $('editSemester').value = String(student.semester || 1);
  $('editRacks').value = shelf.racks || 1;
  $('editShelves').value = shelf.shelves || 1;
  $('editOpening').value = shelf.openingStyle || 'Side Opening';
  $('editMessage').textContent = '';
  $('editMessage').className = 'modal-message';
  $('editModal').hidden = false;
  document.body.classList.add('modal-open');
  $('editName').focus();
}
function closeEdit() {
  $('editModal').hidden = true;
  document.body.classList.remove('modal-open');
}

rows.addEventListener('click', event => {
  const button = event.target.closest('[data-edit]');
  if (button) openEdit(button.dataset.edit);
});
rows.addEventListener('change', async event => {
  const select = event.target.closest('.status-select');
  if (!select) return;
  const usn = select.dataset.usn;
  const nextStatus = select.value;
  select.disabled = true;
  try {
    const response = await fetch(`/api/students/${encodeURIComponent(usn)}/status`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({status:nextStatus})
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not update status.');
    statusEl.textContent = result.message;
    await loadRecords();
  } catch (error) {
    alert(error.message);
    await loadRecords();
  }
});
$('editForm').addEventListener('submit', async event => {
  event.preventDefault();
  const usn = $('editUsn').value;
  const payload = {
    studentName:$('editName').value.trim(),
    phone:$('editPhone').value.trim(),
    department:$('editDepartment').value,
    semester:Number($('editSemester').value),
    racks:Number($('editRacks').value),
    shelves:Number($('editShelves').value),
    openingStyle:$('editOpening').value
  };
  $('saveEdit').disabled = true;
  $('saveEdit').textContent = 'Saving…';
  $('editMessage').textContent = '';
  try {
    const response = await fetch(`/api/students/${encodeURIComponent(usn)}`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not save changes.');
    closeEdit();
    await loadRecords();
    statusEl.textContent = 'Student details saved successfully.';
  } catch (error) {
    $('editMessage').textContent = error.message;
    $('editMessage').classList.add('error');
  } finally {
    $('saveEdit').disabled = false;
    $('saveEdit').textContent = 'Save changes';
  }
});
$('refresh').addEventListener('click', loadRecords);
$('search').addEventListener('input', renderRows);
$('statusFilter').addEventListener('change', renderRows);
$('closeModal').addEventListener('click', closeEdit);
$('cancelEdit').addEventListener('click', closeEdit);
$('editModal').addEventListener('click', event => {
  if (event.target === $('editModal')) closeEdit();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('editModal').hidden) closeEdit();
});
loadRecords();
