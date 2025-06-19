document.addEventListener('DOMContentLoaded', function() {
    
    // Tab functionality
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => {
                c.classList.remove('active');
                c.hidden = true; });
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab') + '-tab';
                const tabContent = document.getElementById(tabId);
            document.getElementById(tabId).classList.add('active');
            tabContent.hidden = false;
            
            // If history tab is clicked, refresh the history display
        if (tabId === 'history-tab') {
            initializeHistory();
        }
        });
    });

    // Form submission with API call
    const contentForm = document.getElementById('contentForm');
    const outputContent = document.getElementById('outputContent');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    contentForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        loadingIndicator.style.display = 'block';
        outputContent.innerHTML = '<p class="output-placeholder">Your AI-generated educational content will appear here...</p>';
        
        const contentType = document.getElementById('contentType').value;
        const subjectArea = document.getElementById('subjectArea').value;
        const gradeLevel = document.getElementById('gradeLevel').value;
        const topic = document.getElementById('topic').value;
        const details = document.getElementById('details').value;
        const complexity = document.getElementById('complexity').value;
        const format = document.getElementById('format').value;

        try {
            const response = await fetch('http://127.0.0.1:5000/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer YOUR_API_KEY' 
                },
                body: JSON.stringify({
                    contentType,
                    subjectArea,
                    gradeLevel,
                    topic,
                    details,
                    complexity,
                    format
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `API request failed with status ${response.status}`);
            }

            const data = await response.json();
            
            // Format the content based on the selected format
            let formattedContent = data.content;
            
            if (format === 'bullet_points') {
                formattedContent = formatBulletPoints(data.content);
            } else if (format === 'step_by_step') {
                formattedContent = formatStepByStep(data.content);
            } else if (format === 'table') {
                formattedContent = formatAsTable(data.content);
            } else if (format === 'markdown') {
                formattedContent = formatMarkdown(data.content);
            } else if (format === 'paragraph') {
                formattedContent = formatParagraph(data.content);
            }
            
            outputContent.innerHTML = `
                <div class="content-header">
                    <h2>${topic}</h2>
                    <p class="content-meta">
                        <span class="content-type">${document.getElementById('contentType').options[document.getElementById('contentType').selectedIndex].text}</span> | 
                        <span class="subject">${document.getElementById('subjectArea').options[document.getElementById('subjectArea').selectedIndex].text}</span> | 
                        <span class="grade">${document.getElementById('gradeLevel').options[document.getElementById('gradeLevel').selectedIndex].text}</span>
                    </p>
                </div>
                ${formattedContent}
            `;
            
            try {
                addToHistory(contentType, topic, outputContent.innerHTML);
            } catch (storageError) {
                console.error('Error saving to history:', storageError);
            }

            setTimeout(() => {
                outputContent.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest'
                });
            }, 100);
            
        } catch (error) {
            console.error('Error:', error);
            outputContent.innerHTML = `
                <div class="error-content">
                    <h3>Error Generating Content</h3>
                    <p>${error.message}</p>
                    <p>Please try again or check server logs.</p>
                </div>
            `;
        } finally {
            loadingIndicator.style.display = 'none';
        }
    });
    
    // Copy to clipboard
    const copyBtn = document.getElementById('copyBtn');
    copyBtn.addEventListener('click', () => {
        const content = outputContent.innerText;
        navigator.clipboard.writeText(content).then(() => {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy to Clipboard';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text. Your browser might block clipboard access from insecure contexts. Please copy manually.');
        });
    });
    
    // Download as PDF
  // Update the downloadBtn event listener in index.js
