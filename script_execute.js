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