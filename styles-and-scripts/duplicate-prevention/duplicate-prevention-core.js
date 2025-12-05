// Duplicate Prevention Core Logic
// Created: December 5, 2025
// Purpose: Column configuration tracking and validation logic

/**
 * Column Configuration Tracking System
 * Tracks column configurations and validates against business rules
 */

// Global configuration storage
window.columnConfigurations = {};

/**
 * Update column configuration when user makes selections
 * @param {number} columnIndex - The column being configured
 * @param {Object} config - Configuration object with engagement, balanceType, period, drCr
 */
function updateColumnConfiguration(columnIndex, config) {
    if (!window.columnConfigurations[columnIndex]) {
        window.columnConfigurations[columnIndex] = {};
    }
    
    // Update the configuration
    Object.assign(window.columnConfigurations[columnIndex], config);
    
    // Trigger validation after update
    validateConfiguration();
}

/**
 * Get current configuration for a column
 * @param {number} columnIndex - The column to get configuration for
 * @returns {Object} Configuration object
 */
function getColumnConfiguration(columnIndex) {
    return window.columnConfigurations[columnIndex] || {};
}

/**
 * Get all configured columns that have balance types (participate in validation)
 * @returns {Array} Array of column indices with balance type configurations
 */
function getBalanceColumns() {
    const balanceColumns = [];
    
    for (const columnIndex in window.columnConfigurations) {
        const config = window.columnConfigurations[columnIndex];
        if (config.balanceType && config.balanceType !== '') {
            balanceColumns.push(parseInt(columnIndex));
        }
    }
    
    return balanceColumns;
}

/**
 * Main validation function - checks all business rules and conflicts
 * @returns {Object} Validation result with conflicts and messages
 */
function validateConfiguration() {
    const result = {
        valid: true,
        conflicts: [],
        businessRuleViolations: [],
        messages: []
    };
    
    // Get all columns that participate in validation (have balance types)
    const balanceColumns = getBalanceColumns();
    
    // Ensure balanceColumns is always an array
    if (!Array.isArray(balanceColumns)) {
        console.error('getBalanceColumns() did not return an array:', balanceColumns);
        return result;
    }
    
    // Check business rules for each column
    for (const columnIndex of balanceColumns) {
        const config = window.columnConfigurations[columnIndex];
        if (!config) {
            console.warn(`No configuration found for column ${columnIndex}`);
            continue;
        }
        
        const businessRuleCheck = checkBusinessRules(config);
        
        if (!businessRuleCheck.valid) {
            result.valid = false;
            result.businessRuleViolations.push({
                columnIndex,
                violations: businessRuleCheck.violations
            });
        }
    }
    
    // Check for duplicate configurations
    const duplicateCheck = checkForDuplicates(balanceColumns);
    if (duplicateCheck.conflicts.length > 0) {
        result.valid = false;
        result.conflicts = duplicateCheck.conflicts;
    }
    
    // Update UI based on validation results
    updateValidationUI(result);
    
    return result;
}

/**
 * Check business rules for period/balance type combinations
 * @param {Object} config - Column configuration
 * @returns {Object} Business rule validation result
 */
function checkBusinessRules(config) {
    const result = {
        valid: true,
        violations: []
    };
    
    if (!config || !config.period || !config.balanceType) {
        return result; // Skip validation if incomplete
    }
    
    // Rule 1: Current period = unadjusted only
    if (config.period.toLowerCase().includes('current')) {
        if (!config.balanceType.toLowerCase().includes('unadjusted')) {
            result.valid = false;
            result.violations.push('Current period selections must use unadjusted balance types only');
        }
    }
    
    // Rule 2: Prior periods = other balance types only (not unadjusted)
    if (config.period.toLowerCase().includes('prior')) {
        if (config.balanceType.toLowerCase().includes('unadjusted')) {
            result.valid = false;
            result.violations.push('Prior period selections cannot use unadjusted balance types');
        }
    }
    
    return result;
}

/**
 * Check for duplicate engagement/balance type/period/debit credit combinations
 * @param {Array} balanceColumns - Array of column indices to check
 * @returns {Object} Duplicate validation result
 */
