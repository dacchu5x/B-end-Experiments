const $ = id => document.getElementById(id);
const form = $('studentForm');
const message = $('formMessage');
const saveButton = $('saveButton');
const bookshelf = $('bookshelf');
const openingShort = value => ({'Side Opening':'Side','Top Opening':'Top','Sliding Doors':'Sliding','Open Shelves':'Open'})[value] || value;

function drawPreview() {
  const racks = Math.min(8, Math.max(1, Number($('racks').value) || 1));
  const shelves = Math.min(8, Math.max(1, Number($('shelves').value) || 1));
  const opening = $('openingStyle').value;
  $('rackLabel').textContent = String(racks).padStart(2,'0') + ' RACKS';
  $('shelfLabel').textContent = String(shelves).padStart(2,'0') + ' SHELVES EACH';
  $('summaryRacks').textContent = racks;
  $('summaryShelves').textContent = shelves;
  $('summaryOpening').textContent = openingShort(opening);
  if (window.Cupboard3D) Cupboard3D.render(bookshelf, {racks, shelves, doors: opening});
}
['racks','shelves','openingStyle'].forEach(id => $(id).addEventListener('input', drawPreview));

function updateRemoveButtons() {
  const rows = [...document.querySelectorAll('.book-row')];
  rows.forEach(row => row.querySelector('.remove-book').disabled = rows.length === 1);
}
function addBookRow() {
  const row = document.createElement('div');
  row.className = 'book-row';
  row.innerHTML = '<input class="book-name" placeholder="Book name" aria-label="Book name"><input class="book-qty" type="number" min="1" value="1" aria-label="Quantity"><input class="book-price" type="number" min="0" step="0.01" placeholder="Price ₹" aria-label="Price"><button class="remove-book" type="button" aria-label="Remove book">×</button>';
  $('bookRows').append(row);
  updateRemoveButtons();
}
$('addBook').addEventListener('click', addBookRow);
$('bookRows').addEventListener('click', event => {
  const button = event.target.closest('.remove-book');
  if (button && document.querySelectorAll('.book-row').length > 1) {
    button.closest('.book-row').remove();
    updateRemoveButtons();
  }
});

async function checkServer() {
  try {
    const response = await fetch('/api/health');
    if (!response.ok) throw new Error();
    $('connectionText').textContent = 'Server connected · Experiment 2 storage';
    document.querySelector('.connection').classList.add('online');
  } catch {
    $('connectionText').textContent = 'Server unavailable';
  }
}
checkServer();

form.addEventListener('submit', async event => {
  event.preventDefault();
  message.className = 'form-message';
  message.textContent = '';
  const books = [...document.querySelectorAll('.book-row')].map(row => ({
    bookName: row.querySelector('.book-name').value.trim(),
    quantity: Number(row.querySelector('.book-qty').value || 1),
    price: Number(row.querySelector('.book-price').value || 0)
  })).filter(book => book.bookName);

  const payload = {
    studentName: $('studentName').value.trim(),
    usn: $('usn').value.trim().toUpperCase(),
    phone: $('phone').value.trim(),
    department: $('department').value,
    semester: Number($('semester').value),
    books,
    racks: Number($('racks').value),
    shelves: Number($('shelves').value),
    openingStyle: $('openingStyle').value
  };
  saveButton.disabled = true;
  saveButton.querySelector('span').textContent = 'Saving…';
  try {
    const response = await fetch('/api/students', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Could not save student.');
    message.textContent = `✓ ${result.message} USN: ${result.record.usn}`;
    message.className = 'form-message';
    form.reset();
    $('racks').value = 3;
    $('shelves').value = 4;
    $('openingStyle').value = 'Side Opening';
    $('bookRows').innerHTML = '<div class="book-row"><input class="book-name" placeholder="Book name (e.g. DBMS)" aria-label="Book name"><input class="book-qty" type="number" min="1" value="1" aria-label="Quantity"><input class="book-price" type="number" min="0" step="0.01" placeholder="Price ₹" aria-label="Price"><button class="remove-book" type="button" aria-label="Remove book" disabled>×</button></div>';
    drawPreview();
  } catch (error) {
    message.textContent = error.message;
    message.className = 'form-message error';
  } finally {
    saveButton.disabled = false;
    saveButton.querySelector('span').textContent = 'Save student';
  }
});

updateRemoveButtons();
drawPreview();
