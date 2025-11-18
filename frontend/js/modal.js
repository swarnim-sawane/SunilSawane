// Custom Confirm Dialog
function customConfirm(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('customConfirmModal');
        const messageEl = document.getElementById('customConfirmMessage');
        const titleEl = modal.querySelector('.custom-modal-title');
        const okBtn = document.getElementById('customConfirmOk');
        const cancelBtn = document.getElementById('customConfirmCancel');
        const overlay = modal.querySelector('.custom-modal-overlay');
        
        // Set message and title
        messageEl.textContent = message;
        titleEl.textContent = title;
        
        // Show modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Handle OK
        const handleOk = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            cleanup();
            resolve(true);
        };
        
        // Handle Cancel
        const handleCancel = () => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
            cleanup();
            resolve(false);
        };
        
        // Cleanup listeners
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            overlay.removeEventListener('click', handleCancel);
        };
        
        // Attach listeners
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);
    });
}
