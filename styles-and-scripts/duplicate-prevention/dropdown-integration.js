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
    let originalOpenColumnDialog = null;
    let originalSaveColumnDetails = null;
    
    // Track the current column being configured
    let currentColumnIndex = null;

    /**
     * Initialize dropdown integration when DOM is ready
     */
    function initializeDropdownIntegration() {
        console.log('Initializing duplicate prevention dropdown integration...');
        
        // Preserve existing functions
        preserveExistingFunctions();
        
        // Override existing functions to track column index
        overrideExistingFunctions();
        
        // Set up event listeners
        setupEventListeners();
        
        console.log('Dropdown integration initialized successfully');
    }

    /**
     * Preserve existing functions before we modify them
     */
    function preserveExistingFunctions() {
        if (typeof window.handleColumnTypeChange === 'function') {
            originalHandleColumnTypeChange = window.handleColumnTypeChange;
        }
        if (typeof window.openColumnDialog === 'function') {
            originalOpenColumnDialog = window.openColumnDialog;
        }
        if (typeof window.saveColumnDetails === 'function') {
            originalSaveColumnDetails = window.saveColumnDetails;
        }
    }

    /**
     * Override existing functions to add our tracking
     */
    function overrideExistingFunctions() {
        // Override openColumnDialog to track which column is being configured
        window.openColumnDialog = function(columnIndex) {
            console.log('Opening column dialog for column:', columnIndex);
            currentColumnIndex = columnIndex;
            
            // Call original function
            if (originalOpenColumnDialog) {
                originalOpenColumnDialog.call(this, columnIndex);
            }
            
            // Load existing configuration for this column
            loadColumnConfiguration(columnIndex);
        };

        // Override saveColumnDetails to validate and save configuration
        window.saveColumnDetails = function() {
            console.log('Saving column details for column:', currentColumnIndex);
            
            // Get current form values
            const config = getCurrentFormConfiguration();
            
            // Validate the configuration
            const validation = validateColumnConfiguration(currentColumnIndex, config);
            
            if (!validation.isValid) {
                // Show error messages
                showValidationErrors(validation.errors);
                return; // Don't save if invalid
            }
            
            // Save the configuration
            updateColumnConfiguration(currentColumnIndex, config);
            
            // Update the column header display
            updateColumnHeaderDisplay(currentColumnIndex, config);
            
            // Call original function
            if (originalSaveColumnDetails) {
                originalSaveColumnDetails.call(this);
            } else {
                // If no original function, close the dialog ourselves
                closeColumnDialog();
            }
            
            // Show success message
            showSuccessMessage('Column configuration saved successfully!');
        };

        // Override handleColumnTypeChange to add validation
        window.handleColumnTypeChange = function() {
            // Call original function first
            if (originalHandleColumnTypeChange) {
                originalHandleColumnTypeChange.call(this);
            }
            
            // Add our validation logic
            handleColumnTypeValidation();
        };
    }

    /**
     * Set up all event listeners
     */
    function setupEventListeners() {
        // Column type dropdown
        const columnTypeDropdown = document.getElementById('columnType');
        if (columnTypeDropdown) {
            columnTypeDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
            });
        }

        // Period dropdown
        const periodDropdown = document.getElementById('period');
        if (periodDropdown) {
            periodDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
                enforceBusinessRules();
            });
        }

        // DR/CR dropdown
        const drcrDropdown = document.getElementById('drcr');
        if (drcrDropdown) {
            drcrDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
            });
        }

        // Engagement selection (custom dropdown)
        document.addEventListener('click', function(event) {
            if (event.target.matches('.engagement-item, [data-engagement]')) {
                const engagement = event.target.getAttribute('data-engagement') || event.target.textContent.trim();
                
                // Update the selected engagement display
                const selectedEngagement = document.getElementById('selectedEngagement');
                if (selectedEngagement) {
                    selectedEngagement.textContent = engagement;
                }
                
                // Update configuration
                const config = getCurrentFormConfiguration();
                config.engagement = engagement;
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
                
                // Close the engagement dropdown
                const dropdownMenu = document.getElementById('engagementDropdownMenu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = 'none';
                }
            }
        });
    }

    /**
     * Get current form configuration from the modal
     */
    function getCurrentFormConfiguration() {
        const columnType = document.getElementById('columnType');
        const period = document.getElementById('period');
        const drcr = document.getElementById('drcr');
        const selectedEngagement = document.getElementById('selectedEngagement');

        return {
            balanceType: columnType ? columnType.value : '',
            period: period ? period.value : '',
            drCr: drcr ? drcr.value : '',
            engagement: selectedEngagement ? selectedEngagement.textContent.trim() : ''
        };
    }

    /**
     * Load existing configuration for a column into the form
     */
    function loadColumnConfiguration(columnIndex) {
        const config = getColumnConfiguration(columnIndex);
        
        // Populate form fields with existing values
        const columnType = document.getElementById('columnType');
        const period = document.getElementById('period');
        const drcr = document.getElementById('drcr');
        const selectedEngagement = document.getElementById('selectedEngagement');

        if (columnType && config.balanceType) {
            columnType.value = config.balanceType;
        }
        if (period && config.period) {
            period.value = config.period;
        }
        if (drcr && config.drCr) {
            drcr.value = config.drCr;
        }
        if (selectedEngagement && config.engagement) {
            selectedEngagement.textContent = config.engagement;
        }
    }

    /**
     * Validate current configuration and show real-time feedback
     */
    function validateCurrentConfiguration() {
        if (currentColumnIndex === null) return;
        
        const config = getCurrentFormConfiguration();
        const validation = validateColumnConfiguration(currentColumnIndex, config);
        
        // Clear previous error states
        clearValidationErrors();
        
        if (!validation.isValid) {
            showValidationErrors(validation.errors);
        }
        
        // Update dropdown states to prevent conflicts
        updateDropdownStates();
    }

    /**
     * Validate a column configuration
     */
    function validateColumnConfiguration(columnIndex, config) {
        const errors = [];
        
        // Skip validation if configuration is incomplete
        if (!config.balanceType || !config.period || !config.drCr || !config.engagement) {
            return { isValid: true, errors: [] }; // Allow incomplete configurations
        }
        
        // Get all balance columns for duplicate checking
        const balanceColumns = getAllBalanceColumns();
        
        // Check for duplicates - pass the required parameter
        const conflicts = checkForDuplicates(balanceColumns) || []; // Ensure it's always an array
        const currentKey = generateConfigurationKey(config.engagement, config.balanceType, config.period, config.drCr);
        
        for (const conflict of conflicts) {
            if (conflict.key === currentKey && conflict.columns.indexOf(columnIndex) === -1) {
                // This configuration would create a duplicate
                const conflictColumns = conflict.columns.join(', ');
                errors.push(`This configuration duplicates columns ${conflictColumns}. Each column must have a unique combination of engagement, balance type, period, and debit/credit.`);
                break;
            }
        }
        
        // Check business rules
        const businessRuleErrors = checkBusinessRules(config);
        errors.push(...businessRuleErrors);
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get all balance columns for validation
     */
    function getAllBalanceColumns() {
        const balanceColumns = [];
        
        // Check if columnConfigurations exists
        if (!window.columnConfigurations) {
            return balanceColumns;
        }
        
        // Iterate through all configured columns
        for (const columnIndex in window.columnConfigurations) {
            const config = window.columnConfigurations[columnIndex];
            
            // Only include balance columns (not 'not-used')
            if (config && config.balanceType && config.balanceType !== 'not-used') {
                balanceColumns.push({
                    columnIndex: parseInt(columnIndex),
                    engagement: config.engagement || '',
                    balanceType: config.balanceType || '',
                    period: config.period || '',
                    drCr: config.drCr || ''
                });
            }
        }
        
        return balanceColumns;
    }

    /**
     * Check business rules for a configuration
     */
    function checkBusinessRules(config) {
        const errors = [];
        
        // Rule: Current period = unadjusted only
        if (config.period && config.period.toLowerCase().includes('current')) {
            if (config.balanceType && !config.balanceType.toLowerCase().includes('unadjusted')) {
                errors.push('Current Period can only be used with Unadjusted Balance types.');
            }
        }
        
        // Rule: Prior periods = other balance types only
        if (config.period && !config.period.toLowerCase().includes('current')) {
            if (config.balanceType && config.balanceType.toLowerCase().includes('unadjusted')) {
                errors.push('Prior periods cannot be used with Unadjusted Balance types.');
            }
        }
        
        return errors;
    }

    /**
     * Enforce business rules by updating dropdown options
     */
    function enforceBusinessRules() {
        const period = document.getElementById('period');
        const columnType = document.getElementById('columnType');
        
        if (!period || !columnType) return;
        
        const selectedPeriod = period.value;
        
        // Get all column type options
        const options = columnType.querySelectorAll('option');
        
        options.forEach(option => {
            const value = option.value.toLowerCase();
            const text = option.textContent.toLowerCase();
            
            if (selectedPeriod && selectedPeriod.toLowerCase().includes('current')) {
                // Current period: only allow unadjusted
                if (!value.includes('unadjusted') && !text.includes('unadjusted') && option.value !== '') {
                    option.disabled = true;
                    option.style.color = '#999';
                    option.title = 'Current Period can only be used with Unadjusted Balance types';
                } else {
                    option.disabled = false;
                    option.style.color = '';
                    option.title = '';
                }
            } else if (selectedPeriod && !selectedPeriod.toLowerCase().includes('current')) {
                // Prior periods: exclude unadjusted
                if ((value.includes('unadjusted') || text.includes('unadjusted')) && option.value !== '') {
                    option.disabled = true;
                    option.style.color = '#999';
                    option.title = 'Prior periods cannot be used with Unadjusted Balance types';
                } else {
                    option.disabled = false;
                    option.style.color = '';
                    option.title = '';
                }
            } else {
                // No period selected: enable all options
                option.disabled = false;
                option.style.color = '';
                option.title = '';
            }
        });
    }

    /**
     * Update dropdown states to show conflicts
     */
    function updateDropdownStates() {
        if (currentColumnIndex === null) return;
        
        const currentConfig = getCurrentFormConfiguration();
        
        // Update each dropdown to show conflicting options
        updateColumnTypeDropdownStates(currentConfig);
        updatePeriodDropdownStates(currentConfig);
        updateDrCrDropdownStates(currentConfig);
    }

    /**
     * Update column type dropdown to show conflicts
     */
    function updateColumnTypeDropdownStates(currentConfig) {
        const columnType = document.getElementById('columnType');
        if (!columnType) return;
        
        const options = columnType.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') return;
            
            const testConfig = { ...currentConfig, balanceType: option.value };
            const wouldConflict = wouldCreateConflict(testConfig);
            
            if (wouldConflict) {
                option.style.backgroundColor = '#ffe6e6';
                option.title = 'This selection would create a duplicate configuration';
            } else {
                option.style.backgroundColor = '';
                option.title = '';
            }
        });
    }

    /**
     * Update period dropdown to show conflicts
     */
    function updatePeriodDropdownStates(currentConfig) {
        const period = document.getElementById('period');
        if (!period) return;
        
        const options = period.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') return;
            
            const testConfig = { ...currentConfig, period: option.value };
            const wouldConflict = wouldCreateConflict(testConfig);
            
            if (wouldConflict) {
                option.style.backgroundColor = '#ffe6e6';
                option.title = 'This selection would create a duplicate configuration';
            } else {
                option.style.backgroundColor = '';
                option.title = '';
            }
        });
    }

    /**
     * Update DR/CR dropdown to show conflicts
     */
    function updateDrCrDropdownStates(currentConfig) {
        const drcr = document.getElementById('drcr');
        if (!drcr) return;
        
        const options = drcr.querySelectorAll('option');
        options.forEach(option => {
            if (option.value === '') return;
            
            const testConfig = { ...currentConfig, drCr: option.value };
            const wouldConflict = wouldCreateConflict(testConfig);
            
            if (wouldConflict) {
                option.style.backgroundColor = '#ffe6e6';
                option.title = 'This selection would create a duplicate configuration';
            } else {
                option.style.backgroundColor = '';
                option.title = '';
            }
        });
    }

    /**
     * Check if a configuration would create a conflict
     */
    function wouldCreateConflict(testConfig) {
        if (!testConfig.engagement || !testConfig.balanceType || !testConfig.period || !testConfig.drCr) {
            return false;
        }
        
        // Get all other configured columns
        if (!window.columnConfigurations) {
            return false;
        }
        
        for (const columnIndex in window.columnConfigurations) {
            const colNum = parseInt(columnIndex);
            if (colNum === currentColumnIndex) continue;
            
            const otherConfig = window.columnConfigurations[columnIndex];
            if (!otherConfig.engagement || !otherConfig.balanceType || !otherConfig.period || !otherConfig.drCr) {
                continue;
            }
            
            // Check for exact match
            if (testConfig.engagement === otherConfig.engagement &&
                testConfig.balanceType === otherConfig.balanceType &&
                testConfig.period === otherConfig.period &&
                testConfig.drCr === otherConfig.drCr) {
                
                // Special case: Multiple 'Unadjusted Current Period Dr/Cr' allowed if different engagements
                const isUnadjustedCurrent = 
                    testConfig.balanceType.toLowerCase().includes('unadjusted') && 
                    testConfig.period.toLowerCase().includes('current');
                    
                if (isUnadjustedCurrent && testConfig.engagement !== otherConfig.engagement) {
                    continue; // Not a conflict
                }
                
                return true; // Conflict found
            }
        }
        
        return false;
    }

    /**
     * Show validation errors in the UI
     */
    function showValidationErrors(errors) {
        // Remove existing error messages
        clearValidationErrors();
        
        // Show each error
        errors.forEach(error => {
            showErrorMessage(error);
        });
    }

    /**
     * Clear validation error displays
     */
    function clearValidationErrors() {
        // Clear any existing error styling
        const dropdowns = ['columnType', 'period', 'drcr'];
        dropdowns.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.borderColor = '';
                element.classList.remove('error');
            }
        });
    }

    /**
     * Update column header display with new configuration
     */
    function updateColumnHeaderDisplay(columnIndex, config) {
        const header = document.getElementById(`header-col-${columnIndex}`);
        if (!header) return;
        
        // Update the header content
        let headerContent = '';
        
        if (config.balanceType === 'not-used' || !config.balanceType) {
            headerContent = 'Not Used';
        } else {
            const engagementName = config.engagement || 'No Engagement';
            const balanceType = config.balanceType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const period = config.period === 'current-period' ? 'CP' : config.period;
            const drCr = config.drCr.toUpperCase();
            
            headerContent = `
                <div class="column-header-with-engagement">
                    <div class="engagement-name-header">${engagementName}</div>
                    <div class="balance-type-header">${balanceType}</div>
                    <div class="period-drcr-header">${period} | ${drCr}</div>
                </div>
            `;
        }
        
        header.innerHTML = headerContent;
    }

    /**
     * Handle column type validation
     */
    function handleColumnTypeValidation() {
        validateCurrentConfiguration();
        enforceBusinessRules();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDropdownIntegration);
    } else {
        initializeDropdownIntegration();
    }

})();