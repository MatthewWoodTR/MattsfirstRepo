/**
 * Dropdown Integration for Duplicate Prevention System
 * Thomson Reuters Engagement Manager - Consolidated Spreadsheet Import
 * 
 * Integrates validation logic with existing dropdown controls
 * Provides real-time conflict detection and prevention
 * 
 * Created: December 6, 2024
 */

// Integration with existing dropdowns
class DropdownIntegration {
    constructor() {
        this.initialized = false;
        this.originalHandlers = new Map();
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }
    }

    setupIntegration() {
        try {
            this.setupColumnTypeIntegration();
            this.setupPeriodIntegration();
            this.setupDrCrIntegration();
            this.setupEngagementIntegration();
            this.initialized = true;
            console.log('Dropdown integration initialized successfully');
        } catch (error) {
            console.error('Error initializing dropdown integration:', error);
        }
    }

    // Column Type dropdown integration
    setupColumnTypeIntegration() {
        const columnTypeDropdown = document.getElementById('columnType');
        if (!columnTypeDropdown) {
            console.warn('Column type dropdown not found');
            return;
        }

        // Store original handler if it exists
        if (window.handleColumnTypeChange) {
            this.originalHandlers.set('columnType', window.handleColumnTypeChange);
        }

        // Enhanced column type change handler
        const enhancedHandler = (event) => {
            const dropdown = event?.target || columnTypeDropdown;
            const selectedValue = dropdown.value;
            const columnIndex = this.getCurrentColumnIndex();

            // Call original handler first
            const originalHandler = this.originalHandlers.get('columnType');
            if (originalHandler) {
                originalHandler(event);
            }

            // Update configuration tracking
            if (window.DuplicatePreventionCore) {
                window.DuplicatePreventionCore.updateColumnConfiguration(columnIndex, 'columnType', selectedValue);
                
                // Trigger validation
                this.validateCurrentColumn(columnIndex);
                
                // Update dropdown states
                this.updateDropdownStates();
            }
        };

        // Replace the global handler
        window.handleColumnTypeChange = enhancedHandler;
        columnTypeDropdown.addEventListener('change', enhancedHandler);
    }

    // Period dropdown integration
    setupPeriodIntegration() {
        const periodDropdown = document.getElementById('period');
        if (!periodDropdown) {
            console.warn('Period dropdown not found');
            return;
        }

        periodDropdown.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            const columnIndex = this.getCurrentColumnIndex();

            if (window.DuplicatePreventionCore) {
                window.DuplicatePreventionCore.updateColumnConfiguration(columnIndex, 'period', selectedValue);
                
                // Validate business rules (current period = unadjusted only)
                this.validateBusinessRules(columnIndex);
                
                // Trigger validation
                this.validateCurrentColumn(columnIndex);
                
                // Update dropdown states
                this.updateDropdownStates();
            }
        });
    }

    // DR/CR dropdown integration
    setupDrCrIntegration() {
        const drcrDropdown = document.getElementById('drcr');
        if (!drcrDropdown) {
            console.warn('DR/CR dropdown not found');
            return;
        }

        drcrDropdown.addEventListener('change', (event) => {
            const selectedValue = event.target.value;
            const columnIndex = this.getCurrentColumnIndex();

            if (window.DuplicatePreventionCore) {
                window.DuplicatePreventionCore.updateColumnConfiguration(columnIndex, 'drCr', selectedValue);
                
                // Trigger validation
                this.validateCurrentColumn(columnIndex);
                
                // Update dropdown states
                this.updateDropdownStates();
            }
        });
    }

    // Engagement dropdown integration (custom dropdown)
    setupEngagementIntegration() {
        // Monitor for engagement selection changes
        // This integrates with the existing custom dropdown implementation
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    this.checkEngagementSelection();
                }
            });
        });

        // Observe the engagement display area
        const engagementDisplay = document.querySelector('.engagement-display, #engagement-display, [data-engagement]');
        if (engagementDisplay) {
            observer.observe(engagementDisplay, { 
                childList: true, 
                subtree: true, 
                attributes: true,
                attributeFilter: ['data-engagement', 'data-selected-engagement']
            });
        }

        // Also add click handlers to engagement options
        this.setupEngagementClickHandlers();
    }

    setupEngagementClickHandlers() {
        // Add event delegation for engagement selection
        document.addEventListener('click', (event) => {
            if (event.target.matches('.engagement-option, [data-engagement-option]')) {
                setTimeout(() => this.checkEngagementSelection(), 100);
            }
        });
    }

    checkEngagementSelection() {
        const columnIndex = this.getCurrentColumnIndex();
        const engagement = this.getCurrentEngagement();
        
        if (engagement && window.DuplicatePreventionCore) {
            window.DuplicatePreventionCore.updateColumnConfiguration(columnIndex, 'engagement', engagement);
            
            // Trigger validation
            this.validateCurrentColumn(columnIndex);
            
            // Update dropdown states
            this.updateDropdownStates();
        }
    }

    // Utility functions
    getCurrentColumnIndex() {
        // Determine current column being configured
        // This could be based on active tab, selected column, or current focus
        const activeColumn = document.querySelector('.column-config.active, .selected-column');
        if (activeColumn) {
            return parseInt(activeColumn.dataset.columnIndex) || 0;
        }
        
        // Fallback to first column or a global current column indicator
        return window.currentColumnIndex || 0;
    }

    getCurrentEngagement() {
        // Extract current engagement selection
        const engagementDisplay = document.querySelector('.selected-engagement, [data-selected-engagement]');
        if (engagementDisplay) {
            return engagementDisplay.textContent?.trim() || engagementDisplay.dataset.selectedEngagement;
        }
        
        // Alternative selectors
        const engagementInput = document.querySelector('#engagement, [name="engagement"]');
        if (engagementInput) {
            return engagementInput.value;
        }
        
        return null;
    }

    // Validation functions
    validateCurrentColumn(columnIndex) {
        if (!window.DuplicatePreventionCore) return;

        const conflicts = window.DuplicatePreventionCore.validateColumnConfiguration(columnIndex);
        
        if (conflicts.length > 0) {
            this.showConflicts(columnIndex, conflicts);
        } else {
            this.clearConflicts(columnIndex);
        }
    }

    validateBusinessRules(columnIndex) {
        if (!window.DuplicatePreventionCore) return;

        const violations = window.DuplicatePreventionCore.validateBusinessRules(columnIndex);
        
        if (violations.length > 0) {
            this.showBusinessRuleViolations(columnIndex, violations);
        }
    }

    // Dynamic dropdown state management
    updateDropdownStates() {
        if (!window.DuplicatePreventionCore) return;

        const currentColumnIndex = this.getCurrentColumnIndex();
        const currentConfig = window.DuplicatePreventionCore.getColumnConfiguration(currentColumnIndex);
        
        this.updateColumnTypeOptions(currentConfig);
        this.updatePeriodOptions(currentConfig);
        this.updateDrCrOptions(currentConfig);
        this.updateEngagementOptions(currentConfig);
    }

    updateColumnTypeOptions(currentConfig) {
        const dropdown = document.getElementById('columnType');
        if (!dropdown) return;

        Array.from(dropdown.options).forEach(option => {
            if (option.value && window.DuplicatePreventionCore) {
                const wouldConflict = window.DuplicatePreventionCore.wouldCreateConflict({
                    ...currentConfig,
                    columnType: option.value
                });
                
                option.disabled = wouldConflict;
                option.classList.toggle('disabled-option', wouldConflict);
            }
        });
    }

    updatePeriodOptions(currentConfig) {
        const dropdown = document.getElementById('period');
        if (!dropdown) return;

        Array.from(dropdown.options).forEach(option => {
            if (option.value && window.DuplicatePreventionCore) {
                // Business rule: current period only allows unadjusted
                const isCurrentPeriod = option.value.toLowerCase().includes('current');
                const currentBalanceType = currentConfig.columnType || '';
                const isUnadjusted = currentBalanceType.toLowerCase().includes('unadjusted');
                
                let disabled = false;
                
                if (isCurrentPeriod && currentBalanceType && !isUnadjusted) {
                    disabled = true; // Current period requires unadjusted balance type
                } else if (!isCurrentPeriod && isUnadjusted) {
                    disabled = true; // Unadjusted requires current period
                } else {
                    // Check for duplicate conflicts
                    disabled = window.DuplicatePreventionCore.wouldCreateConflict({
                        ...currentConfig,
                        period: option.value
                    });
                }
                
                option.disabled = disabled;
                option.classList.toggle('disabled-option', disabled);
            }
        });
    }

    updateDrCrOptions(currentConfig) {
        const dropdown = document.getElementById('drcr');
        if (!dropdown) return;

        Array.from(dropdown.options).forEach(option => {
            if (option.value && window.DuplicatePreventionCore) {
                const wouldConflict = window.DuplicatePreventionCore.wouldCreateConflict({
                    ...currentConfig,
                    drCr: option.value
                });
                
                option.disabled = wouldConflict;
                option.classList.toggle('disabled-option', wouldConflict);
            }
        });
    }

    updateEngagementOptions(currentConfig) {
        // Update engagement options based on conflicts
        const engagementOptions = document.querySelectorAll('.engagement-option, [data-engagement-option]');
        
        engagementOptions.forEach(option => {
            const engagement = option.textContent?.trim() || option.dataset.engagementOption;
            if (engagement && window.DuplicatePreventionCore) {
                const wouldConflict = window.DuplicatePreventionCore.wouldCreateConflict({
                    ...currentConfig,
                    engagement: engagement
                });
                
                option.classList.toggle('disabled-option', wouldConflict);
                if (wouldConflict) {
                    option.style.pointerEvents = 'none';
                    option.style.opacity = '0.5';
                } else {
                    option.style.pointerEvents = '';
                    option.style.opacity = '';
                }
            }
        });
    }

    // Visual feedback functions
    showConflicts(columnIndex, conflicts) {
        console.warn(`Column ${columnIndex} conflicts:`, conflicts);
        
        // Add conflict styling to column
        const columnElement = document.querySelector(`[data-column-index="${columnIndex}"]`);
        if (columnElement) {
            columnElement.classList.add('has-conflicts');
        }
        
        // Show conflict messages
        if (window.ValidationMessages) {
            window.ValidationMessages.showConflictError(columnIndex, conflicts);
        }
    }

    clearConflicts(columnIndex) {
        // Remove conflict styling
        const columnElement = document.querySelector(`[data-column-index="${columnIndex}"]`);
        if (columnElement) {
            columnElement.classList.remove('has-conflicts');
        }
        
        // Clear messages
        if (window.ValidationMessages) {
            window.ValidationMessages.clearMessages(columnIndex);
        }
    }

    showBusinessRuleViolations(columnIndex, violations) {
        console.warn(`Column ${columnIndex} business rule violations:`, violations);
        
        if (window.ValidationMessages) {
            window.ValidationMessages.showBusinessRuleError(columnIndex, violations);
        }
    }
}

// Initialize dropdown integration
window.DropdownIntegration = new DropdownIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropdownIntegration;
}