function checkForDuplicates(balanceColumns) {
    const result = {
        conflicts: []
    };
    
    // Ensure balanceColumns is an array
    if (!Array.isArray(balanceColumns)) {
        console.error('checkForDuplicates: balanceColumns is not an array:', balanceColumns);
        return result;
    }
    
    const configurationMap = new Map();
    
    for (const columnIndex of balanceColumns) {
        const config = window.columnConfigurations[columnIndex];
        
        // Skip if no configuration exists
        if (!config) {
            console.warn(`No configuration found for column ${columnIndex}`);
            continue;
        }
        
        // Skip incomplete configurations
        if (!config.engagement || !config.balanceType || !config.period || !config.drCr) {
            continue;
        }
        
        // Create unique key for this configuration
        const configKey = `${config.engagement}|${config.balanceType}|${config.period}|${config.drCr}`;
        
        // Special case: Multiple 'Unadjusted Current Period Dr/Cr' allowed if engagements differ
        const isUnadjustedCurrentPeriod = 
            config.balanceType.toLowerCase().includes('unadjusted') && 
            config.period.toLowerCase().includes('current');
            
        if (isUnadjustedCurrentPeriod) {
            // For unadjusted current period, only check engagement+drCr (allow same if different engagements)
            const specialKey = `${config.engagement}|${config.drCr}`;
            
            if (configurationMap.has(specialKey)) {
                const existingColumns = configurationMap.get(specialKey);
                result.conflicts.push({
                    type: 'duplicate',
                    message: 'Multiple Unadjusted Current Period Dr/Cr selections must use different engagements',
                    columns: [...existingColumns, columnIndex],
                    configuration: config
                });
            } else {
                configurationMap.set(specialKey, [columnIndex]);
            }
        } else {
            // Standard duplicate checking for all other configurations
            if (configurationMap.has(configKey)) {
                const existingColumns = configurationMap.get(configKey);
                result.conflicts.push({
                    type: 'duplicate',
                    message: 'Duplicate engagement/balance type/period/debit credit combination not allowed',
                    columns: [...existingColumns, columnIndex],
                    configuration: config
                });
            } else {
                configurationMap.set(configKey, [columnIndex]);
            }
        }
    }
    
    return result;
}

/**
 * Update UI based on validation results
 * @param {Object} validationResult - Result from validateConfiguration()
 */
function updateValidationUI(validationResult) {
    // Clear existing conflict indicators
    clearConflictIndicators();
    
    // Add conflict indicators for conflicting columns
    for (const conflict of validationResult.conflicts) {
        for (const columnIndex of conflict.columns) {
            addConflictIndicator(columnIndex, conflict.message);
        }
    }
    
    // Add business rule violation indicators
    for (const violation of validationResult.businessRuleViolations) {
        addBusinessRuleViolationIndicator(violation.columnIndex, violation.violations);
    }
    
    // Update dropdown states to disable conflicting options
    if (typeof updateDropdownStates === 'function') {
        updateDropdownStates();
    }
    
    // Show validation messages if messaging system is available
    if (typeof showValidationMessages === 'function') {
        showValidationMessages(validationResult);
    }
}

/**
 * Clear all conflict indicators
 */
function clearConflictIndicators() {
    const conflictColumns = document.querySelectorAll('.column-conflict');
    conflictColumns.forEach(element => {
        element.classList.remove('column-conflict');
    });
    
    const conflictIndicators = document.querySelectorAll('.conflict-indicator');
    conflictIndicators.forEach(indicator => {
        indicator.remove();
    });
}

/**
 * Add visual conflict indicator to a column
 * @param {number} columnIndex - Column to mark as conflicted
 * @param {string} message - Conflict message
 */
function addConflictIndicator(columnIndex, message) {
    // Find the column element (implementation depends on existing HTML structure)
    const columnElement = document.querySelector(`#column${columnIndex}`) || 
                          document.querySelector(`[data-column="${columnIndex}"]`) ||
                          document.querySelector(`.column:nth-child(${columnIndex + 1})`);
    
    if (columnElement) {
        columnElement.classList.add('column-conflict');
        columnElement.setAttribute('data-conflict-message', message);
        
        // Add visual indicator
        let indicator = columnElement.querySelector('.conflict-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'conflict-indicator';
            indicator.innerHTML = '⚠️';
            indicator.title = message;
            columnElement.appendChild(indicator);
        }
    }
}

/**
 * Add business rule violation indicator to a column
 * @param {number} columnIndex - Column with violation
 * @param {Array} violations - Array of violation messages
 */
function addBusinessRuleViolationIndicator(columnIndex, violations) {
    const columnElement = document.querySelector(`#column${columnIndex}`) || 
                          document.querySelector(`[data-column="${columnIndex}"]`) ||
                          document.querySelector(`.column:nth-child(${columnIndex + 1})`);
    
    if (columnElement) {
        columnElement.classList.add('business-rule-violation');
        
        // Add violation indicator
        let indicator = columnElement.querySelector('.violation-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'violation-indicator';
            indicator.innerHTML = '❌';
            indicator.title = violations.join(', ');
            columnElement.appendChild(indicator);
        }
    }
}

// Initialize validation system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Duplicate Prevention Core Logic initialized');
    });
} else {
    console.log('Duplicate Prevention Core Logic initialized');
}