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
            
            // Initialize dropdown states
            setTimeout(() => {
                initializeDropdownStates();
            }, 100);
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
                updateDropdownStates(); // Update conflict indicators
            });
        }

        // Period dropdown
        const periodDropdown = document.getElementById('period');
        if (periodDropdown) {
            periodDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
                updateDropdownStates(); // Update conflict indicators
            });
        }

        // DR/CR dropdown
        const drcrDropdown = document.getElementById('drcr');
        if (drcrDropdown) {
            drcrDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                validateCurrentConfiguration();
                updateDropdownStates(); // Update conflict indicators
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
                updateDropdownStates(); // Update conflict indicators
                
                // Close the engagement dropdown
                const dropdownMenu = document.getElementById('engagementDropdownMenu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = 'none';
                }
            }
        });
    }

    /**
     * Initialize dropdown states when dialog opens
     */
    function initializeDropdownStates() {
        // Reset all dropdowns to show all options initially
        resetDropdownStates();
        
        // Then apply business rules and conflict detection
        updateDropdownStates();
    }

    /**
     * Reset all dropdown options to enabled state
     */
    function resetDropdownStates() {
        const dropdowns = ['columnType', 'period', 'drcr'];
        
        dropdowns.forEach(dropdownId => {
            const dropdown = document.getElementById(dropdownId);
            if (!dropdown) return;
            
            const options = dropdown.querySelectorAll('option');
            options.forEach(option => {
                option.disabled = false;
                option.style.color = '';
                option.style.backgroundColor = '';
                option.title = '';
            });
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
        
        // Check business rules first
        const businessRuleErrors = checkBusinessRules(config);
        errors.push(...businessRuleErrors);
        
        // Check for duplicates only if business rules pass
        if (businessRuleErrors.length === 0) {
            const conflicts = checkForDuplicateConfiguration(columnIndex, config);
            if (conflicts.length > 0) {
                errors.push(...conflicts);
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Check for duplicate configurations
     */
    function checkForDuplicateConfiguration(columnIndex, config) {
        const errors = [];
        
        if (!window.columnConfigurations) {
            return errors;
        }
        
        // Check against all other configured columns
        for (const otherColumnIndex in window.columnConfigurations) {
            const otherColNum = parseInt(otherColumnIndex);
            if (otherColNum === columnIndex) continue;
            
            const otherConfig = window.columnConfigurations[otherColumnIndex];
            if (!otherConfig || !otherConfig.engagement || !otherConfig.balanceType || 
                !otherConfig.period || !otherConfig.drCr) {
                continue;
            }
            
            // Check for exact match
            if (config.engagement === otherConfig.engagement &&
                config.balanceType === otherConfig.balanceType &&
                config.period === otherConfig.period &&
                config.drCr === otherConfig.drCr) {
                
                // Special case: Multiple 'Unadjusted Current Period Dr/Cr' allowed if different engagements
                const isUnadjustedCurrent = 
                    config.balanceType.toLowerCase().includes('unadjusted') && 
                    config.period.toLowerCase().includes('current');
                    
                if (isUnadjustedCurrent && config.engagement !== otherConfig.engagement) {
                    continue; // Not a conflict - different engagements allowed
                }
                
                errors.push(`This configuration duplicates Column ${otherColNum}. Each column must have a unique combination of engagement, balance type, period, and debit/credit.`);
            }
        }
        
        return errors;
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
     * Update dropdown states to show conflicts and enforce business rules
     */
    function updateDropdownStates() {
        if (currentColumnIndex === null) return;
        
        const currentConfig = getCurrentFormConfiguration();
        
        // Apply business rules first
        applyBusinessRulesToDropdowns(currentConfig);
        
        // Then apply conflict detection
        applyConflictDetectionToDropdowns(currentConfig);
    }

    /**
     * Apply business rules to dropdown options
     */
    function applyBusinessRulesToDropdowns(currentConfig) {
        const period = document.getElementById('period');
        const columnType = document.getElementById('columnType');
        
        if (!period || !columnType) return;
        
        const selectedPeriod = period.value;
        
        // Get all column type options
        const options = columnType.querySelectorAll('option');
        
        options.forEach(option => {
            const value = option.value.toLowerCase();
            const text = option.textContent.toLowerCase();
            
            // Reset business rule styling first
            if (!option.hasAttribute('data-conflict')) {
                option.disabled = false;
                option.style.color = '';
                option.title = '';
            }
            
            if (selectedPeriod && selectedPeriod.toLowerCase().includes('current')) {
                // Current period: only allow unadjusted
                if (!value.includes('unadjusted') && !text.includes('unadjusted') && option.value !== '') {
                    option.disabled = true;
                    option.style.color = '#999';
                    option.title = 'Current Period can only be used with Unadjusted Balance types';
                }
            } else if (selectedPeriod && !selectedPeriod.toLowerCase().includes('current')) {
                // Prior periods: exclude unadjusted
                if ((value.includes('unadjusted') || text.includes('unadjusted')) && option.value !== '') {
                    option.disabled = true;
                    option.style.color = '#999';
                    option.title = 'Prior periods cannot be used with Unadjusted Balance types';
                }
            }
        });
    }

    /**
     * Apply conflict detection to dropdown options
     */
    function applyConflictDetectionToDropdowns(currentConfig) {
        // Only apply conflict detection if we have enough information
        if (!currentConfig.engagement || !currentConfig.balanceType || 
            !currentConfig.period || !currentConfig.drCr) {
            return;
        }
        
        // Check engagement conflicts
        updateEngagementConflictStates(currentConfig);
    }

    /**
     * Update engagement dropdown to show conflicts
     */
    function updateEngagementConflictStates(currentConfig) {
        // This would be implemented when we have the engagement dropdown structure
        // For now, we'll focus on the main dropdowns
        
        // Check if current configuration would conflict with existing columns
        const wouldConflict = checkForDuplicateConfiguration(currentColumnIndex, currentConfig);
        
        if (wouldConflict.length > 0) {
            // Show visual indicator that this combination is conflicting
            showConflictWarning(currentConfig);
        }
    }

    /**
     * Show conflict warning for current configuration
     */
    function showConflictWarning(config) {
        // Add visual indicators to show the conflict
        const dropdowns = ['columnType', 'period', 'drcr'];
        
        dropdowns.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.borderColor = '#ff6600';
                element.style.borderWidth = '2px';
            }
        });
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
        
        // Add visual indicators to form elements
        const dropdowns = ['columnType', 'period', 'drcr'];
        dropdowns.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.borderColor = '#dc3545';
                element.style.borderWidth = '2px';
                element.classList.add('error');
            }
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
                element.style.borderWidth = '';
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
        updateDropdownStates();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDropdownIntegration);
    } else {
        initializeDropdownIntegration();
    }

})();