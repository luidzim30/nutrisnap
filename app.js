const app = {
    views: {},
    state: {
        goal: '',
    },
    stream: null,
    freeAnalysesUsed: parseInt(localStorage.getItem('free_analyses') || '0'),

    init() {
        // Cache views
        document.querySelectorAll('.view').forEach(v => {
            this.views[v.id] = v;
        });

        // Check trial limit
        if(this.freeAnalysesUsed >= 1) {
            this.switchView('view-paywall');
        }
    },

    switchView(viewId) {
        Object.values(this.views).forEach(v => v.classList.remove('active'));
        this.views[viewId].classList.add('active');
    },

    // ---- WIZARD FLOW (10 STEPS) ----
    currentStep: 1,
    startWizard() {
        this.switchView('view-wizard');
        this.updateProgress();
    },

    wizardNext(goalValue = null) {
        if(goalValue) this.state.goal = goalValue;

        const steps = document.querySelectorAll('.w-step');
        if(this.currentStep < steps.length) {
            steps[this.currentStep-1].classList.remove('active');
            this.currentStep++;
            steps[this.currentStep-1].classList.add('active');
            this.updateProgress();
        }
    },

    updateProgress() {
        const total = document.querySelectorAll('.w-step').length;
        document.getElementById('wizard-progress').style.width = `${(this.currentStep/total)*100}%`;
    },

    finishWizard() {
        // Save goal
        localStorage.setItem('user_goal', this.state.goal);

        this.switchView('view-analysis');
        this.runFakeAnalysis();
    },

    // ---- FAKE ANALYSIS ----
    runFakeAnalysis() {
        const listItems = document.querySelectorAll('#analysis-list li');
        let index = 0;

        const interval = setInterval(() => {
            if(index > 0) listItems[index-1].style.color = "#10b981"; 
            
            if(index < listItems.length) {
                listItems[index].classList.remove('hidden');
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => this.openCamera(), 1000);
            }
        }, 800); // Mais rápido que antes
    },

    // ---- CAMERA (FREE TRIAL) ----
    async openCamera() {
        this.switchView('view-camera');
        try {
            const video = document.getElementById('camera-stream');
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = this.stream;
        } catch (err) {
            console.log("Câmera bloqueada/indisponível.");
        }
    },

    capturePhoto() {
        if(this.freeAnalysesUsed >= 1) {
            this.showPaywall();
            return;
        }

        const video = document.getElementById('camera-stream');
        const canvas = document.getElementById('canvas');
        canvas.width = video.videoWidth || 400;
        canvas.height = video.videoHeight || 400;
        const ctx = canvas.getContext('2d');
        
        if(video.videoWidth > 0) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        else { ctx.fillStyle = "#111"; ctx.fillRect(0,0,canvas.width,canvas.height); }

        document.getElementById('preview-image').src = canvas.toDataURL('image/jpeg');

        if (this.stream) this.stream.getTracks().forEach(t => t.stop());

        this.freeAnalysesUsed++;
        localStorage.setItem('free_analyses', this.freeAnalysesUsed.toString());

        this.switchView('view-loading');
        setTimeout(() => this.showResults(), 3500);
    },

    // ---- RESULTS ----
    showResults() {
        // Hora atual para brincar com o "Devo comer agora?"
        const hour = new Date().getHours();
        let eatNowStatus = "";
        
        const db = [
            { name: "Prato Completo Saudável", cal: 420, p: 35, c: 40, f: 12, v: "Alto" },
            { name: "Lanche Rápido", cal: 550, p: 15, c: 60, f: 25, v: "Baixo" }
        ];

        const isEmagrecer = localStorage.getItem('user_goal') === 'emagrecer';
        const food = isEmagrecer ? db[1] : db[0]; 

        // Regra simples baseada na hora para gamificar
        if (hour > 22 || hour < 6) {
            eatNowStatus = "NÃO. Já é muito tarde, evite carboidratos pesados agora.";
        } else if (hour > 11 && hour < 15) {
            eatNowStatus = "SIM, excelente horário para sua refeição principal.";
        } else {
            eatNowStatus = "SIM, mas com moderação se for apenas um lanche.";
        }

        document.getElementById('food-calories').textContent = food.cal;
        document.getElementById('food-name').textContent = food.name;
        document.getElementById('food-protein').textContent = food.p + "g";
        document.getElementById('food-carbs').textContent = food.c + "g";
        document.getElementById('food-fats').textContent = food.f + "g";
        document.getElementById('food-vitamins').textContent = food.v;
        document.getElementById('eat-now-status').textContent = eatNowStatus;

        const fbBox = document.getElementById('ai-feedback');
        const fbTitle = document.getElementById('feedback-title');
        const fbText = document.getElementById('feedback-text');
        
        fbBox.className = 'ai-feedback'; 

        if(isEmagrecer && food.c > 50) {
            fbBox.classList.add('danger');
            fbTitle.textContent = "Alerta de Carboidrato";
            fbText.textContent = "Este prato possui muito carboidrato, o que atrasa sua perda de peso. Prefira mais proteínas e fibras na próxima refeição.";
        } else {
            fbBox.classList.add('success');
            fbTitle.textContent = "Veredito Positivo";
            fbText.textContent = "Bons nutrientes! Ajuda a sustentar energia ao longo do dia.";
        }

        this.switchView('view-result');
    },

    // ---- PAYWALL ----
    showPaywall() {
        if(this.stream) this.stream.getTracks().forEach(t => t.stop());
        this.switchView('view-paywall');
    }
};

document.addEventListener("DOMContentLoaded", () => app.init());
