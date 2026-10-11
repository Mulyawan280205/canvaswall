const canvas = document.getElementById('canvasWall');
const ctx = canvas.getContext('2d');

const CANVAS_SIZE = 1000;
const GRID_SIZE = 25; 

// Elemen Form
const coordXInput = document.getElementById('coordX');
const coordYInput = document.getElementById('coordY');
const widthInput = document.getElementById('widthPixel');
const heightInput = document.getElementById('heightPixel');
const totalPriceEl = document.getElementById('totalPrice');
const adForm = document.getElementById('adForm');
const imageFileInput = document.getElementById('adImageFile');

let ads = [];

// Variabel untuk melacak status Dragging (Seret Mouse)
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Fungsi untuk merender ulang canvas
function drawCanvas() {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 1. Background putih dasar
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Render semua iklan yang tersimpan
    ads.forEach(ad => {
        if (ad.imgSrc) {
            const img = new Image();
            img.src = ad.imgSrc;
            if (img.complete) {
                ctx.drawImage(img, ad.x, ad.y, ad.w, ad.h);
            } else {
                img.onload = function() {
                    ctx.drawImage(img, ad.x, ad.y, ad.w, ad.h);
                };
            }
        } else {
            ctx.fillStyle = "#cccccc";
            ctx.fillRect(ad.x, ad.y, ad.w, ad.h);
        }
        
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        ctx.strokeRect(ad.x, ad.y, ad.w, ad.h);
    });

    // 3. Garis grid pembantu
    ctx.strokeStyle = "#f5f5f5";
    ctx.lineWidth = 1;

    for (let x = 0; x <= CANVAS_SIZE; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_SIZE);
        ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_SIZE; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_SIZE, y);
        ctx.stroke();
    }

    // 4. Kotak seleksi sementara saat sedang drag (live preview)
    if (isDragging) {
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);

        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;
        ctx.fillStyle = "rgba(76, 175, 80, 0.2)";
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    }
}

// Kalkulator total harga otomatis ($1 per pixel)
function updatePrice() {
    const w = parseInt(widthInput.value) || 0;
    const h = parseInt(heightInput.value) || 0;
    const totalPixels = w * h;
    totalPriceEl.textContent = `$${totalPixels.toLocaleString()}`;
}

widthInput.addEventListener('input', updatePrice);
heightInput.addEventListener('input', updatePrice);

// Helper untuk mendapatkan koordinat akurat pada canvas
function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    return {
        x: Math.floor(x / GRID_SIZE) * GRID_SIZE,
        y: Math.floor(y / GRID_SIZE) * GRID_SIZE
    };
}

// Fitur Klik / Interaksi pada Canvas (Buka Link atau Hapus Iklan)
canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Cek apakah mengklik iklan yang sudah ada
    let clickedIndex = ads.findIndex(ad => 
        clickX >= ad.x && clickX <= (ad.x + ad.w) &&
        clickY >= ad.y && clickY <= (ad.y + ad.h)
    );

    if (clickedIndex !== -1) {
        const clickedAd = ads[clickedIndex];
        const action = confirm(`Iklan ditemukan!\n\n- Link: ${clickedAd.link}\n\nKlik OK untuk MEMBUKA LINK, atau Cancel jika ingin MENGHAPUS iklan ini.`);
        
        if (action) {
            window.open(clickedAd.link, '_blank');
        } else {
            const confirmDelete = confirm("Apakah Anda yakin ingin MENGHAPUS iklan ini dari canvas?");
            if (confirmDelete) {
                ads.splice(clickedIndex, 1);
                saveAdsToStorage();
                drawCanvas();
                alert('Iklan berhasil dihapus!');
            }
        }
    }
});

// Event Dragging untuk memilih koordinat
canvas.addEventListener('mousedown', function(event) {
    // Abaikan jika klik dilakukan di atas iklan yang sudah ada
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    let hitExistingAd = ads.some(ad => 
        clickX >= ad.x && clickX <= (ad.x + ad.w) &&
        clickY >= ad.y && clickY <= (ad.y + ad.h)
    );

    if (hitExistingAd) return; // Jangan drag jika klik iklan

    const coords = getCanvasCoordinates(event);
    startX = coords.x;
    startY = coords.y;
    isDragging = true;
});

canvas.addEventListener('mousemove', function(event) {
    if (!isDragging) return;
    const coords = getCanvasCoordinates(event);
    currentX = coords.x;
    currentY = coords.y;
    drawCanvas();
});

canvas.addEventListener('mouseup', function(event) {
    if (!isDragging) return;
    isDragging = false;

    const coords = getCanvasCoordinates(event);
    currentX = coords.x;
    currentY = coords.y;

    const finalX = Math.min(startX, currentX);
    const finalY = Math.min(startY, currentY);
    let finalW = Math.abs(currentX - startX);
    let finalH = Math.abs(currentY - startY);

    if (finalW < GRID_SIZE) finalW = GRID_SIZE;
    if (finalH < GRID_SIZE) finalH = GRID_SIZE;

    coordXInput.value = finalX;
    coordYInput.value = finalY;
    widthInput.value = finalW;
    heightInput.value = finalH;

    updatePrice();
    drawCanvas();
});

canvas.addEventListener('mouseleave', function() {
    if (isDragging) {
        isDragging = false;
        drawCanvas();
    }
});

// Simpan ke LocalStorage
function saveAdsToStorage() {
    localStorage.setItem('canvasWallAds', JSON.stringify(ads));
}

// Muat data dari LocalStorage
function loadAdsFromStorage() {
    const savedAds = localStorage.getItem('canvasWallAds');
    if (savedAds) {
        ads = JSON.parse(savedAds);
        drawCanvas();
    }
}

// Submit Form & Simulasi Pembayaran
adForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const file = imageFileInput.files[0];
    if (!file) return;

    const w = parseInt(widthInput.value);
    const h = parseInt(heightInput.value);
    const totalPrice = w * h;

    const confirmPayment = confirm(`Total biaya untuk ${w}x${h} pixel adalah $${totalPrice.toLocaleString()}. Lanjutkan simulasi pembayaran?`);
    if (!confirmPayment) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const newAd = {
            x: parseInt(coordXInput.value),
            y: parseInt(coordYInput.value),
            w: w,
            h: h,
            link: document.getElementById('adLink').value,
            imgSrc: event.target.result
        };

        ads.push(newAd);
        saveAdsToStorage();
        drawCanvas();

        alert('Pembayaran Berhasil! Banner iklan Anda telah dipasang di CanvasWall.');
        adForm.reset();
        updatePrice();
    };
    reader.readAsDataURL(file);
});

// Inisialisasi awal
loadAdsFromStorage();
updatePrice();