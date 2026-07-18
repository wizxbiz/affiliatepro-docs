function handleTukTukButtonClick() {
            if (!WizmobizAuth.isLoggedIn()) {
                showToast('กรุณาเข้าสู่ระบบเพื่อใช้งานส่วนนี้', 'warning');
                setTimeout(() => WizmobizAuth.redirectToLogin(), 1500);
                return;
            }

            const overlay = document.getElementById('marketHubOverlay');
            const btn = document.getElementById('centerBtn');
            const nav = document.getElementById('bottomNav');
            const isShowing = overlay.classList.contains('show');

            if (isShowing) {
                closeMarketHub();
            } else {
                overlay.style.display = 'flex';
                setTimeout(() => {
                    overlay.classList.add('show');
                    btn.classList.add('active');
                    if (nav) nav.classList.add('overlay-active');
                }, 10);
                document.body.style.overflow = 'hidden';
            }
        }

        function closeMarketHub() {
            const overlay = document.getElementById('marketHubOverlay');
            const btn = document.getElementById('centerBtn');
            const nav = document.getElementById('bottomNav');
            overlay.classList.remove('show');
            btn.classList.remove('active');
            if (nav) nav.classList.remove('overlay-active');
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 300);
            document.body.style.overflow = 'auto';
        }

        function quickMarketAction(action) {
            closeMarketHub();
            if (action === 'sell') {
                WizmobizAuth.handleShopAccess('post-product.html');
            } else if (action === 'search') {
                toggleSearchOverlay();
            } else if (action === 'shop') {
                WizmobizAuth.handleShopAccess();
            } else if (action === 'community') {
                if (typeof switchMarket === 'function') {
                    switchMarket('community');
                } else {
                    window.location.href = 'comunity-market.html';
                }
            }
        }