        // ===== COLUMN CONFIGURATION TRACKING SYSTEM =====
        // Created: January 2025
        // Purpose: Foundation for duplicate prevention validation
        
        /**
         * Object to store column configurations for validation
         * Key: column index (5, 6, 7, etc.)
         * Value: configuration object with columnType, engagementId, period, drcr
         */
        const columnConfigurations = {};
        
        /**
         * Array of properties that define a unique configuration
         * Used to generate configuration keys for duplicate detection
         */
        const configurationKeys = ['columnType', 'engagementId', 'period', 'drcr'];
        
        /**
         * Generate a unique configuration key from column settings
         * @param {Object} config - Column configuration object
         * @returns {string} - Unique key for the configuration
         */
        function generateConfigurationKey(config) {
            // Only include balance types in duplicate checking
            const balanceTypes = ['unadjusted-balance', 'budget-balance', 'adjusted-budget-balance', 
                                'adjusted-balance', 'report-balance', 'federal-tax-balance', 
                                'state-tax-balance', 'other-balance', 'proposed-balance'];
            
            if (!balanceTypes.includes(config.columnType)) {
                return null; // Non-balance types don't need duplicate checking
            }
            
            return `${config.columnType}|${config.engagementId}|${config.period}|${config.drcr}`;
        }
        
        // ===== CONFIGURATION STORAGE FUNCTIONS =====
        // Created: January 2025
        // Purpose: Store and retrieve column configuration data
        
        /**
         * Save column configuration to the tracking system
         * @param {number} columnIndex - Column index (5, 6, 7, etc.)
         * @param {Object} config - Configuration object {columnType, engagementId, period, drcr}
         */
        function saveColumnConfiguration(columnIndex, config) {
            if (!columnIndex || !config) {
                console.warn('saveColumnConfiguration: Invalid parameters');
                return;
            }
            
            columnConfigurations[columnIndex] = {
                columnType: config.columnType || null,
                engagementId: config.engagementId || null,
                period: config.period || null,
                drcr: config.drcr || null,
                timestamp: new Date().toISOString()
            };
            
            console.log(`Column ${columnIndex} configuration saved:`, columnConfigurations[columnIndex]);
        }
        
        /**
         * Get column configuration from the tracking system
         * @param {number} columnIndex - Column index to retrieve
         * @returns {Object|null} - Configuration object or null if not found
         */
        function getColumnConfiguration(columnIndex) {
            if (!columnIndex) {
                console.warn('getColumnConfiguration: Invalid column index');
                return null;
            }
            
            return columnConfigurations[columnIndex] || null;
        }
        
        /**
         * Clear column configuration from the tracking system
         * @param {number} columnIndex - Column index to clear
         */
        function clearColumnConfiguration(columnIndex) {
            if (!columnIndex) {
                console.warn('clearColumnConfiguration: Invalid column index');
                return;
            }
            
            if (columnConfigurations[columnIndex]) {
                delete columnConfigurations[columnIndex];
                console.log(`Column ${columnIndex} configuration cleared`);
            }
        }
        
        /**
         * Get all configured columns
         * @returns {Array} - Array of column indices that have configurations
         */
        function getAllConfiguredColumns() {
            return Object.keys(columnConfigurations).map(key => parseInt(key));
        }
        
        // ===== END CONFIGURATION STORAGE FUNCTIONS =====
        
        // ===== END COLUMN CONFIGURATION TRACKING SYSTEM =====

        // Mock data for consolidation engagements - corrected structure
        const consolidationData = [
            { id: 1, label: 'Global Consolidated', structure: 'Consolidated', balance: 'Total', clientName: '053B2 - TEST CLIENT', clientNumber: '1984', engagementName: 'Global Consolidated Group', parentId: null, level: 1, displayOrder: 1 },
            { id: 2, label: 'North America Division', structure: 'Consolidated', balance: 'Total', clientName: 'NA Client', clientNumber: '1984', engagementName: 'NA Division Engagement', parentId: 1, level: 2, displayOrder: 1 },
            { id: 3, label: 'Europe Division', structure: 'Consolidated', balance: 'Total', clientName: 'EU Client', clientNumber: '1984', engagementName: 'Europe Division Engagement', parentId: 1, level: 2, displayOrder: 2 },
            { id: 4, label: 'Asia Pacific Division', structure: 'Consolidated', balance: 'Total', clientName: 'APAC Client', clientNumber: '1984', engagementName: 'APAC Division Engagement', parentId: 1, level: 2, displayOrder: 3 },
            { id: 5, label: 'US Operations', structure: 'Consolidated', balance: 'Total', clientName: 'US Client', clientNumber: '1984', engagementName: 'US Operations Engagement', parentId: 2, level: 3, displayOrder: 1 },
            { id: 6, label: 'Canada Operations', structure: 'Consolidated', balance: 'Total', clientName: 'CA Client', clientNumber: '1984', engagementName: 'Canada Operations Engagement', parentId: 2, level: 3, displayOrder: 2 },
            { id: 7, label: 'UK Operations', structure: 'Consolidated', balance: 'Total', clientName: 'UK Client', clientNumber: '1984', engagementName: 'UK Operations Engagement', parentId: 3, level: 3, displayOrder: 1 },
            { id: 8, label: 'Germany Operations', structure: 'Consolidated', balance: 'Total', clientName: 'DE Client', clientNumber: '1984', engagementName: 'Germany Operations Engagement', parentId: 3, level: 3, displayOrder: 2 },
            { id: 9, label: 'Japan Operations', structure: 'Consolidated', balance: 'Total', clientName: 'JP Client', clientNumber: '1984', engagementName: 'Japan Operations Engagement', parentId: 4, level: 3, displayOrder: 1 },
            { id: 10, label: 'Australia Operations', structure: 'Consolidated', balance: 'Total', clientName: 'AU Client', clientNumber: '1984', engagementName: 'Australia Operations Engagement', parentId: 4, level: 3, displayOrder: 2 },
            { id: 11, label: 'US East Region', structure: 'Consolidated', balance: 'Total', clientName: 'US East Client', clientNumber: '1984', engagementName: 'US East Region Engagement', parentId: 5, level: 4, displayOrder: 1 },
            { id: 12, label: 'US West Region', structure: 'Consolidated', balance: 'Total', clientName: 'US West Client', clientNumber: '1984', engagementName: 'US West Region Engagement', parentId: 5, level: 4, displayOrder: 2 },
            { id: 13, label: 'Ontario Region', structure: 'Consolidated', balance: 'Total', clientName: 'ON Client', clientNumber: '1984', engagementName: 'Ontario Region Engagement', parentId: 6, level: 4, displayOrder: 1 },
            { id: 14, label: 'Quebec Region', structure: 'Consolidated', balance: 'Total', clientName: 'QC Client', clientNumber: '1984', engagementName: 'Quebec Region Engagement', parentId: 6, level: 4, displayOrder: 2 },
            { id: 15, label: 'London Region', structure: 'Consolidated', balance: 'Total', clientName: 'London Client', clientNumber: '1984', engagementName: 'London Region Engagement', parentId: 7, level: 4, displayOrder: 1 },
            { id: 16, label: 'Manchester Region', structure: 'Consolidated', balance: 'Total', clientName: 'Manchester Client', clientNumber: '1984', engagementName: 'Manchester Region Engagement', parentId: 7, level: 4, displayOrder: 2 },
            { id: 17, label: 'Berlin Region', structure: 'Consolidated', balance: 'Total', clientName: 'Berlin Client', clientNumber: '1984', engagementName: 'Berlin Region Engagement', parentId: 8, level: 4, displayOrder: 1 },
            { id: 18, label: 'Munich Region', structure: 'Consolidated', balance: 'Total', clientName: 'Munich Client', clientNumber: '1984', engagementName: 'Munich Region Engagement', parentId: 8, level: 4, displayOrder: 2 },
            { id: 19, label: 'Tokyo Region', structure: 'Consolidated', balance: 'Total', clientName: 'Tokyo Client', clientNumber: '1984', engagementName: 'Tokyo Region Engagement', parentId: 9, level: 4, displayOrder: 1 },
            { id: 20, label: 'Osaka Region', structure: 'Consolidated', balance: 'Total', clientName: 'Osaka Client', clientNumber: '1984', engagementName: 'Osaka Region Engagement', parentId: 9, level: 4, displayOrder: 2 },
            { id: 21, label: 'Sydney Region', structure: 'Consolidated', balance: 'Total', clientName: 'Sydney Client', clientNumber: '1984', engagementName: 'Sydney Region Engagement', parentId: 10, level: 4, displayOrder: 1 },
            { id: 22, label: 'Melbourne Region', structure: 'Consolidated', balance: 'Total', clientName: 'Melbourne Client', clientNumber: '1984', engagementName: 'Melbourne Region Engagement', parentId: 10, level: 4, displayOrder: 2 },
            // True leaf engagements (no children)
            { id: 23, label: 'US East Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 23', clientNumber: '1984', engagementName: 'Leaf Engagement 23', parentId: 11, level: 5, displayOrder: 1 },
            { id: 24, label: 'US East Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 24', clientNumber: '1984', engagementName: 'Leaf Engagement 24', parentId: 11, level: 5, displayOrder: 2 },
            { id: 25, label: 'US West Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 25', clientNumber: '1984', engagementName: 'Leaf Engagement 25', parentId: 12, level: 5, displayOrder: 1 },
            { id: 26, label: 'US West Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 26', clientNumber: '1984', engagementName: 'Leaf Engagement 26', parentId: 12, level: 5, displayOrder: 2 },
            { id: 27, label: 'Ontario Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 27', clientNumber: '1984', engagementName: 'Leaf Engagement 27', parentId: 13, level: 5, displayOrder: 1 },
            { id: 28, label: 'Ontario Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 28', clientNumber: '1984', engagementName: 'Leaf Engagement 28', parentId: 13, level: 5, displayOrder: 2 },
            { id: 29, label: 'Quebec Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 29', clientNumber: '1984', engagementName: 'Leaf Engagement 29', parentId: 14, level: 5, displayOrder: 1 },
            { id: 30, label: 'Quebec Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 30', clientNumber: '1984', engagementName: 'Leaf Engagement 30', parentId: 14, level: 5, displayOrder: 2 },
            { id: 31, label: 'London Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 31', clientNumber: '1984', engagementName: 'Leaf Engagement 31', parentId: 15, level: 5, displayOrder: 1 },
            { id: 32, label: 'London Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 32', clientNumber: '1984', engagementName: 'Leaf Engagement 32', parentId: 15, level: 5, displayOrder: 2 },
            { id: 33, label: 'Manchester Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 33', clientNumber: '1984', engagementName: 'Leaf Engagement 33', parentId: 16, level: 5, displayOrder: 1 },
            { id: 34, label: 'Manchester Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 34', clientNumber: '1984', engagementName: 'Leaf Engagement 34', parentId: 16, level: 5, displayOrder: 2 },
            { id: 35, label: 'Berlin Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 35', clientNumber: '1984', engagementName: 'Leaf Engagement 35', parentId: 17, level: 5, displayOrder: 1 },
            { id: 36, label: 'Berlin Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 36', clientNumber: '1984', engagementName: 'Leaf Engagement 36', parentId: 17, level: 5, displayOrder: 2 },
            { id: 37, label: 'Munich Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 37', clientNumber: '1984', engagementName: 'Leaf Engagement 37', parentId: 18, level: 5, displayOrder: 1 },
            { id: 38, label: 'Munich Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 38', clientNumber: '1984', engagementName: 'Leaf Engagement 38', parentId: 18, level: 5, displayOrder: 2 },
            { id: 39, label: 'Tokyo Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 39', clientNumber: '1984', engagementName: 'Leaf Engagement 39', parentId: 19, level: 5, displayOrder: 1 },
            { id: 40, label: 'Tokyo Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 40', clientNumber: '1984', engagementName: 'Leaf Engagement 40', parentId: 19, level: 5, displayOrder: 2 },
            { id: 41, label: 'Osaka Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 41', clientNumber: '1984', engagementName: 'Leaf Engagement 41', parentId: 20, level: 5, displayOrder: 1 },
            { id: 42, label: 'Osaka Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 42', clientNumber: '1984', engagementName: 'Leaf Engagement 42', parentId: 20, level: 5, displayOrder: 2 },
            { id: 43, label: 'Sydney Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 43', clientNumber: '1984', engagementName: 'Leaf Engagement 43', parentId: 21, level: 5, displayOrder: 1 },
            { id: 44, label: 'Sydney Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 44', clientNumber: '1984', engagementName: 'Leaf Engagement 44', parentId: 21, level: 5, displayOrder: 2 },
            { id: 45, label: 'Melbourne Subsidiary 1', structure: 'None', balance: 'Adjusted', clientName: 'Client 45', clientNumber: '1984', engagementName: 'Leaf Engagement 45', parentId: 22, level: 5, displayOrder: 1 },
            { id: 46, label: 'Melbourne Subsidiary 2', structure: 'None', balance: 'Adjusted', clientName: 'Client 46', clientNumber: '1984', engagementName: 'Leaf Engagement 46', parentId: 22, level: 5, displayOrder: 2 }
        ];

        // Current column being edited
        let currentColumn = null;
        let selectedEngagementId = null;

        // Function to determine if an engagement has children
        function hasChildren(engagementId) {
            return consolidationData.some(engagement => engagement.parentId === engagementId);
        }

        // Get only true leaf engagements (structure: 'None' AND no children)
        function getTrueLeafEngagements() {
            return consolidationData
                .filter(engagement => 
                    engagement.structure === 'None' && !hasChildren(engagement.id)
                )
                .sort((a, b) => a.label.localeCompare(b.label));
        }

        // Initialize engagement list (flat list of true leaf engagements only)
        function initializeEngagementList() {
            const trueLeafEngagements = getTrueLeafEngagements();
            const container = document.getElementById('engagementList');
            container.innerHTML = '';
            
            console.log('True leaf engagements:', trueLeafEngagements.map(e => e.label));
            
            trueLeafEngagements.forEach(engagement => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'engagement-item';
                itemDiv.setAttribute('data-engagement-id', engagement.id);
                
                // Add label
                const label = document.createElement('span');
                label.className = 'engagement-label';
                label.textContent = engagement.label;
                itemDiv.appendChild(label);

                // Click handler for selection
                itemDiv.addEventListener('click', () => {
                    document.querySelectorAll('.engagement-item.selected').forEach(item => {
                        item.classList.remove('selected');
                    });
                    itemDiv.classList.add('selected');
                    selectedEngagementId = engagement.id;
                    document.getElementById('selectedEngagement').textContent = engagement.label;
                    document.getElementById('engagementDropdownMenu').classList.remove('show');
                });
                
                container.appendChild(itemDiv);
            });
        }

        // Toggle engagement dropdown
        function toggleEngagementDropdown() {
            const dropdown = document.getElementById('engagementDropdownMenu');
            dropdown.classList.toggle('show');
        }

        // Handle column type change
        function handleColumnTypeChange() {
            const columnType = document.getElementById('columnType').value;
            const engagementGroup = document.getElementById('engagementGroup');
            const periodGroup = document.getElementById('periodGroup');
            const drcrGroup = document.getElementById('drcrGroup');

            // Show engagement selection only for balance types
            const balanceTypes = ['unadjusted-balance', 'budget-balance', 'adjusted-budget-balance', 
                                'adjusted-balance', 'report-balance', 'federal-tax-balance', 
                                'state-tax-balance', 'other-balance', 'proposed-balance'];
            
            if (balanceTypes.includes(columnType)) {
                engagementGroup.style.display = 'block';
                periodGroup.style.display = 'block';
                drcrGroup.style.display = 'block';
            } else {
                engagementGroup.style.display = 'none';
                periodGroup.style.display = 'none';
                drcrGroup.style.display = 'none';
                selectedEngagementId = null;
                document.getElementById('selectedEngagement').textContent = 'Select engagement...';
            }
        }

        // Open column dialog
        function openColumnDialog(columnIndex) {
            currentColumn = columnIndex;
            document.getElementById('columnModal').classList.add('show');
            
            // Reset form
            document.getElementById('columnType').value = '';
            document.getElementById('period').value = 'current-period';
            document.getElementById('drcr').value = 'dr-cr';
            selectedEngagementId = null;
            document.getElementById('selectedEngagement').textContent = 'Select engagement...';
            
            // Hide conditional groups
            document.getElementById('engagementGroup').style.display = 'none';
            document.getElementById('periodGroup').style.display = 'none';
            document.getElementById('drcrGroup').style.display = 'none';
        }

        // Close column dialog
        function closeColumnDialog() {
            document.getElementById('columnModal').classList.remove('show');
            document.getElementById('engagementDropdownMenu').classList.remove('show');
            currentColumn = null;
            selectedEngagementId = null;
        }

        // Save column details
        function saveColumnDetails() {
            const columnType = document.getElementById('columnType').value;
            const period = document.getElementById('period').value;
            const drcr = document.getElementById('drcr').value;
            
            if (!columnType) {
                alert('Please select a column type');
                return;
            }

            // Check if engagement is required and selected
            const balanceTypes = ['unadjusted-balance', 'budget-balance', 'adjusted-budget-balance', 
                                'adjusted-balance', 'report-balance', 'federal-tax-balance', 
                                'state-tax-balance', 'other-balance', 'proposed-balance'];
            
            if (balanceTypes.includes(columnType) && !selectedEngagementId) {
                alert('Please select a target engagement for balance columns');
                return;
            }

            // Save configuration using new storage functions
            const config = {
                columnType: columnType,
                engagementId: selectedEngagementId,
                period: period,
                drcr: drcr
            };
            
            saveColumnConfiguration(currentColumn, config);

            // Update column header
            updateColumnHeader(currentColumn, columnType, selectedEngagementId, period, drcr);
            
            closeColumnDialog();
        }

        // Get period display text
        function getPeriodDisplayText(periodValue) {
            if (periodValue === 'current-period') {
                return 'CP';
            }
            return periodValue; // Return the date as-is for other values
        }

        // Update column header
        function updateColumnHeader(columnIndex, columnType, engagementId, period, drcr) {
            const headerCell = document.getElementById(`header-col-${columnIndex}`);
            if (!headerCell) return;

            let headerText = getColumnTypeDisplayName(columnType);
            
            if (engagementId) {
                const engagement = consolidationData.find(e => e.id === engagementId);
                if (engagement) {
                    const periodText = getPeriodDisplayText(period);
                    headerCell.innerHTML = `
                        <div class="column-header-with-engagement">
                            <div class="engagement-name-header">${engagement.label}</div>
                            <div class="balance-type-header">${headerText}</div>
                            <div class="period-drcr-header">${periodText} | ${drcr.toUpperCase()}</div>
                        </div>
                    `;
                } else {
                    headerCell.textContent = headerText;
                }
            } else {
                headerCell.textContent = headerText;
            }
        }

        // Get display name for column type
        function getColumnTypeDisplayName(columnType) {
            const displayNames = {
                'not-used': 'Not Used',
                'account-grouping': 'Account Grouping',
                'tax-information': 'Tax Information',
                'unadjusted-balance': 'Unadjusted Balance',
                'budget-balance': 'Budget Balance',
                'adjusted-budget-balance': 'Adjusted Budget Balance',
                'adjusted-balance': 'Adjusted Balance',
                'report-balance': 'Report Balance',
                'federal-tax-balance': 'Federal Tax Balance',
                'state-tax-balance': 'State Tax Balance',
                'other-balance': 'Other Balance',
                'proposed-balance': 'Proposed Balance'
            };
            return displayNames[columnType] || columnType;
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.engagement-dropdown')) {
                document.getElementById('engagementDropdownMenu').classList.remove('show');
            }
        });

        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            initializeEngagementList();
        });
