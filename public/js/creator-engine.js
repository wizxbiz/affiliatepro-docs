/**
 * 🎨 Creator Engine (Post Editor, AI Assistant, Media Upload)
 */

window.uploadedImages = [];
window.uploadedYoutubeUrl = '';

async function uploadToR2(file, folder = 'posts', onProgress = null) {
    const contentType = file.type || 'video/mp4';
    const safeFilename = file.name.replace(/\s+/g, '_');
    const R2_PRESIGN_URL = '/api/v1/media/presign';

    let authHeaders = {};
    let lineUserId = null;
    try {
        const token = localStorage.getItem('tuktuk_token');
        if (token) {
            authHeaders['Authorization'] = `Bearer ${token}`;
        }
    } catch (_) { }
    if (!authHeaders['Authorization']) {
        const session = typeof WizmobizAuth !== 'undefined' ? WizmobizAuth.getSession() : null;
        lineUserId = session?.lineUserId || session?.uid || null;
        if (session?.token || session?.sessionToken) {
            authHeaders['Authorization'] = `Bearer ${session.token || session.sessionToken}`;
        }
    }

    const cfRes = await fetch(R2_PRESIGN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ folder, filename: safeFilename, contentType, lineUserId })
    });
    if (!cfRes.ok) throw new Error(`R2 presign failed`);
    const { uploadUrl, publicUrl } = await cfRes.json();

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', contentType);
        if (onProgress && xhr.upload) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
            };
        }
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(publicUrl) : reject();
        xhr.onerror = () => reject();
        xhr.send(file);
    });
}

async function handleMultiMediaUpload(input) {
    const files = Array.from(input.files);
    if (files.length === 0) return;

    if (window.uploadedImages.length + files.length > 10) {
        showToast('⚠️ สามารถอัปโหลดได้สูงสุด 10 ไฟล์', 'warning');
        return;
    }

    const progressEl = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    if (progressEl) progressEl.style.display = 'block';

    let uploaded = 0;
    const progressLabel = progressEl ? progressEl.querySelector('span') : null;

    for (const file of files) {
        const isVideo = file.type.startsWith('video/');
        const isImage = file.type.startsWith('image/');

        if (!isVideo && !isImage) {
            showToast(`⚠️ ไฟล์ ${file.name} ไม่รองรับ`, 'error');
            continue;
        }

        const maxSize = isVideo ? 25 * 1024 * 1024 : 5 * 1024 * 1024;
        if (file.size > maxSize) {
            showToast(`⚠️ ไฟล์ ${file.name} ใหญ่เกินไป (จำกัด ${isVideo ? '25MB' : '5MB'})`, 'error');
            continue;
        }

        try {
            if (progressLabel) progressLabel.innerText = `⚙️ กำลังเตรียมไฟล์...`;
            let fileToUpload = file;
            if (isImage) {
                fileToUpload = await compressImage(file);
            }

            let url = await uploadToR2(fileToUpload, 'community_posts', (pct) => {
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressLabel) progressLabel.innerText = `📦 กำลังอัปโหลด... ${Math.round(pct)}%`;
            });

            let thumbUrl = null;
            if (isVideo) {
                try {
                    const thumbData = await generateVideoThumbnail(file);
                    if (thumbData) {
                        const thumbBlob = dataURLtoBlob(thumbData);
                        const thumbFile = new File([thumbBlob], 'thumb.jpg', { type: 'image/jpeg' });
                        thumbUrl = await uploadToR2(thumbFile, 'community_posts/thumbs', null);
                    }
                } catch (e) { console.warn('Thumb gen failed', e); }
            }

            if (isVideo) {
                window.uploadedImages.push({ url, type: 'video', thumbnailUrl: thumbUrl, name: file.name });
            } else {
                window.uploadedImages.push({ url, type: 'image', name: file.name });
            }
            uploaded++;
        } catch (error) {
            console.error('Upload error:', error);
            showToast(`❌ อัปโหลด ${file.name} ล้มเหลว`, 'error');
        }
    }

    if (progressEl) progressEl.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';

    if (uploaded > 0) {
        showToast(`✅ อัปโหลด ${uploaded} ไฟล์สำเร็จ`, 'success');
        renderUploadedMedia();
    }
    input.value = '';
}

function renderUploadedMedia() {
    const grid = document.getElementById('uploadedMediaGrid');
    if (!grid) return;

    let html = window.uploadedImages.map((item, index) => {
        const url = typeof item === 'object' ? item.url : item;
        const thumbUrl = typeof item === 'object' ? item.thumbnailUrl : null;
        const isVideo = typeof item === 'object' && item.type === 'video';

        return `
        <div class="uploaded-media-item ${index === 0 ? 'main-image' : ''}" data-index="${index}">
            ${isVideo ? `
                <div class="video-preview-placeholder">
                    ${thumbUrl ? `<img src="${thumbUrl}" style="opacity: 0.5;">` : '<i class="fas fa-video"></i>'}
                    <span class="small d-block" style="position: absolute; z-index: 2;">วิดีโอ</span>
                </div>
            ` : `<img src="${url}" alt="รูปที่ ${index + 1}">`}
            <button class="remove-btn" onclick="removeUploadedImage(${index})" type="button">
                <i class="fas fa-times"></i>
            </button>
            ${isVideo ? `<div class="media-type-badge"><i class="fas fa-play"></i></div>` : ''}
        </div>
    `}).join('');

    if (window.uploadedImages.length < 10) {
        html += `
            <div class="add-media-btn-pro" onclick="document.getElementById('postMediaFiles').click()">
                <i class="fas fa-plus"></i>
                <span>ADD MEDIA</span>
            </div>
        `;
    }
    grid.innerHTML = html;

    const postImagesInput = document.getElementById('postImages');
    if (postImagesInput) postImagesInput.value = JSON.stringify(window.uploadedImages);
}

