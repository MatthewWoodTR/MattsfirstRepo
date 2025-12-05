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
            
            // Initialize dropdown states - show ALL options initially
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
                updateDropdownStates(); // Apply filtering based on new selection
            });
        }

        // Period dropdown
        const periodDropdown = document.getElementById('period');
        if (periodDropdown) {
            periodDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                updateDropdownStates(); // Apply business rules and filtering
            });
        }

        // DR/CR dropdown
        const drcrDropdown = document.getElementById('drcr');
        if (drcrDropdown) {
            drcrDropdown.addEventListener('change', function() {
                const config = getCurrentFormConfiguration();
                updateColumnConfiguration(currentColumnIndex, config);
                updateDropdownStates(); // Apply engagement filtering
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
                
                // Close the engagement dropdown
                const dropdownMenu = document.getElementById('engagementDropdownMenu');
                if (dropdownMenu) {
                    dropdownMenu.style.display = 'none';
                }
            }
        });
    }

    /**
     * Initialize dropdown states when dialog opens - SHOW ALL OPTIONS INITIALLY
     */
    function initializeDropdownStates() {
        // Reset all dropdowns to show ALL options initially
        resetDropdownStates();
        
        // Don't apply any restrictions initially - let user make selections first
        console.log('Dropdown states initialized - all options available');
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
                option.removeAttribute('data-conflict');
            });
        });

        // Reset engagement dropdown options too
        resetEngagementDropdownStates();
    }

    /**
     * Reset engagement dropdown states
     */
    function resetEngagementDropdownStates() {
        const engagementItems = document.querySelectorAll('.engagement-item, [data-engagement]');
        engagementItems.forEach(item => {
            item.style.display = '';
            item.style.color = '';
            item.style.backgroundColor = '';
            item.removeAttribute('data-conflict');
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
     * Update dropdown states based on current selections - PROACTIVE FILTERING
     */
    function updateDropdownStates() {
        if (currentColumnIndex === null) return;
        
        const currentConfig = getCurrentFormConfiguration();
        
        // Only apply restrictions when user has made selections
        // Step 1: Apply business rules when period is selected
        if (currentConfig.period) {
            applyBusinessRulesToBalanceTypes(currentConfig);
        }
        
        // Step 2: Apply duplicate prevention when enough info is available
        if (currentConfig.balanceType && currentConfig.period && currentConfig.drCr) {
            filterConflictingEngagements(currentConfig);
        }
    }

    /**
     * Apply business rules to balance type options based on selected period
     */
    function applyBusinessRulesToBalanceTypes(currentConfig) {
        const columnType = document.getElementById('columnType');
        if (!columnType) return;
        
        const selectedPeriod = currentConfig.period.toLowerCase();
        const options = columnType.querySelectorAll('option');
        
        options.forEach(option => {
            const value = option.value.toLowerCase();
            const text = option.textContent.toLowerCase();
            
            // Reset styling first
            option.disabled = false;
            option.style.color = '';
            option.title = '';
            
            if (selectedPeriod.includes('current')) {
                // Current period: only allow unadjusted
                if (!value.includes('unadjusted') && !text.includes('unadjusted') && option.value !== '') {
                    option.disabled = true;
                    option.style.color = '#999';
                    option.title = 'Current Period can only be used with Unadjusted Balance types';
                }
            } else {
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
     * Filter engagement options that would create conflicts
     */
    function filterConflictingEngagements(currentConfig) {
        if (!window.columnConfigurations) return;
        
        // Get all engagement items
        const engagementItems = document.querySelectorAll('.engagement-item, [data-engagement]');
        
        engagementItems.forEach(item => {
            const engagement = item.getAttribute('data-engagement') || item.textContent.trim();
            
            // Check if this engagement would create a conflict
            const testConfig = {
                ...currentConfig,
                engagement: engagement
            };
            
            const conflicts = checkForDuplicateConfiguration(currentColumnIndex, testConfig);
            
            if (conflicts.length > 0) {
                // Hide conflicting engagement
                item.style.display = 'none';
                item.setAttribute('data-conflict', 'true');
            } else {
                // Show available engagement
                item.style.display = '';
                item.removeAttribute('data-conflict');
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
        updateDropdownStates();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDropdownIntegration);
    } else {
        initializeDropdownIntegration();
    }

})();