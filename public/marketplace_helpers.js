// Render Skeletons
function renderSkeletons(count) {
    return Array(count).fill(0).map(() => `
                <div class="product-card skeleton-card">
                    <div class="skeleton-image" style="width:100%; height:200px; background:#f0f0f0; border-radius:15px; margin-bottom:10px; animation:pulse 1.5s infinite;"></div>
                    <div class="skeleton-text" style="height:20px; width:80%; background:#f0f0f0; border-radius:4px; margin-bottom:8px; animation:pulse 1.5s infinite;"></div>
                    <div class="skeleton-text" style="height:20px; width:40%; background:#f0f0f0; border-radius:4px; margin-bottom:8px; animation:pulse 1.5s infinite;"></div>
                </div>
            `).join('');
}

// Render Empty State
function renderEmptyState(message, showRetry = false, retryFn = '') {
    return `
                <div class="empty-state" style="text-align:center; padding:50px 20px; grid-column:1/-1;">
                    <div class="empty-state-icon" style="font-size:3rem; color:#cbd5e1; margin-bottom:20px;">
                        <i class="fas fa-box-open"></i>
                    </div>
                    <h3 style="color:#64748b; font-size:1.2rem; margin-bottom:10px;">${message}</h3>
                    ${showRetry ? `
                        <button class="btn btn-primary mt-3 px-4 py-2 rounded-pill" onclick="${retryFn}">
                            <i class="fas fa-redo me-2"></i> ลองใหม่อีกครั้ง
                        </button>
                    ` : ''}
                </div>
            `;
}
