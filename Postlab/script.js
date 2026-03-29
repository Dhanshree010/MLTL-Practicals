// Initialize system
const InventorySystem = {
    inventory: {},
    customModel: null,
    mobilenet: null,
    knnClassifier: null,
    cocoModel: null,
    predictions: {},
    billItems: [],
    detectionCount: 0,
    
    // Default product prices (₹)
    productPrices: {
        'bottle': 50,
        'cup': 20,
        'bowl': 30,
        'book': 100,
        'cell phone': 15000,
        'laptop': 45000,
        'mouse': 500,
        'keyboard': 1500,
        'person': 0,
        'chair': 2000,
        'default': 50
    },
    
    async init() {
        console.log('Initializing AI Inventory System...');
        await this.loadModels();
        this.loadInventory();
        this.setupEventListeners();
        this.updateStats();
        this.updateUI();
    },
    
    async loadModels() {
        try {
            console.log('Loading COCO-SSD model...');
            this.cocoModel = await cocoSsd.load();
            console.log('COCO-SSD loaded successfully');
            
            console.log('Loading MobileNet for transfer learning...');
            this.mobilenet = await mobilenet.load();
            this.knnClassifier = knnClassifier.create();
            console.log('Transfer learning models loaded');
        } catch (error) {
            console.error('Error loading models:', error);
            alert('Error loading AI models. Please refresh the page.');
        }
    },
    
    setupEventListeners() {
        // Camera controls
        document.getElementById('startCamera').addEventListener('click', () => this.startCamera());
        document.getElementById('stopCamera').addEventListener('click', () => this.stopCamera());
        document.getElementById('captureImage').addEventListener('click', () => this.detectObjects());
        
        // Manual inventory
        document.getElementById('addManualItem').addEventListener('click', () => this.addManualItem());
        
        // Custom training
        document.getElementById('uploadBox').addEventListener('click', () => {
            document.getElementById('customImages').click();
        });
        document.getElementById('customImages').addEventListener('change', (e) => this.handleImageUpload(e));
        document.getElementById('trainModel').addEventListener('click', () => this.trainCustomModel());
        document.getElementById('testCustomModel').addEventListener('click', () => this.testCustomDetection());
        
        // Demand prediction
        document.getElementById('predictDemand').addEventListener('click', () => this.predictDemand());
        
        // Billing
        document.getElementById('addToBill').addEventListener('click', () => this.addToBill());
        document.getElementById('downloadBill').addEventListener('click', () => this.downloadBill());
        document.getElementById('clearBill').addEventListener('click', () => this.clearBill());
    },
    
    async startCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            const video = document.getElementById('videoElement');
            video.srcObject = stream;
            document.getElementById('cameraStatus').textContent = 'Active';
            document.getElementById('cameraStatus').classList.add('active');
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please check permissions.');
        }
    },
    
    stopCamera() {
        const video = document.getElementById('videoElement');
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            document.getElementById('cameraStatus').textContent = 'Offline';
            document.getElementById('cameraStatus').classList.remove('active');
        }
    },
    
    async detectObjects() {
        const video = document.getElementById('videoElement');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!video.srcObject) {
            alert('Please start the camera first');
            return;
        }
        
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.classList.remove('hidden');
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Detect objects
        const predictions = await this.cocoModel.detect(canvas);
        
        // Draw bounding boxes
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 3;
        ctx.font = '16px JetBrains Mono';
        ctx.fillStyle = '#00d9ff';
        
        const detectedItems = {};
        
        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            ctx.strokeRect(x, y, width, height);
            ctx.fillText(
                `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
                x, y - 5
            );
            
            // Count items
            if (!detectedItems[prediction.class]) {
                detectedItems[prediction.class] = 0;
            }
            detectedItems[prediction.class]++;
        });
        
        // Update inventory
        for (const [product, count] of Object.entries(detectedItems)) {
            this.updateInventoryItem(product, count);
        }
        
        this.detectionCount++;
        this.updateStats();
        this.showDetectionResults(detectedItems);
        
        // Hide canvas after 3 seconds
        setTimeout(() => {
            canvas.classList.add('hidden');
        }, 3000);
    },
    
    updateInventoryItem(product, quantity) {
        if (!this.inventory[product]) {
            this.inventory[product] = {
                name: product,
                quantity: 0,
                price: this.productPrices[product] || this.productPrices.default,
                lastUpdated: new Date().toISOString()
            };
        }
        
        this.inventory[product].quantity = quantity;
        this.inventory[product].lastUpdated = new Date().toISOString();
        this.saveInventory();
        this.updateUI();
    },
    
    showDetectionResults(items) {
        const container = document.getElementById('detectionResults');
        const itemCount = Object.keys(items).length;
        
        container.innerHTML = `
            <div class="alert alert-success" style="margin-top: 1rem;">
                <strong>✓ Detection Complete!</strong><br>
                Found ${itemCount} product type(s):
                ${Object.entries(items).map(([name, count]) => 
                    `<br>• ${name}: ${count} unit(s)`
                ).join('')}
            </div>
        `;
    },
    
    addManualItem() {
        const name = prompt('Product name:');
        if (!name) return;
        
        const quantity = parseInt(prompt('Quantity:', '10'));
        const price = parseFloat(prompt('Price (₹):', '50'));
        
        this.inventory[name] = {
            name,
            quantity,
            price,
            lastUpdated: new Date().toISOString()
        };
        
        this.saveInventory();
        this.updateUI();
    },
    
    async handleImageUpload(event) {
        const files = event.target.files;
        const container = document.getElementById('trainingImages');
        container.innerHTML = '';
        
        for (let file of files) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.style.width = '100%';
                img.style.borderRadius = '8px';
                img.style.border = '2px solid var(--border-color)';
                container.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    },
    
    async trainCustomModel() {
        const productName = document.getElementById('customProductName').value.trim();
        if (!productName) {
            alert('Please enter a product name');
            return;
        }
        
        const files = document.getElementById('customImages').files;
        if (files.length < 5) {
            alert('Please upload at least 5 images for training');
            return;
        }
        
        const progressDiv = document.getElementById('trainingProgress');
        progressDiv.innerHTML = `
            <div class="training-status">Training model...</div>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        `;
        
        let completed = 0;
        
        for (let file of files) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            
            await new Promise((resolve) => {
                img.onload = async () => {
                    const activation = this.mobilenet.infer(img, 'conv_preds');
                    this.knnClassifier.addExample(activation, productName);
                    completed++;
                    
                    const progress = (completed / files.length) * 100;
                    document.getElementById('progressFill').style.width = progress + '%';
                    resolve();
                };
            });
        }
        
        progressDiv.innerHTML = `
            <div class="alert alert-success">
                ✓ Model trained successfully with ${files.length} images!
            </div>
        `;
        
        document.getElementById('trainingStatus').textContent = 'Trained';
        document.getElementById('trainingStatus').classList.add('active');
        
        // Add to inventory
        this.inventory[productName] = {
            name: productName,
            quantity: 0,
            price: this.productPrices.default,
            lastUpdated: new Date().toISOString(),
            isCustom: true
        };
        
        this.saveInventory();
        this.updateUI();
    },
    
    async testCustomDetection() {
        const video = document.getElementById('videoElement');
        if (!video.srcObject) {
            alert('Please start the camera first');
            return;
        }
        
        if (this.knnClassifier.getNumClasses() === 0) {
            alert('Please train a custom model first');
            return;
        }
        
        const activation = this.mobilenet.infer(video, 'conv_preds');
        const result = await this.knnClassifier.predictClass(activation);
        
        alert(`Detected: ${result.label} (Confidence: ${Math.round(result.confidences[result.label] * 100)}%)`);
        
        this.updateInventoryItem(result.label, 1);
    },
    
    async predictDemand() {
        const productName = document.getElementById('productSelect').value;
        const salesDataStr = document.getElementById('salesData').value.trim();
        
        if (!productName || !salesDataStr) {
            alert('Please select a product and enter sales data');
            return;
        }
        
        const salesData = salesDataStr.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
        
        if (salesData.length < 3) {
            alert('Please enter at least 3 data points');
            return;
        }
        
        // Simple linear regression prediction
        const n = salesData.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y = salesData;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Predict next 7 days
        const predictions = [];
        for (let i = 0; i < 7; i++) {
            predictions.push(Math.max(0, Math.round(slope * (n + i) + intercept)));
        }
        
        const avgPrediction = Math.round(predictions.reduce((a, b) => a + b) / predictions.length);
        
        // Store prediction
        this.predictions[productName] = {
            historical: salesData,
            predicted: predictions,
            avgNextWeek: avgPrediction
        };
        
        // Update chart
        this.updateDemandChart(productName, salesData, predictions);
        
        // Show results
        document.getElementById('predictionResults').innerHTML = `
            <div class="alert alert-info" style="margin-top: 1rem;">
                <strong>📈 Prediction Results</strong><br>
                Expected demand next week: <strong>${avgPrediction} units</strong><br>
                Daily forecast: ${predictions.join(', ')} units
            </div>
        `;
        
        // Update suggestions
        this.updateSuggestions(productName);
    },
    
    updateDemandChart(productName, historical, predicted) {
        const ctx = document.getElementById('demandChart').getContext('2d');
        
        if (window.demandChart) {
            window.demandChart.destroy();
        }
        
        const labels = [
            ...historical.map((_, i) => `Day ${i + 1}`),
            ...predicted.map((_, i) => `Day ${historical.length + i + 1}`)
        ];
        
        window.demandChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Historical Sales',
                    data: [...historical, ...Array(predicted.length).fill(null)],
                    borderColor: '#00d9ff',
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Predicted Demand',
                    data: [...Array(historical.length).fill(null), ...predicted],
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderDash: [5, 5],
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#e5e7eb', font: { family: 'JetBrains Mono' } }
                    }
                },
                scales: {
                    x: { 
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } },
                        grid: { color: 'rgba(0, 217, 255, 0.1)' }
                    },
                    y: { 
                        ticks: { color: '#9ca3af', font: { family: 'JetBrains Mono' } },
                        grid: { color: 'rgba(0, 217, 255, 0.1)' }
                    }
                }
            }
        });
    },
    
    updateSuggestions(productName) {
        const prediction = this.predictions[productName];
        const currentStock = this.inventory[productName]?.quantity || 0;
        const expectedDemand = prediction.avgNextWeek;
        
        const reorderAmount = Math.max(0, expectedDemand - currentStock);
        
        const container = document.getElementById('suggestions');
        
        if (reorderAmount > 0) {
            container.innerHTML = `
                <div class="alert alert-warning">
                    <strong>⚠️ Restocking Alert: ${productName}</strong><br><br>
                    Current Stock: <strong>${currentStock} units</strong><br>
                    Expected Demand: <strong>${expectedDemand} units/week</strong><br>
                    <br>
                    <div style="font-size: 1.2rem; margin-top: 1rem;">
                        👉 <strong>You need to restock ${reorderAmount} units</strong>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="alert alert-success">
                    <strong>✓ Stock Level Optimal: ${productName}</strong><br><br>
                    Current Stock: <strong>${currentStock} units</strong><br>
                    Expected Demand: <strong>${expectedDemand} units/week</strong><br>
                    <br>
                    No restocking needed at this time.
                </div>
            `;
        }
    },
    
    addToBill() {
        const productName = document.getElementById('billProductSelect').value;
        const quantity = parseInt(document.getElementById('billQuantity').value);
        
        if (!productName || !quantity || quantity <= 0) {
            alert('Please select a product and enter a valid quantity');
            return;
        }
        
        const product = this.inventory[productName];
        if (quantity > product.quantity) {
            alert(`Not enough stock! Available: ${product.quantity}`);
            return;
        }
        
        this.billItems.push({
            name: productName,
            quantity,
            price: product.price,
            total: quantity * product.price
        });
        
        this.updateBillUI();
        document.getElementById('billQuantity').value = '';
    },
    
    updateBillUI() {
        const container = document.getElementById('billItems');
        const total = this.billItems.reduce((sum, item) => sum + item.total, 0);
        
        container.innerHTML = this.billItems.map(item => `
            <div class="bill-item">
                <div>
                    <strong>${item.name}</strong><br>
                    <small>${item.quantity} × ₹${item.price}</small>
                </div>
                <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700;">
                    ₹${item.total.toFixed(2)}
                </div>
            </div>
        `).join('');
        
        document.getElementById('billTotal').textContent = total.toFixed(2);
    },
    
    downloadBill() {
        if (this.billItems.length === 0) {
            alert('Bill is empty');
            return;
        }
        
        const total = this.billItems.reduce((sum, item) => sum + item.total, 0);
        const billText = `
AI SMART INVENTORY SYSTEM
====================================
Date: ${new Date().toLocaleString()}
====================================

${this.billItems.map(item => 
`${item.name}
Qty: ${item.quantity} × ₹${item.price} = ₹${item.total.toFixed(2)}`
).join('\n\n')}

====================================
TOTAL: ₹${total.toFixed(2)}
====================================

Thank you for your business!
        `;
        
        const blob = new Blob([billText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill_${Date.now()}.txt`;
        a.click();
    },
    
    clearBill() {
        this.billItems = [];
        this.updateBillUI();
    },
    
    updateUI() {
        // Update inventory list
        const inventoryList = document.getElementById('inventoryList');
        const items = Object.values(this.inventory);
        
        if (items.length === 0) {
            inventoryList.innerHTML = `
                <div style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                    No items in inventory. Start detecting or add manually.
                </div>
            `;
        } else {
            inventoryList.innerHTML = items.map(item => `
                <div class="inventory-item ${item.quantity < 5 ? 'low-stock' : ''}">
                    <div class="item-info">
                        <div class="item-name">
                            ${item.name}
                            ${item.isCustom ? '<span style="color: var(--accent-purple);">★</span>' : ''}
                        </div>
                        <div class="item-meta">
                            ₹${item.price} • Updated: ${new Date(item.lastUpdated).toLocaleString()}
                        </div>
                    </div>
                    <div class="item-quantity ${item.quantity < 5 ? 'low' : ''}">
                        ${item.quantity}
                    </div>
                </div>
            `).join('');
        }
        
        // Update product selects
        const productOptions = items.map(item => 
            `<option value="${item.name}">${item.name}</option>`
        ).join('');
        
        document.getElementById('productSelect').innerHTML = 
            '<option value="">Select product for prediction...</option>' + productOptions;
        document.getElementById('billProductSelect').innerHTML = 
            '<option value="">Select product...</option>' + productOptions;
        
        // Update alerts
        const lowStockItems = items.filter(item => item.quantity < 5);
        const alertsDiv = document.getElementById('inventoryAlerts');
        
        if (lowStockItems.length > 0) {
            alertsDiv.innerHTML = `
                <div class="alert alert-warning">
                    ⚠️ <strong>${lowStockItems.length} item(s) low on stock:</strong>
                    ${lowStockItems.map(item => `${item.name} (${item.quantity})`).join(', ')}
                </div>
            `;
        } else {
            alertsDiv.innerHTML = '';
        }
    },
    
    updateStats() {
        const items = Object.values(this.inventory);
        document.getElementById('totalProducts').textContent = items.length;
        document.getElementById('totalStock').textContent = 
            items.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('lowStockCount').textContent = 
            items.filter(item => item.quantity < 5).length;
        document.getElementById('detectionCount').textContent = this.detectionCount;
    },
    
    saveInventory() {
        localStorage.setItem('inventory', JSON.stringify(this.inventory));
    },
    
    loadInventory() {
        const saved = localStorage.getItem('inventory');
        if (saved) {
            this.inventory = JSON.parse(saved);
        }
    }
};

// Initialize on page load
window.addEventListener('load', () => {
    InventorySystem.init();
});