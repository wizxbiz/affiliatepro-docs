function toggleSearchOverlay() {
            const overlay = document.getElementById('smartSearchOverlay');
            if (overlay.style.display === 'flex') {
                overlay.classList.remove('show');
                setTimeout(() => overlay.style.display = 'none', 300);
                document.body.style.overflow = 'auto';
            } else {
                overlay.style.display = 'flex';
                setTimeout(() => {
                    overlay.classList.add('show');
                    document.getElementById('smartSearchInput').focus();
                }, 10);
                document.body.style.overflow = 'hidden';
            }
        }

        function executeSmartSearch() {
            const query = document.getElementById('smartSearchInput').value.trim();
            if (!query) return;

            // Re-use existing search logic
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = query;
                toggleSearchOverlay();
                // Trigger existing search
                handleSearch();
            }
        }

        function quickFilter(term) {
            const searchInput = document.getElementById('smartSearchInput');
            searchInput.value = term;
            executeSmartSearch();
        }