/**
 * Validation Messages System for Thomson Reuters Engagement Manager
 * Handles user-friendly error messages, notifications, and validation feedback
 * Created: December 5, 2024
 * 
 * Features:
 * - Toast notifications for real-time feedback
 * - Inline error messages for specific fields
 * - Message queue management
 * - Multiple message types (error, warning, success, info)
 * - Professional TR-styled messaging
 * - Auto-dismiss and manual dismiss options
 */

class ValidationMessageSystem {
    constructor() {
        this.messages = [];
        this.messageContainer = null;
        this.init();
    }

    /**
     * Initialize the message system
     */
    init() {
        this.createMessageContainer();
        this.setupStyles();
    }

    /**
     * Create the main message container
     */
    createMessageContainer() {
        if (!document.getElementById('validation-message-container')) {
            const container = document.createElement('div');
            container.id = 'validation-message-container';
            container.className = 'message-container';
            document.body.appendChild(container);
            this.messageContainer = container;
        } else {
            this.messageContainer = document.getElementById('validation-message-container');
        }
    }

    /**
     * Setup dynamic styles if not already present
     */
    setupStyles() {
        if (!document.getElementById('validation-message-styles')) {
            const style = document.createElement('style');
            style.id = 'validation-message-styles';
            style.textContent = `
                .message-container {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                }
                
                .message-toast {
                    margin-bottom: 10px;
                    padding: 12px 16px;
                    border-radius: 4px;
                    border-left: 4px solid;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    background: white;
                    animation: slideIn 0.3s ease-out;
                    position: relative;
                }
                
                .message-toast.error {
                    border-left-color: #d73527;
                    background: #fff5f5;
                }
                
                .message-toast.warning {
                    border-left-color: #ff6600;
                    background: #fff8f0;
                }
                
                .message-toast.success {
                    border-left-color: #28a745;
                    background: #f8fff8;
                }
                
                .message-toast.info {
                    border-left-color: #0066cc;
                    background: #f0f8ff;
                }
                
                .message-close {
                    position: absolute;
                    top: 8px;
                    right: 10px;
                    background: none;
                    border: none;
                    font-size: 16px;
                    cursor: pointer;
                    color: #666;
                    padding: 0;
                    line-height: 1;
                }
                
                .message-close:hover {
                    color: #333;
                }
                
                .message-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                    font-size: 14px;
                }
                
                .message-text {
                    font-size: 13px;
                    line-height: 1.4;
                    margin: 0;
                }
                
                .inline-error {
                    color: #d73527;
                    font-size: 12px;
                    margin-top: 4px;
                    display: block;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .fade-out {
                    animation: fadeOut 0.3s ease-out forwards;
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show a toast message
     * @param {string} type - Message type: 'error', 'warning', 'success', 'info'
     * @param {string} title - Message title
     * @param {string} message - Message content
     * @param {number} duration - Auto-dismiss duration in ms (0 = no auto-dismiss)
     */
    showToast(type, title, message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `message-toast ${type}`;
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'message-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = () => this.dismissToast(toast);
        
        const titleEl = document.createElement('div');
        titleEl.className = 'message-title';
        titleEl.textContent = title;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'message-text';
        messageEl.textContent = message;
        
        toast.appendChild(closeBtn);
        toast.appendChild(titleEl);
        toast.appendChild(messageEl);
        
        this.messageContainer.appendChild(toast);
        
        // Auto-dismiss if duration specified
        if (duration > 0) {
            setTimeout(() => this.dismissToast(toast), duration);
        }
        
        return toast;
    }

    /**
     * Dismiss a toast message
     */
    dismissToast(toast) {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Clear all messages
     */
    clearAll() {
        const toasts = this.messageContainer.querySelectorAll('.message-toast');
        toasts.forEach(toast => this.dismissToast(toast));
    }

    /**
     * Show validation error messages
     */
    showValidationError(columnIndex, conflicts) {
        const conflictDescriptions = conflicts.map(conflict => {
            return `Column ${conflict.columnIndex + 1}: ${conflict.engagement} - ${conflict.balanceType} - ${conflict.period} - ${conflict.debitCredit}`;
        }).join('\n');
        
        this.showToast(
            'error',
            'Configuration Conflict Detected',
            `Column ${columnIndex + 1} has the same configuration as existing columns:\n${conflictDescriptions}`,
            0 // Don't auto-dismiss validation errors
        );
    }

    /**
     * Show business rule violation messages
     */
    showBusinessRuleError(rule, columnIndex, selection) {
        let title, message;
        
        switch (rule) {
            case 'current-period-unadjusted-only':
                title = 'Business Rule Violation';
                message = `Column ${columnIndex + 1}: Current period selections must use "Unadjusted" balance type only. Selected: ${selection.balanceType}`;
                break;
            case 'prior-period-no-unadjusted':
                title = 'Business Rule Violation';
                message = `Column ${columnIndex + 1}: Prior period selections cannot use "Unadjusted" balance type. Selected: ${selection.balanceType}`;
                break;
            default:
                title = 'Business Rule Violation';
                message = `Column ${columnIndex + 1}: Invalid configuration detected.`;
        }
        
        this.showToast('error', title, message, 0);
    }

    /**
     * Show success messages
     */
    showSuccess(title, message) {
        this.showToast('success', title, message, 3000);
    }

    /**
     * Show warning messages
     */
    showWarning(title, message) {
        this.showToast('warning', title, message, 4000);
    }

    /**
     * Show info messages
     */
    showInfo(title, message) {
        this.showToast('info', title, message, 3000);
    }

    /**
     * Show inline error message next to a field
     */
    showInlineError(fieldId, message) {
        this.clearInlineError(fieldId);
        
        const field = document.getElementById(fieldId);
        if (field) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'inline-error';
            errorSpan.id = fieldId + '-error';
            errorSpan.textContent = message;
            
            field.parentNode.insertBefore(errorSpan, field.nextSibling);
        }
    }

    /**
     * Clear inline error message
     */
    clearInlineError(fieldId) {
        const existing = document.getElementById(fieldId + '-error');
        if (existing) {
            existing.parentNode.removeChild(existing);
        }
    }

    /**
     * Show dropdown option disabled message
     */
    showOptionDisabledMessage(columnIndex, option, reason) {
        this.showToast(
            'info',
            'Option Disabled',
            `Column ${columnIndex + 1}: "${option}" is disabled. ${reason}`,
            2000
        );
    }

    /**
     * Show configuration summary
     */
    showConfigurationSummary(configurations) {
        const summary = Object.keys(configurations)
            .map(columnIndex => {
                const config = configurations[columnIndex];
                return `Column ${parseInt(columnIndex) + 1}: ${config.engagement || 'None'} - ${config.balanceType || 'None'} - ${config.period || 'None'} - ${config.debitCredit || 'None'}`;
            })
            .join('\n');
        
        this.showToast(
            'info',
            'Current Column Configurations',
            summary,
            0
        );
    }
}

// Global instance
window.validationMessages = new ValidationMessageSystem();

// Convenience functions for common use cases
window.showValidationError = (columnIndex, conflicts) => {
    window.validationMessages.showValidationError(columnIndex, conflicts);
};

window.showBusinessRuleError = (rule, columnIndex, selection) => {
    window.validationMessages.showBusinessRuleError(rule, columnIndex, selection);
};

window.showValidationSuccess = (message) => {
    window.validationMessages.showSuccess('Validation Success', message);
};

window.clearValidationMessages = () => {
    window.validationMessages.clearAll();
};