downloadBtn.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const outputElement = document.getElementById('outputContent');
    
    const contentText = outputElement.innerText.trim();
    if (!contentText || contentText.includes('Your AI-generated educational content will appear here...') || contentText.includes('Error generating content.')) {
        alert('Please generate valid content first before downloading.');
        return;
    }
    
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;
    
    const topic = document.getElementById('topic').value || 'TeachIQ Content';
    const typeName = document.getElementById('contentType').options[document.getElementById('contentType').selectedIndex].text;
    const subjectName = document.getElementById('subjectArea').options[document.getElementById('subjectArea').selectedIndex].text;
    const gradeName = document.getElementById('gradeLevel').options[document.getElementById('gradeLevel').selectedIndex].text;
    
    // Create a clone of the element to avoid affecting the original
    const element = outputElement.cloneNode(true);
    element.style.width = outputElement.offsetWidth + 'px';
    document.body.appendChild(element);
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    
    const options = {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        width: element.offsetWidth,
        height: element.scrollHeight
    };
    
    html2canvas(element, options).then(canvas => {
        document.body.removeChild(element);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const pageHeight = pdf.internal.pageSize.getHeight() - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 30; // Start position (after header)
        let pageCount = 1;
        
        // Add header to first page
        pdf.setFontSize(12);
        pdf.text(`TeachIQ - ${typeName}`, 10, 10);
        pdf.text(`Topic: ${topic}`, 10, 16);
        pdf.text(`Subject: ${subjectName} | Grade: ${gradeName}`, 10, 22);
        
        // Add first page content
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pageCount++;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Add page numbers to all pages
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
            pdf.text('Generated by TeachIQ', 10, pdf.internal.pageSize.getHeight() - 10);
        }
        
        pdf.save(`${topic.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
        
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download as PDF';
        downloadBtn.disabled = false;
    }).catch(error => {
        document.body.removeChild(element);
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please ensure content is visible and try again.');
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download as PDF';
        downloadBtn.disabled = false;
    });
});
    
    // Save to history
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.addEventListener('click', () => {
        const contentType = document.getElementById('contentType').value;
        const topic = document.getElementById('topic').value;
        const content = outputContent.innerHTML;
        
        const contentText = outputContent.innerText.trim();
        if (contentText && !contentText.includes('Your AI-generated educational content will appear here...') && !contentText.includes('Error generating content.')) {
            try {
                addToHistory(contentType, topic, content);
                saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
                setTimeout(() => {
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Save to History';
                }, 2000);
            } catch (error) {
                console.error('Error saving to history:', error);
                alert('Failed to save to history. Please try again.');
            }
        } else {
            alert('No valid content to save. Please generate content first.');
        }
    });
    
    // Initialize history and templates
    initializeHistory();
    initializeTemplates();
    
    // Content formatting functions
    function formatBulletPoints(content) {
        const lines = content.split('\n');
        let html = '';
        let inList = false;
        let listType = '';
        
        for (const line of lines) {
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                if (!inList || listType !== 'ul') {
                    if (inList) html += '</ol>';
                    html += '<ul>';
                    inList = true;
                    listType = 'ul';
                }
                html += `<li>${line.trim().substring(2)}</li>`;
            } else if (line.trim().match(/^\d+\./)) {
                if (!inList || listType !== 'ol') {
                    if (inList) html += '</ul>';
                    html += '<ol>';
                    inList = true;
                    listType = 'ol';
                }
                html += `<li>${line.trim().replace(/^\d+\.\s*/, '')}</li>`;
            } else {
                if (inList) {
                    html += listType === 'ul' ? '</ul>' : '</ol>';
                    inList = false;
                }
                
                if (line.trim() === '') {
                    html += '<p>&nbsp;</p>';
                } else if (line.trim().startsWith('## ')) {
                    html += `<h3>${line.trim().substring(3)}</h3>`;
                } else if (line.trim().startsWith('### ')) {
                    html += `<h4>${line.trim().substring(4)}</h4>`;
                } else {
                    html += `<p>${line}</p>`;
                }
            }
        }
        
        if (inList) {
            html += listType === 'ul' ? '</ul>' : '</ol>';
        }
        
        return html;
    }

    function formatStepByStep(content) {
        const lines = content.split('\n');
        let html = '<div class="step-container">';
        let inStep = false;
        
        for (const line of lines) {
            if (line.trim().match(/^(Step \d+|Step \d+:|\d+\.)/i)) {
                if (inStep) {
                    html += '</div>';
                }
                html += `
                    <div class="step">
                        <div class="step-content">
                            <h4>${line.trim()}</h4>
                `;
                inStep = true;
            } else if (line.trim() === '') {
                if (inStep) {
                    html += '</div></div>';
                    inStep = false;
                }
            } else {
                if (inStep) {
                    html += `<p>${line}</p>`;
                } else {
                    html += `<p>${line}</p>`;
                }
            }
        }
        
        if (inStep) {
            html += '</div></div>';
        }
        
        html += '</div>';
        return html;
    }

    function formatAsTable(content) {
        const lines = content.split('\n');
        let html = '';
        let inTable = false;
        let headers = [];
        
        for (const line of lines) {
            if (line.includes('|') && line.trim().startsWith('|')) {
                if (!inTable) {
                    html += '<table>';
                    inTable = true;
                    
                    // Process header row
                    headers = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                    if (headers.length > 0) {
                        html += '<thead><tr>';
                        for (const header of headers) {
                            html += `<th>${header}</th>`;
                        }
                        html += '</tr></thead><tbody>';
                    }
                } else {
                    const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell !== '');
                    if (cells.length > 0) {
                        html += '<tr>';
                        for (const cell of cells) {
                            html += `<td>${cell}</td>`;
                        }
                        html += '</tr>';
                    }
                }
            } else {
                if (inTable) {
                    html += '</tbody></table>';
                    inTable = false;
                }
                
                if (line.trim() === '') {
                    html += '<p>&nbsp;</p>';
                } else {
                    html += `<p>${line}</p>`;
                }
            }
        }
        
        if (inTable) {
            html += '</tbody></table>';
        }
        
        return html;
    }

    function formatMarkdown(content) {
        let html = content;
        
        // Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
        
        // Images
        html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
        
        // Code blocks
        html = html.replace(/```([a-z]*)\n([\s\S]*?)\n```/g, '<pre><code class="$1">$2</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Blockquotes
        html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        // Horizontal rule
        html = html.replace(/^---$/gm, '<hr>');
        
        // Lists
        html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^\- (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^\+ (.*$)/gm, '<li>$1</li>');
        html = html.replace(/^\d\. (.*$)/gm, '<li>$1</li>');
        
        // Wrap list items in proper list tags
        html = html.replace(/(<li>.*<\/li>)+/g, function(match) {
            if (match.match(/<li>\d+\./)) {
                return '<ol>' + match + '</ol>';
            } else {
                return '<ul>' + match + '</ul>';
            }
        });
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        return html;
    }
    
    function formatParagraph(content) {
    // Split content into paragraphs and format them properly
    const paragraphs = content.split('\n\n');
    let html = '';
    
    for (const para of paragraphs) {
        if (para.trim() === '') continue;
        
        // Check for special sections (like objectives, activities, etc.)
        if (para.match(/^Objective[s]?:/i)) {
            html += `<div class="objective"><h4>${para.split(':')[0]}:</h4><p>${para.split(':').slice(1).join(':')}</p></div>`;
        } else if (para.match(/^Activity[s]?:/i)) {
            html += `<div class="activity"><h4>${para.split(':')[0]}:</h4><p>${para.split(':').slice(1).join(':')}</p></div>`;
        } else if (para.match(/^Assessment[s]?:/i)) {
            html += `<div class="assessment"><h4>${para.split(':')[0]}:</h4><p>${para.split(':').slice(1).join(':')}</p></div>`;
        } else if (para.match(/^Material[s]?:/i)) {
            html += `<div class="material"><h4>${para.split(':')[0]}:</h4><p>${para.split(':').slice(1).join(':')}</p></div>`;
        } 
        // Format headings if they appear in paragraphs
        else if (para.match(/^[A-Z][A-Za-z ]+:$/)) {
            html += `<h4>${para}</h4>`;
        } 
        // Regular paragraph formatting
        else {
            // Preserve any bold/italic formatting that might be in the text
            let formattedPara = para
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            // Add proper paragraph tags
            html += `<p>${formattedPara}</p>`;
        }
    }
    
    return html;
}
    
    // History functions
function initializeHistory() {
    const history = document.getElementById('historyItems');
    
    try {
        // Clear any previous error messages
        historyItems.innerHTML = '';
        
        // Get history from localStorage with proper error handling
        let history = [];
        const historyData = localStorage.getItem('TeachIQHistory');
        
        
        
        if (historyData) {
           try {
                history = JSON.parse(historyData);
                // Validate the history data structure
                if (!Array.isArray(history)) {
                    throw new Error('History data is not an array');
                }
        } catch (parseError) {
                console.error('Error parsing history data:', parseError);
                // If data is corrupted, reset it
                localStorage.removeItem('TeachIQHistory');
                history = [];
            }
        }
        
        if (history.length === 0) {
            historyItems.innerHTML = '<p class="output-placeholder">No history items yet. Generate some content to see it here.</p>';
            return;
        }
        
        historyItems.innerHTML = '';
        history.forEach((item, index) => {
            // Validate each history item
            if (!item || typeof item !== 'object' || !item.topic || !item.type || !item.timestamp) {
                console.warn('Invalid history item at index', index, item);
                return; // Skip invalid items
            }
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-content">
                    <h4>${item.topic}</h4>
                    <p><strong>${item.type}</strong> - ${new Date(item.timestamp).toLocaleString()}</p>
                </div>
                <div class="history-item-actions">
                    <button class="btn btn-download">
                        <i class="fas fa-download"></i> Download
                    </button>
                <button class="btn btn-delete" data-index="${index}">
                    <i class="fas fa-trash"></i> Delete
                </button>
                </div>
            `;
            
            // Click to load content
            historyItem.querySelector('.history-item-content').addEventListener('click', () => {
                displayHistoryItem(item);
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                document.querySelector('.tab[data-tab="generator"]').classList.add('active');
                document.getElementById('generator-tab').classList.add('active');
            });
            
              // Download button handler
            historyItem.querySelector('.btn-download').addEventListener('click', (e) => {
                e.stopPropagation();
                downloadHistoryItem(item);
            });
            
            // Delete button handler
            historyItem.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the content load
                deleteHistoryItem(index);
            });
            
            historyItems.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error initializing history:', error);
                historyItems.innerHTML = `
            <div class="error-content">
                <p>Error loading history. Please try refreshing the page.</p>
                <button class="btn" onclick="localStorage.removeItem('TeachIQHistory'); window.location.reload();">
                    <i class="fas fa-sync-alt"></i> Reset History
                </button>
            </div>
        `;
    }
}
    
    function downloadHistoryItem(item) {
    const { jsPDF } = window.jspdf;
    const element = document.createElement('div');
    element.innerHTML = item.content;
    document.body.appendChild(element);
    
    const options = {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        width: element.offsetWidth,
        height: element.scrollHeight
    };
    
    html2canvas(element, options).then(canvas => {
        document.body.removeChild(element);
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = pdf.internal.pageSize.getWidth() - 20;
        const pageHeight = pdf.internal.pageSize.getHeight() - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 30;
        let pageCount = 1;
        
        // Add header to first page
        pdf.setFontSize(12);
        pdf.text(`TeachIQ - ${item.type}`, 10, 10);
        pdf.text(`Topic: ${item.topic}`, 10, 16);
        pdf.text(`Generated on: ${new Date(item.timestamp).toLocaleString()}`, 10, 22);
        
        // Add first page content
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pageCount++;
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Add page numbers to all pages
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i);
            pdf.setFontSize(10);
            pdf.text(`Page ${i} of ${pageCount}`, pdf.internal.pageSize.getWidth() - 30, pdf.internal.pageSize.getHeight() - 10);
            pdf.text('Generated by TeachIQ', 10, pdf.internal.pageSize.getHeight() - 10);
        }
        
        pdf.save(`${item.topic.replace(/[^a-z0-9]/gi, '_')}_${new Date(item.timestamp).toISOString().slice(0,10)}.pdf`);
    }).catch(error => {
        document.body.removeChild(element);
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    });
}

    function deleteHistoryItem(index) {
    if (!confirm('Are you sure you want to delete this item from your history?')) {
        return;
    }
    
    try {
        const history = JSON.parse(localStorage.getItem('TeachIQHistory')) || [];
        history.splice(index, 1);
        localStorage.setItem('TeachIQHistory', JSON.stringify(history));
        initializeHistory(); // Refresh the history display
        
        // If the deleted item is currently displayed, clear the output
        const outputContent = document.getElementById('outputContent');
        const currentHistory = JSON.parse(localStorage.getItem('TeachIQHistory')) || [];
        if (!currentHistory.some(item =>outputContent.innerHTML.includes(item.topic))) {
            outputContent.innerHTML = '<p class="output-placeholder">Select an item from history to view it here.</p>';
        }
    } catch (error) {
        console.error('Error deleting history item:', error);
        alert('Failed to delete history item. Please try again.');
    }
}
    
    function addToHistory(type, topic, content) {
    try {
         // Get existing history or create new array
        let history = [];
        const historyData = localStorage.getItem('TeachIQHistory');
        
        if (historyData) {
            try {
                history = JSON.parse(historyData);
                if (!Array.isArray(history)) {
                    throw new Error('History data is not an array');
                }
            } catch (error) {
                console.error('Error parsing history data:', error);
                history = [];
            }
        }
        
        // Validate input data
        if (!type || !topic || !content) {
            throw new Error('Invalid history item data');
        }
        
        
          // Get the display name for the content type
        const contentTypeSelect = document.getElementById('contentType');
        let typeName = '';
        for (let i = 0; i < contentTypeSelect.options.length; i++) {
            if (contentTypeSelect.options[i].value === type) {
                typeName = contentTypeSelect.options[i].text;
                break;
            }
        }
        
        // Add new item to beginning of array
        history.unshift({
            type: document.getElementById('contentType').options[document.getElementById('contentType').selectedIndex].text,
            topic: topic,
            content: content,
            timestamp: new Date().toISOString()
        });
        
        // Limit history size
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        //save back to localStorage
        localStorage.setItem('TeachIQHistory', JSON.stringify(history));
        
        // Refresh history display
        initializeHistory();
        
    } catch (error) {
        console.error('Error adding to history:', error);
        // Don't throw error to prevent breaking the main functionality
    }
}
    
