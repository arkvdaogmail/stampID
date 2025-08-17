document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const notarizeBtn = document.getElementById('notarizeBtn');
    const documentHash = document.getElementById('documentHash');
    const txId = document.getElementById('txId');
    const statusText = document.getElementById('statusText');
    const fileInfo = document.getElementById('fileInfo');
    
    let currentFile = null;
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            currentFile = e.target.files[0];
            fileInfo.innerHTML = `
                <div class="file-preview">
                    <strong>${currentFile.name}</strong> (${formatFileSize(currentFile.size)})
                </div>
            `;
            statusText.textContent = 'Ready to notarize';
        }
    });
    
    notarizeBtn.addEventListener('click', async () => {
        if (!currentFile) {
            alert('Please upload a document first');
            return;
        }
        
        statusText.textContent = 'Processing...';
        notarizeBtn.disabled = true;
        
        try {
            const formData = new FormData();
            formData.append('document', currentFile);
            
            const response = await fetch('/notarize', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Server error');
            }
            
            const result = await response.json();
            
            if (result.success) {
                documentHash.textContent = result.documentHash;
                txId.textContent = result.vechainTx;
                statusText.textContent = '✅ Successfully notarized!';
                
                fileInfo.innerHTML += `
                    <div class="success-message">
                        <a href="${result.explorerUrl}" target="_blank">
                            View on Blockchain Explorer
                        </a>
                    </div>
                `;
            } else {
                throw new Error(result.error || 'Notarization failed');
            }
        } catch (error) {
            statusText.textContent = `❌ Error: ${error.message}`;
            console.error('Error:', error);
        } finally {
            notarizeBtn.disabled = false;
        }
    });
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
});