function removeUploadedImage(index) {
    window.uploadedImages.splice(index, 1);
    renderUploadedMedia();
}

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
                }, 'image/jpeg', quality);
            };
        };
    });
}

async function generateVideoThumbnail(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        video.autoplay = false;
        video.muted = true;
        video.src = URL.createObjectURL(file);
        video.onloadeddata = () => { video.currentTime = 1; };
        video.onseeked = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            URL.revokeObjectURL(video.src);
            resolve(dataUrl);
        };
        video.onerror = () => { URL.revokeObjectURL(video.src); resolve(null); };
    });
}

function dataURLtoBlob(dataurl) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[arr.length - 1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
}

async function aiAssist(mode) {
    if (typeof showToast === 'function') {
        showToast('ปิดระบบ AI Assist แล้ว', 'info');
    }
    return { success: false, disabled: true, mode };

    const btn = document.getElementById('aiAssistantBtn');
    const titleEl = document.getElementById('postTitle');
    const categoryEl = document.getElementById('postCategory');
    const content = typeof quill !== 'undefined' ? quill.root.innerHTML : (document.getElementById('postContent')?.value || '');
    const title = titleEl?.value.trim();
    const category = categoryEl?.value;

    if (!content && !title) {
        alert('⚠️ กรุณาใส่หัวข้อหรือเนื้อหาก่อนใช้ AI');
        return;
    }

    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>🤖 AI กำลังคิด...</span></div>';
    btn.disabled = true;

    try {
        const cleanContent = content.replace(/<[^>]*>/g, '\n').trim();
        const API_URL = '/api/marketplace/ai-assist';
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, title, content: cleanContent, category })
        });
        const result = await response.json();

        if (result.success) {
            if (result.title) titleEl.value = result.title;
            if (result.content) {
                if (typeof quill !== 'undefined') {
                    quill.root.innerHTML = result.content.replace(/\n/g, '<br>');
                } else if (document.getElementById('postContent')) {
                    document.getElementById('postContent').value = result.content;
                }
            }
            if (typeof showToast === 'function') showToast('✨ AI ช่วยเขียนเสร็จแล้ว!', 'success');
        }
    } catch (error) {
        console.error('AI Error:', error);
    } finally {
        btn.innerHTML = originalBtnText;
        btn.disabled = false;
        const opts = document.getElementById('aiOptions');
        if (opts) opts.style.display = 'none';
    }
}

async function verifyLinkedProduct(idOverride) {
    const id = idOverride || document.getElementById('linkedProductId').value.trim();
    const preview = document.getElementById('linkedProductPreview');
    if (!id || !preview) return;

    try {
        const doc = await db.collection('products').doc(id).get();
        if (doc.exists) {
            const product = doc.data();
            window.lastVerifiedProduct = product;
            preview.innerHTML = `
                <div class="alert alert-success d-flex align-items-center gap-3 py-2 mb-0">
                    <img src="${product.imageUrl}" style="width: 40px; height: 40px; border-radius: 5px; object-fit: cover;">
                    <div>
                        <div class="small fw-bold">${product.name}</div>
                        <div class="small">ราคา ฿${(product.price || 0).toLocaleString()}</div>
                    </div>
                </div>
            `;
            preview.style.display = 'block';
        } else {
            preview.innerHTML = `<div class="text-danger small mt-1">❌ ไม่พบสินค้า ID นี้</div>`;
            preview.style.display = 'block';
            window.lastVerifiedProduct = null;
        }
    } catch (e) {
        console.log('Error verifying product');
    }
}

function selectPostCategory(category, element) {
    const el = document.getElementById('postCategory');
    if (el) el.value = category;
    document.querySelectorAll('.node-card').forEach(card => card.classList.remove('active'));
    if (element) element.classList.add('active');
}

function resetUploadAreaMulti() {
    window.uploadedImages = [];
    window.uploadedYoutubeUrl = '';
    const imgInp = document.getElementById('postImages');
    if (imgInp) imgInp.value = '';
    const previewArea = document.getElementById('videoPreviewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
    renderUploadedMedia();
}

function toggleAiOptions() {
    const options = document.getElementById('aiOptions');
    if (options) options.style.display = 'none';
}

function getCurrentLocation(event) {
    const btn = event.currentTarget;
    const originalIcon = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;

    if (!navigator.geolocation) {
        if (typeof showToast === 'function') showToast("⚠️ เบราว์เซอร์ไม่รองรับ", "warning");
        btn.innerHTML = originalIcon;
        btn.disabled = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            document.getElementById('postCoordinates').value = `${pos.coords.latitude},${pos.coords.longitude}`;
            const locInput = document.getElementById('postLocation');
            if (locInput && !locInput.value) locInput.value = "📍 ปักหมุดพิกัดสำเร็จ";
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { btn.innerHTML = originalIcon; btn.disabled = false; }, 2000);
        },
        () => {
            btn.innerHTML = originalIcon;
            btn.disabled = false;
        }
    );
}
