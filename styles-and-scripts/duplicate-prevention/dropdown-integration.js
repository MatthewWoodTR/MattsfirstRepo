// Dropdown Integration JavaScript
// Created: December 5, 2025  
// Purpose: Event handlers and real-time validation integration
// Thomson Reuters Engagement Manager - Duplicate Prevention System

/**
 * Dropdown Integration System
 * Connects duplicate prevention logic to existing dropdown controls
 */

(function() {
    'use strict';

    // Track original functions to preserve existing functionality
    let originalHandleColumnTypeChange = null;

    /**
     * Initialize dropdown integration when DOM is ready
     */
    function initializeDropdownIntegration() {
        console.log('Initializing duplicate prevention dropdown integration...');
        
        // Preserve existing functions
        preserveExistingFunctions();
        
        // Set up event listeners
        setupColumnTypeListeners();
        setupPeriodListeners();
        setupDrCrListeners();
        setupEngagementListeners();
        
        // Set up mutation observers for dynamic content
        setupMutationObservers();
        
        console.log('Dropdown integration initialized successfully');
    }

    /**
     * Preserve existing functions before we modify them
     */
    function preserveExistingFunctions() {
        if (typeof window.handleColumnTypeChange === 'function') {
            originalHandleColumnTypeChange = window.handleColumnTypeChange;
        }
    }

    /**
     * Set up column type dropdown listeners
     */
    function setupColumnTypeListeners() {
        // Override the existing handleColumnTypeChange function
        window.handleColumnTypeChange = function() {
            // Call original function first if it exists
            if (originalHandleColumnTypeChange) {
                originalHandleColumnTypeChange.apply(this, arguments);
            }
            
            // Add our validation logic
            handleColumnTypeValidation();
        };
        
        // Also set up direct event listeners for column type dropdowns
        const columnTypeDropdowns = document.querySelectorAll('#columnType, select[name*="columnType"], .column-type-select');
        columnTypeDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const balanceType = event.target.value;
                
                // Update configuration
                updateColumnConfiguration(columnIndex, {
                    balanceType: balanceType
                });
                
                // Update dropdown states
                updateDropdownStates();
            });
        });
    }

    /**
     * Set up period dropdown listeners
     */
    function setupPeriodListeners() {
        // Find period dropdowns and add event listeners
        const periodDropdowns = document.querySelectorAll('#period, select[name*="period"], .period-select');
        periodDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const period = event.target.value;
                
                // Update configuration
                updateColumnConfiguration(columnIndex, {
                    period: period
                });
                
                // Update dropdown states to enforce business rules
                updateDropdownStates();
                
                // Validate business rules specifically for period changes
                validatePeriodBusinessRules(columnIndex, period);
            });
        });
    }

    /**
     * Set up debit/credit dropdown listeners
     */
    function setupDrCrListeners() {
        const drCrDropdowns = document.querySelectorAll('#drcr, select[name*="drcr"], select[name*="debit"], select[name*="credit"], .drcr-select');
        drCrDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const drCr = event.target.value;
                
                // Update configuration
                updateColumnConfiguration(columnIndex, {
                    drCr: drCr
                });
                
                // Update dropdown states
                updateDropdownStates();
            });
        });
    }

    /**
     * Set up engagement selector listeners
     */
    function setupEngagementListeners() {
        // Handle both select dropdowns and custom engagement selectors
        const engagementDropdowns = document.querySelectorAll('#engagement, select[name*="engagement"], .engagement-select');
        engagementDropdowns.forEach(dropdown => {
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const engagement = event.target.value;
                
                // Update configuration
                updateColumnConfiguration(columnIndex, {
                    engagement: engagement
                });
                
                // Update dropdown states
                updateDropdownStates();
            });
        });
        
        // Handle custom engagement dropdown with click events
        setupCustomEngagementListeners();
    }

    /**
     * Set up custom engagement dropdown listeners (for click-based selectors)
     */
    function setupCustomEngagementListeners() {
        // Look for engagement buttons or custom selectors
        document.addEventListener('click', function(event) {
            const target = event.target;
            
            // Check if this is an engagement selection
            if (target.matches('.engagement-option, .dropdown-item[data-engagement], button[data-engagement]')) {
                const columnIndex = determineColumnIndex(target);
                const engagement = target.getAttribute('data-engagement') || target.textContent.trim();
                
                // Update configuration
                updateColumnConfiguration(columnIndex, {
                    engagement: engagement
                });
                
                // Update dropdown states
                updateDropdownStates();
                
                // Update the display if needed
                updateEngagementDisplay(columnIndex, engagement);
            }
        });
    }

    /**
     * Update engagement display in the UI
     */
    function updateEngagementDisplay(columnIndex, engagement) {
        // Find the engagement display element for this column
        const displayElement = document.querySelector(`#selectedEngagement${columnIndex}, .engagement-display[data-column="${columnIndex}"], .selected-engagement`);
        if (displayElement) {
            displayElement.textContent = engagement;
        }
    }

    /**
     * Determine which column index a dropdown belongs to
     */
    function determineColumnIndex(element) {
        // Method 1: Check for data attributes
        const dataColumn = element.getAttribute('data-column');
        if (dataColumn !== null) {
            return parseInt(dataColumn);
        }
        
        // Method 2: Check parent elements for column indicators
        let parent = element.parentElement;
        while (parent) {
            const parentColumn = parent.getAttribute('data-column');
            if (parentColumn !== null) {
                return parseInt(parentColumn);
            }
            
            // Check for column class patterns
            const classList = parent.classList;
            for (const className of classList) {
                if (className.startsWith('column-') && /column-\d+/.test(className)) {
                    return parseInt(className.replace('column-', ''));
                }
            }
            
            parent = parent.parentElement;
        }
        
        // Method 3: Find the column based on position
        const allColumns = document.querySelectorAll('.column, [data-column]');
        for (let i = 0; i < allColumns.length; i++) {
            if (allColumns[i].contains(element)) {
                return i;
            }
        }
        
        // Method 4: Use the current column being configured (fallback)
        const currentColumn = getCurrentColumnIndex();
        if (currentColumn !== null) {
            return currentColumn;
        }
        
        // Default to 0 if we can't determine the column
        console.warn('Could not determine column index for element:', element);
        return 0;
    }

    /**
     * Get the currently active/selected column index
     */
    function getCurrentColumnIndex() {
        // Look for active column indicators
        const activeColumn = document.querySelector('.column.active, .column.selected, [data-column].active');
        if (activeColumn) {
            return parseInt(activeColumn.getAttribute('data-column')) || 0;
        }
        
        // Look for currently visible column configuration
        const visibleConfig = document.querySelector('.column-config:not(.hidden), .column-configuration.show');
        if (visibleConfig) {
            const columnAttr = visibleConfig.getAttribute('data-column');
            if (columnAttr !== null) {
                return parseInt(columnAttr);
            }
        }
        
        return null;
    }

    /**
     * Handle column type validation after selection
     */
    function handleColumnTypeValidation() {
        // This is called after the original handleColumnTypeChange
        // We can add any additional validation logic here
        
        // Trigger a full validation check
        if (typeof validateConfiguration === 'function') {
            validateConfiguration();
        }
    }

    /**
     * Validate business rules specifically for period changes
     */
    function validatePeriodBusinessRules(columnIndex, period) {
        if (!period) return;
        
        const config = getColumnConfiguration(columnIndex);
        
        // Enforce business rule: Current period = unadjusted only
        if (period.toLowerCase().includes('current')) {
            // Update balance type dropdown to show only unadjusted options
            filterBalanceTypeOptions(columnIndex, period, 'unadjusted-only');
        }
        
        // Enforce business rule: Prior periods = other balance types only
        if (period.toLowerCase().includes('prior')) {
            // Update balance type dropdown to exclude unadjusted options
            filterBalanceTypeOptions(columnIndex, period, 'no-unadjusted');
        }
    }

    /**
     * Filter balance type options based on business rules
     */
    function filterBalanceTypeOptions(columnIndex, period, filterType) {
        // Find the balance type dropdown for this column
        const balanceTypeDropdowns = document.querySelectorAll('#columnType, select[name*="columnType"], .column-type-select');
        
        balanceTypeDropdowns.forEach(dropdown => {
            const dropdownColumnIndex = determineColumnIndex(dropdown);
            if (dropdownColumnIndex === columnIndex) {
                const options = dropdown.querySelectorAll('option');
                
                options.forEach(option => {
                    const value = option.value.toLowerCase();
                    const text = option.textContent.toLowerCase();
                    
                    if (filterType === 'unadjusted-only') {
                        // Only allow unadjusted options for current period
                        if (!value.includes('unadjusted') && !text.includes('unadjusted') && option.value !== '') {
                            option.disabled = true;
                            option.classList.add('dropdown-option-disabled');
                        } else {
                            option.disabled = false;
                            option.classList.remove('dropdown-option-disabled');
                        }
                    } else if (filterType === 'no-unadjusted') {
                        // Disable unadjusted options for prior periods
                        if ((value.includes('unadjusted') || text.includes('unadjusted')) && option.value !== '') {
                            option.disabled = true;
                            option.classList.add('dropdown-option-disabled');
                        } else {
                            option.disabled = false;
                            option.classList.remove('dropdown-option-disabled');
                        }
                    }
                });
            }
        });
    }

    /**
     * Update dropdown states to prevent conflicts
     */
    window.updateDropdownStates = function() {
        // Get all configured columns
        const configuredColumns = getBalanceColumns();
        
        // For each column, update its dropdown options
        configuredColumns.forEach(columnIndex => {
            updateColumnDropdownStates(columnIndex);
        });
        
        // Also update any currently active column dropdowns
        updateActiveColumnDropdowns();
    };

    /**
     * Update dropdown states for a specific column
     */
    function updateColumnDropdownStates(columnIndex) {
        const config = getColumnConfiguration(columnIndex);
        
        // Update engagement dropdown
        filterConflictingEngagements(columnIndex, config);
        
        // Update balance type dropdown
        filterConflictingBalanceTypes(columnIndex, config);
        
        // Update period dropdown
        filterConflictingPeriods(columnIndex, config);
        
        // Update debit/credit dropdown
        filterConflictingDrCr(columnIndex, config);
    }

    /**
     * Update dropdown states for any currently active/visible column
     */
    function updateActiveColumnDropdowns() {
        // Find active dropdowns and update them
        const activeDropdowns = document.querySelectorAll('select:not([disabled]), .dropdown.show select');
        
        activeDropdowns.forEach(dropdown => {
            const columnIndex = determineColumnIndex(dropdown);
            updateColumnDropdownStates(columnIndex);
        });
    }

    /**
     * Filter conflicting engagement options
     */
    function filterConflictingEngagements(columnIndex, currentConfig) {
        // Implementation depends on how engagements are handled
        // This would disable engagement options that would create conflicts
        
        const engagementDropdowns = document.querySelectorAll('#engagement, select[name*="engagement"], .engagement-select');
        engagementDropdowns.forEach(dropdown => {
            const dropdownColumnIndex = determineColumnIndex(dropdown);
            if (dropdownColumnIndex === columnIndex) {
                // Mark conflicting options
                filterConflictingOptions(dropdown, 'engagement', currentConfig);
            }
        });
    }

    /**
     * Filter conflicting balance type options
     */
    function filterConflictingBalanceTypes(columnIndex, currentConfig) {
        const balanceTypeDropdowns = document.querySelectorAll('#columnType, select[name*="columnType"], .column-type-select');
        balanceTypeDropdowns.forEach(dropdown => {
            const dropdownColumnIndex = determineColumnIndex(dropdown);
            if (dropdownColumnIndex === columnIndex) {
                filterConflictingOptions(dropdown, 'balanceType', currentConfig);
            }
        });
    }

    /**
     * Filter conflicting period options
     */
    function filterConflictingPeriods(columnIndex, currentConfig) {
        const periodDropdowns = document.querySelectorAll('#period, select[name*="period"], .period-select');
        periodDropdowns.forEach(dropdown => {
            const dropdownColumnIndex = determineColumnIndex(dropdown);
            if (dropdownColumnIndex === columnIndex) {
                filterConflictingOptions(dropdown, 'period', currentConfig);
            }
        });
    }

    /**
     * Filter conflicting debit/credit options
     */
    function filterConflictingDrCr(columnIndex, currentConfig) {
        const drCrDropdowns = document.querySelectorAll('#drcr, select[name*="drcr"], .drcr-select');
        drCrDropdowns.forEach(dropdown => {
            const dropdownColumnIndex = determineColumnIndex(dropdown);
            if (dropdownColumnIndex === columnIndex) {
                filterConflictingOptions(dropdown, 'drCr', currentConfig);
            }
        });
    }

    /**
     * Generic function to filter conflicting options in a dropdown
     */
    function filterConflictingOptions(dropdown, fieldType, currentConfig) {
        if (!dropdown || !dropdown.options) return;
        
        const options = dropdown.options;
        const columnIndex = determineColumnIndex(dropdown);
        
        // Get all other configured columns
        const otherConfigurations = [];
        for (const colIndex in window.columnConfigurations) {
            const colNum = parseInt(colIndex);
            if (colNum !== columnIndex) {
                const config = window.columnConfigurations[colIndex];
                if (config.engagement && config.balanceType && config.period && config.drCr) {
                    otherConfigurations.push(config);
                }
            }
        }
        
        // Check each option for conflicts
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (option.value === '') continue; // Skip empty options
            
            // Create a test configuration with this option
            const testConfig = {...currentConfig};
            testConfig[fieldType] = option.value;
            
            // Check if this would create a conflict
            const wouldConflict = wouldCreateConflict(testConfig, otherConfigurations);
            
            if (wouldConflict) {
                option.classList.add('dropdown-option-conflict');
                option.title = 'This selection would create a duplicate configuration';
            } else {
                option.classList.remove('dropdown-option-conflict');
                option.title = '';
            }
        }
    }

    /**
     * Check if a configuration would create a conflict
     */
    function wouldCreateConflict(testConfig, otherConfigurations) {
        // Skip if configuration is incomplete
        if (!testConfig.engagement || !testConfig.balanceType || !testConfig.period || !testConfig.drCr) {
            return false;
        }
        
        // Check against all other configurations
        for (const otherConfig of otherConfigurations) {
            // Check for exact duplicate
            if (testConfig.engagement === otherConfig.engagement &&
                testConfig.balanceType === otherConfig.balanceType &&
                testConfig.period === otherConfig.period &&
                testConfig.drCr === otherConfig.drCr) {
                return true;
            }
            
            // Special case: Unadjusted Current Period Dr/Cr can be duplicate if different engagements
            const isUnadjustedCurrent = 
                testConfig.balanceType.toLowerCase().includes('unadjusted') && 
                testConfig.period.toLowerCase().includes('current');
                
            const otherIsUnadjustedCurrent = 
                otherConfig.balanceType.toLowerCase().includes('unadjusted') && 
                otherConfig.period.toLowerCase().includes('current');
                
            if (isUnadjustedCurrent && otherIsUnadjustedCurrent) {
                // Allow if engagements are different
                if (testConfig.engagement !== otherConfig.engagement) {
                    continue; // Not a conflict
                }
                // Same engagement + same Dr/Cr = conflict
                if (testConfig.drCr === otherConfig.drCr) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Set up mutation observers to handle dynamic content
     */
    function setupMutationObservers() {
        // Watch for new dropdown elements being added to the DOM
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1) { // Element node
                            // Check if new dropdowns were added
                            const newDropdowns = node.querySelectorAll ? node.querySelectorAll('select') : [];
                            newDropdowns.forEach(dropdown => {
                                setupDropdownListener(dropdown);
                            });
                            
                            // Check if the added node itself is a dropdown
                            if (node.tagName === 'SELECT') {
                                setupDropdownListener(node);
                            }
                        }
                    });
                }
            });
        });
        
        // Start observing
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Set up listener for a single dropdown
     */
    function setupDropdownListener(dropdown) {
        // Determine what type of dropdown this is and set up appropriate listener
        const id = dropdown.id;
        const name = dropdown.name || '';
        const className = dropdown.className || '';
        
        if (id.includes('columnType') || name.includes('columnType') || className.includes('column-type')) {
            // Column type dropdown
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const balanceType = event.target.value;
                updateColumnConfiguration(columnIndex, { balanceType: balanceType });
                updateDropdownStates();
            });
        } else if (id.includes('period') || name.includes('period') || className.includes('period')) {
            // Period dropdown
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const period = event.target.value;
                updateColumnConfiguration(columnIndex, { period: period });
                updateDropdownStates();
                validatePeriodBusinessRules(columnIndex, period);
            });
        } else if (id.includes('drcr') || id.includes('debit') || id.includes('credit') || 
                   name.includes('drcr') || className.includes('drcr')) {
            // Dr/Cr dropdown
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const drCr = event.target.value;
                updateColumnConfiguration(columnIndex, { drCr: drCr });
                updateDropdownStates();
            });
        } else if (id.includes('engagement') || name.includes('engagement') || className.includes('engagement')) {
            // Engagement dropdown
            dropdown.addEventListener('change', function(event) {
                const columnIndex = determineColumnIndex(event.target);
                const engagement = event.target.value;
                updateColumnConfiguration(columnIndex, { engagement: engagement });
                updateDropdownStates();
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDropdownIntegration);
    } else {
        initializeDropdownIntegration();
    }

})();