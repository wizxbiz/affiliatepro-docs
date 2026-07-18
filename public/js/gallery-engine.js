/**
 * 🎞️ Gallery & Video Parser Engine
 */

function extractYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([\w-]{11})/);
    return match ? match[1] : null;
}

function parseVideoEmbed(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('//')) url = 'https:' + url;

    // YouTube
    const ytId = extractYoutubeId(url);
    if (ytId) {
        const origin = (window.location.origin && window.location.origin !== 'null') ? encodeURIComponent(window.location.origin) : '';
        let embedUrl = `https://www.youtube.com/embed/${ytId}?playsinline=1&enablejsapi=1&rel=0&modestbranding=1`;
        if (origin) embedUrl += `&origin=${origin}`;
        return `<iframe src="${embedUrl}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    }

    // TikTok
    const tiktokMatch = url.match(/tiktok\.com\/(?:.*\/video\/|.*v=)(\d+)/) ||
        url.match(/tiktok\.com\/(?:t|v)\/([\w\d]+)/) ||
        url.match(/(?:vm|vt)\.tiktok\.com\/([\w\d]+)/);
    if (tiktokMatch) {
        const videoId = tiktokMatch[1];
        return `<iframe src="https://www.tiktok.com/player/v1/${videoId}?music_info=1&description=1" allow="autoplay; fullscreen" style="width: 100%; height: 100%;" allowfullscreen></iframe>`;
    }

    // Facebook / Reels
    if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.com')) {
        return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500" style="border:none;overflow:hidden;width:100%;height:100%;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
    }

    // Direct MP4
    if (url.match(/\.(mp4|webm|mov|ogg)$/i)) {
        return `<video controls playsinline webkit-playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: contain;">
            <source src="${url}" type="video/mp4">
            Your browser does not support the video tag.
        </video>`;
    }

    return '';
}

function previewVideoLink(url) {
    const previewArea = document.getElementById('videoPreviewArea');
    if (!previewArea) return;
    const embed = parseVideoEmbed(url);

    if (embed) {
        previewArea.innerHTML = embed;
        previewArea.style.display = 'block';
        if (url.includes('youtube') || url.includes('youtu.be')) {
            previewArea.style.aspectRatio = '16/9';
        } else {
            previewArea.style.aspectRatio = '9/16';
        }
    } else {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
}

function changeGalleryMedia(index, postId) {
    const postContainer = document.getElementById(`post-${postId}`);
    if (!postContainer) return;

    const mainMedia = postContainer.querySelector('.main-media-display');
    const thumbnails = postContainer.querySelectorAll('.thumb-item');
    const images = JSON.parse(postContainer.getAttribute('data-media'));

    if (!mainMedia || !images || !images[index]) return;

    const media = images[index];
    const mediaUrl = typeof media === 'object' ? media.url : media;
    const mediaType = typeof media === 'object' ? media.type : (mediaUrl.includes('.mp4') ? 'video' : 'image');

    if (mediaType === 'video') {
        mainMedia.innerHTML = `
            <video src="${mediaUrl}" controls playsinline class="w-100 h-100" style="object-fit: contain; background: #000;"></video>
        `;
    } else if (mediaType === 'youtube') {
        const ytId = extractYoutubeId(mediaUrl);
        mainMedia.innerHTML = `
            <iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0" class="w-100 h-100" allowfullscreen></iframe>
        `;
    } else {
        mainMedia.innerHTML = `<img src="${mediaUrl}" class="w-100 h-100" style="object-fit: contain; background: #111;">`;
    }

    thumbnails.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });

    postContainer.setAttribute('data-current-index', index);
}

function navigateGallery(direction, postId) {
    const postContainer = document.getElementById(`post-${postId}`);
    if (!postContainer) return;

    const images = JSON.parse(postContainer.getAttribute('data-media'));
    let currentIndex = parseInt(postContainer.getAttribute('data-current-index') || 0);

    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % images.length;
    } else {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
    }

    changeGalleryMedia(currentIndex, postId);
}
