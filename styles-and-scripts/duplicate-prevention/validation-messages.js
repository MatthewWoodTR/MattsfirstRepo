// Validation Messages System
// Created: December 5, 2025
// Purpose: User-friendly error messaging and notifications
// Thomson Reuters Engagement Manager - Duplicate Prevention System

/**
 * Validation Messages System
 * Provides toast notifications, inline messages, and conflict summaries
 */

(function() {
    'use strict';

    // Message queue and configuration
    const messageQueue = [];
    let toastContainer = null;
    let conflictSummaryPanel = null;

    /**
     * Initialize the messaging system
     */
    function initializeMessagingSystem() {
        createToastContainer();
        createConflictSummaryPanel();
        console.log('Validation messaging system initialized');
    }

    /**
     * Create the toast notification container
     */
    function createToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'validation-toast-container';
            toastContainer.setAttribute('aria-live', 'polite');
            toastContainer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(toastContainer);
        }
    }

    /**
     * Create the conflict summary panel
     */
    function createConflictSummaryPanel() {
        if (!conflictSummaryPanel) {
            conflictSummaryPanel = document.createElement('div');
            conflictSummaryPanel.className = 'conflict-summary-panel';
            conflictSummaryPanel.innerHTML = `
                <div class="conflict-summary-header">
                    <span>⚠️ Configuration Conflicts</span>
                    <button type="button" class="close-btn" onclick="hideConflictSummary()">&times;</button>
                </div>
                <div class="conflict-summary-body">
                    <!-- Conflicts will be populated here -->
                </div>
            `;
            document.body.appendChild(conflictSummaryPanel);
        }
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'error', 'warning', 'success', 'info'
     * @param {number} duration - Auto-hide duration in milliseconds (0 = no auto-hide)
     */
    window.showToast = function(message, type = 'info', duration = 5000) {
        createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `validation-toast ${type}`;
        
        const toastId = 'toast-' + Date.now();
        toast.id = toastId;
        
        const iconMap = {
            error: '❌',
            warning: '⚠️',
            success: '✅',
            info: 'ℹ️'
        };
        
        const titleMap = {
            error: 'Error',
            warning: 'Warning',
            success: 'Success',
            info: 'Information'
        };
        
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-icon">${iconMap[type]}</span>
                <span>${titleMap[type]}</span>
                <button type="button" class="toast-close" onclick="hideToast('${toastId}')">&times;</button>
            </div>
            <div class="toast-body">${message}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-hide if duration specified
        if (duration > 0) {
            setTimeout(() => {
                hideToast(toastId);
            }, duration);
        }
        
        return toastId;
    };

    /**
     * Hide a specific toast
     * @param {string} toastId - ID of toast to hide
     */
    window.hideToast = function(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            toast.classList.add('hide');
            toast.classList.remove('show');
            
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    };

    /**
     * Hide all toasts
     */
    window.hideAllToasts = function() {
        const toasts = document.querySelectorAll('.validation-toast');
        toasts.forEach(toast => {
            if (toast.id) {
                hideToast(toast.id);
            }
        });
    };

    /**
     * Show validation messages based on validation results
     * @param {Object} validationResult - Result from validateConfiguration()
     */
    window.showValidationMessages = function(validationResult) {
        if (!validationResult) return;
        
        // Clear previous messages
        hideAllToasts();
        
        // Show business rule violations
        if (validationResult.businessRuleViolations && validationResult.businessRuleViolations.length > 0) {
            for (const violation of validationResult.businessRuleViolations) {
                const message = `Column ${violation.columnIndex + 1}: ${violation.violations.join(', ')}`;
                showToast(message, 'error', 8000);
            }
        }
        
        // Show conflicts
        if (validationResult.conflicts && validationResult.conflicts.length > 0) {
            for (const conflict of validationResult.conflicts) {
                const columnNumbers = conflict.columns.map(c => c + 1).join(', ');
                const message = `Columns ${columnNumbers}: ${conflict.message}`;
                showToast(message, 'warning', 10000);
            }
            
            // Show conflict summary panel
            updateConflictSummary(validationResult.conflicts);
        } else {
            // Hide conflict summary if no conflicts
            hideConflictSummary();
        }
        
        // Show success message if everything is valid
        if (validationResult.valid) {
            const configCount = getConfiguredColumnCount();
            if (configCount > 0) {
                showToast(`All ${configCount} column configurations are valid`, 'success', 3000);
            }
        }
    };

    /**
     * Get count of configured columns
     */
    function getConfiguredColumnCount() {
        if (!window.columnConfigurations) return 0;
        
        let count = 0;
        for (const columnIndex in window.columnConfigurations) {
            const config = window.columnConfigurations[columnIndex];
            if (config.engagement && config.balanceType && config.period && config.drCr) {
                count++;
            }
        }
        return count;
    }

    /**
     * Update the conflict summary panel
     * @param {Array} conflicts - Array of conflict objects
     */
    function updateConflictSummary(conflicts) {
        if (!conflictSummaryPanel || !conflicts || conflicts.length === 0) {
            hideConflictSummary();
            return;
        }
        
        const summaryBody = conflictSummaryPanel.querySelector('.conflict-summary-body');
        if (!summaryBody) return;
        
        let html = '';
        
        for (let i = 0; i < conflicts.length; i++) {
            const conflict = conflicts[i];
            const columnNumbers = conflict.columns.map(c => c + 1).join(', ');
            
            html += `
                <div class="conflict-item">
                    <div class="conflict-item-title">
                        Conflict ${i + 1}: Columns ${columnNumbers}
                    </div>
                    <div class="conflict-item-details">
                        ${conflict.message}<br>
                        <strong>Configuration:</strong> ${formatConfiguration(conflict.configuration)}
                    </div>
                </div>
            `;
        }
        
        summaryBody.innerHTML = html;
        showConflictSummary();
    }

    /**
     * Format configuration for display
     * @param {Object} config - Configuration object
     */
    function formatConfiguration(config) {
        return `${config.engagement} - ${config.balanceType} - ${config.period} - ${config.drCr}`;
    }

    /**
     * Show the conflict summary panel
     */
    function showConflictSummary() {
        if (conflictSummaryPanel) {
            conflictSummaryPanel.classList.add('show');
        }
    }

    /**
     * Hide the conflict summary panel
     */
    window.hideConflictSummary = function() {
        if (conflictSummaryPanel) {
            conflictSummaryPanel.classList.remove('show');
        }
    };

    /**
     * Show inline validation message near a form field
     * @param {Element} fieldElement - Form field to show message near
     * @param {string} message - Message to display
     * @param {string} type - Message type: 'error', 'warning', 'info'
     */
    window.showInlineMessage = function(fieldElement, message, type = 'error') {
        if (!fieldElement) return;
        
        // Remove existing message
        clearInlineMessage(fieldElement);
        
        // Create message element
        const messageElement = document.createElement('span');
        messageElement.className = `inline-validation-message ${type}`;
        messageElement.textContent = message;
        messageElement.setAttribute('data-field-message', 'true');
        
        // Insert after the field element
        fieldElement.parentNode.insertBefore(messageElement, fieldElement.nextSibling);
        
        // Auto-remove after delay
        setTimeout(() => {
            clearInlineMessage(fieldElement);
        }, 8000);
    };

    /**
     * Clear inline validation message for a field
     * @param {Element} fieldElement - Form field to clear message for
     */
    window.clearInlineMessage = function(fieldElement) {
        if (!fieldElement) return;
        
        const existingMessage = fieldElement.parentNode.querySelector('[data-field-message="true"]');
        if (existingMessage) {
            existingMessage.remove();
        }
    };

    /**
     * Clear all inline messages
     */
    window.clearAllInlineMessages = function() {
        const messages = document.querySelectorAll('[data-field-message="true"]');
        messages.forEach(message => message.remove());
    };

    /**
     * Show configuration summary for a column
     * @param {number} columnIndex - Column index
     */
    window.showConfigurationSummary = function(columnIndex) {
        if (!window.columnConfigurations || !window.columnConfigurations[columnIndex]) {
            showToast(`Column ${columnIndex + 1} is not configured`, 'info', 3000);
            return;
        }
        
        const config = window.columnConfigurations[columnIndex];
        const summary = formatConfiguration(config);
        showToast(`Column ${columnIndex + 1}: ${summary}`, 'info', 5000);
    };

    /**
     * Show all configuration summaries
     */
    window.showAllConfigurationSummaries = function() {
        if (!window.columnConfigurations) {
            showToast('No columns configured yet', 'info', 3000);
            return;
        }
        
        const configuredColumns = [];
        for (const columnIndex in window.columnConfigurations) {
            const config = window.columnConfigurations[columnIndex];
            if (config.engagement && config.balanceType && config.period && config.drCr) {
                const summary = formatConfiguration(config);
                configuredColumns.push(`Column ${parseInt(columnIndex) + 1}: ${summary}`);
            }
        }
        
        if (configuredColumns.length === 0) {
            showToast('No columns fully configured yet', 'info', 3000);
        } else {
            const message = configuredColumns.join('<br>');
            showToast(message, 'info', 0); // No auto-hide for summary
        }
    };

    /**
     * Show specific error messages for different validation scenarios
     */
    const ValidationMessages = {
        /**
         * Show duplicate configuration error
         */
        showDuplicateConfigurationError: function(columns, configuration) {
            const columnNumbers = columns.map(c => c + 1).join(' and ');
            const configText = formatConfiguration(configuration);
            const message = `Columns ${columnNumbers} cannot have the same configuration: ${configText}`;
            showToast(message, 'error', 10000);
        },

        /**
         * Show business rule violation
         */
        showBusinessRuleViolation: function(columnIndex, rule) {
            const message = `Column ${columnIndex + 1}: ${rule}`;
            showToast(message, 'error', 8000);
        },

        /**
         * Show current period unadjusted only rule
         */
        showCurrentPeriodRule: function(columnIndex) {
            const message = `Column ${columnIndex + 1}: Current period selections must use unadjusted balance types only`;
            showToast(message, 'error', 8000);
        },

        /**
         * Show prior period no unadjusted rule
         */
        showPriorPeriodRule: function(columnIndex) {
            const message = `Column ${columnIndex + 1}: Prior period selections cannot use unadjusted balance types`;
            showToast(message, 'error', 8000);
        },

        /**
         * Show special case explanation for unadjusted current period
         */
        showUnadjustedCurrentPeriodRule: function() {
            const message = `Multiple 'Unadjusted Current Period Dr/Cr' selections are allowed only when engagement values differ`;
            showToast(message, 'info', 8000);
        },

        /**
         * Show successful validation
         */
        showValidationSuccess: function(columnCount) {
            const message = columnCount === 1 
                ? 'Column configuration is valid'
                : `All ${columnCount} column configurations are valid`;
            showToast(message, 'success', 3000);
        },

        /**
         * Show configuration saved message
         */
        showConfigurationSaved: function(columnIndex) {
            const message = `Column ${columnIndex + 1} configuration saved successfully`;
            showToast(message, 'success', 2000);
        },

        /**
         * Show configuration cleared message
         */
        showConfigurationCleared: function(columnIndex) {
            const message = `Column ${columnIndex + 1} configuration cleared`;
            showToast(message, 'info', 2000);
        }
    };

    // Expose validation messages globally
    window.ValidationMessages = ValidationMessages;

    /**
     * Enhanced message functions for specific field types
     */
    window.showEngagementConflict = function(columnIndex, conflictingColumns) {
        const conflictNumbers = conflictingColumns.map(c => c + 1).join(', ');
        const message = `Column ${columnIndex + 1}: This engagement selection conflicts with columns ${conflictNumbers}`;
        showToast(message, 'warning', 7000);
    };

    window.showBalanceTypeConflict = function(columnIndex, conflictingColumns) {
        const conflictNumbers = conflictingColumns.map(c => c + 1).join(', ');
        const message = `Column ${columnIndex + 1}: This balance type selection conflicts with columns ${conflictNumbers}`;
        showToast(message, 'warning', 7000);
    };

    window.showPeriodConflict = function(columnIndex, conflictingColumns) {
        const conflictNumbers = conflictingColumns.map(c => c + 1).join(', ');
        const message = `Column ${columnIndex + 1}: This period selection conflicts with columns ${conflictNumbers}`;
        showToast(message, 'warning', 7000);
    };

    window.showDrCrConflict = function(columnIndex, conflictingColumns) {
        const conflictNumbers = conflictingColumns.map(c => c + 1).join(', ');
        const message = `Column ${columnIndex + 1}: This Dr/Cr selection conflicts with columns ${conflictNumbers}`;
        showToast(message, 'warning', 7000);
    };

    /**
     * Keyboard accessibility
     */
    document.addEventListener('keydown', function(event) {
        // Escape key hides conflict summary and all toasts
        if (event.key === 'Escape') {
            hideConflictSummary();
            hideAllToasts();
        }
    });

    /**
     * Initialize when DOM is ready
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMessagingSystem);
    } else {
        initializeMessagingSystem();
    }

})();