function displayHistoryItem(item) {
    // First check if the item still exists in history
    const history = JSON.parse(localStorage.getItem('TeachIQHistory')) || [];
    const itemExists = history.some(histItem => histItem.timestamp === item.timestamp);
    
    if (!itemExists) {
        outputContent.innerHTML = `
            <div class="error-content">
                <p>This content is no longer available in your history.</p>
            </div>
        `;
        return;
    }

    const contentTypeSelect = document.getElementById('contentType');
    let foundContentTypeValue = '';
    for (let i = 0; i < contentTypeSelect.options.length; i++) {
        if (contentTypeSelect.options[i].text === item.type) {
            foundContentTypeValue = contentTypeSelect.options[i].value;
            break;
        }
    }
    document.getElementById('contentType').value = foundContentTypeValue || ''; 

    document.getElementById('topic').value = item.topic;
    
    // Check if the content is already formatted (contains HTML tags)
    if (/<\/?[a-z][\s\S]*>/i.test(item.content)) {
        outputContent.innerHTML = item.content;
    } else {
        // Format plain text content
        outputContent.innerHTML = `
            <div class="content-header">
                <h2>${item.topic}</h2>
                <p class="content-meta">
                    <span class="content-type">${item.type}</span>
                </p>
            </div>
            <div class="content-body">
                ${formatBulletPoints(item.content)}
            </div>
        `;
    }
}
    
    // Template functions
    function initializeTemplates() {
        const templates = [
            {
                title: "5E Lesson Plan",
                type: "lesson_plan",
                subject: "Physical Science",
                grade: "middle",
                topic: "Scientific Method",
                details: "Create a 5E lesson plan for introducing the scientific method to middle school students. Include hands-on activities.",
                complexity: "intermediate",
                format: "bullet_points",
                icon: "fas fa-flask",
                description: "Science lesson plan using the 5E model."
            },
            {
                title: "Algebra Quiz",
                type: "quiz",
                subject: "math",
                grade: "high",
                topic: "Algebra Basics",
                details: "10-question multiple choice quiz covering linear equations and inequalities. Include an answer key.",
                complexity: "basic",
                format: "bullet_points",
                icon: "fas fa-question-circle",
                description: "Algebra quiz for high school students."
            },
            {
                title: "WWII Chapter Summary",
                type: "summary",
                subject: "history",
                grade: "high",
                topic: "World War II",
                details: "Summary of key events, figures, and outcomes of World War II. Include timeline.",
                complexity: "intermediate",
                format: "bullet_points",
                icon: "fas fa-book-open",
                description: "Comprehensive summary of World War II."
            },
            {
                title: "Elementary Story Elements Activity",
                type: "activity",
                subject: "english",
                grade: "elementary",
                topic: "Story Elements",
                details: "Group activity where students identify characters, setting, plot in a short story. Include roles for each group member.",
                complexity: "basic",
                format: "step_by_step",
                icon: "fas fa-users",
                description: "Interactive activity for identifying story elements."
            },
            {
                title: "Physics Presentation Outline",
                type: "presentation",
                subject: "science",
                grade: "high",
                topic: "Newton's Laws of Motion",
                details: "Outline for a presentation covering Newton's three laws with real-world examples and diagrams.",
                complexity: "advanced",
                format: "bullet_points",
                icon: "fas fa-chalkboard-teacher",
                description: "High school physics presentation outline."
            },
            {
                title: "College Research Study Guide",
                type: "study_guide",
                subject: "computer",
                grade: "college",
                topic: "Data Structures",
                details: "Study guide for fundamental data structures: arrays, linked lists, trees, graphs. Include definitions, operations, and complexities.",
                complexity: "advanced",
                format: "table",
                icon: "fas fa-laptop-code",
                description: "Advanced study guide for computer science."
            }
        ];
        
        const templateGallery = document.getElementById('templateGallery');
        templateGallery.innerHTML = '';
        
        templates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'feature-card';
            templateCard.innerHTML = `
                <div class="feature-icon">
                    <i class="${template.icon}"></i>
                </div>
                <h3>${template.title}</h3>
                <p>${template.description}</p>
                <button class="btn" style="margin-top: 15px; width: 100%;" data-template-type="${template.type}">
                    <i class="fas fa-plus"></i> Use Template
                </button>
            `;
            templateCard.querySelector('button').addEventListener('click', () => {
                useTemplate(template); 
            });
            templateGallery.appendChild(templateCard);
        });
    }
    
    function useTemplate(template) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelector('.tab[data-tab="generator"]').classList.add('active');
        document.getElementById('generator-tab').classList.add('active');
        
        document.getElementById('contentType').value = template.type;
        document.getElementById('subjectArea').value = template.subject;
        document.getElementById('gradeLevel').value = template.grade;
        document.getElementById('topic').value = template.topic;
        document.getElementById('details').value = template.details;
        document.getElementById('complexity').value = template.complexity;
        document.getElementById('format').value = template.format;
        
        document.getElementById('topic').focus();
    }
});

// Improved scroll prevention logic
document.addEventListener('wheel', function(e) {
    const activeElement = document.querySelector('.tab-content.active');
    if (activeElement && activeElement.contains(e.target)) {
        const element = e.target;
        if (element.scrollHeight > element.clientHeight) {
            const isAtTop = element.scrollTop === 0;
            const isAtBottom = element.scrollHeight - element.scrollTop === element.clientHeight;
            
            if ((e.deltaY < 0 && isAtTop) || (e.deltaY > 0 && isAtBottom)) {
                e.preventDefault();
            }
        }
    }
}, { passive: false });

function migrateOldHistory() {
    try {
        const oldHistory = localStorage.getItem('history');
        if (oldHistory) {
            const parsed = JSON.parse(oldHistory);
            if (Array.isArray(parsed)) {
                localStorage.setItem('TeachIQHistory', oldHistory);
                localStorage.removeItem('history');
            }
        }
    } catch (error) {
        console.error('Error migrating old history:', error);
    }
}

// Call this at the start of your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    migrateOldHistory();
    // ... rest of your existing code
});